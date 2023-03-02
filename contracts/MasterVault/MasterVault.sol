// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "../ceros/interfaces/ICerosRouter.sol";
import "../ceros/interfaces/IDavosProvider.sol";
import "../ceros/interfaces/ICertToken.sol";
import "../ceros/interfaces/IDao.sol";
import "../ceros/interfaces/IPriceGetter.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IMasterVault.sol";
import "./interfaces/IWaitingPool.sol";
import "../Strategy/IBaseStrategy.sol";
contract MasterVault is
IMasterVault,
ERC4626Upgradeable,
OwnableUpgradeable,
PausableUpgradeable,
ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /**
     * Variables
     */
    struct StrategyParams {
        bool active;
        uint256 allocation;
        uint256 debt;
    }

    IWaitingPool public waitingPool;
    
    address public feeReceiver;
    address public _provider;

    uint256 public depositFee;
    uint256 public maxDepositFee;
    uint256 public withdrawalFee;
    uint256 public maxWithdrawalFee;
    uint256 public MAX_STRATEGIES;
    uint256 public totalDebt;          // Amount of tokens that all strategies have borrowed
    uint256 public feeEarned;
    address[] public strategies;

    mapping(address => bool) public manager;
    mapping (address => StrategyParams) public strategyParams;

    uint256 public allocateOnDeposit;
    
    /**
     * Modifiers
     */
    modifier onlyProvider() {
        require(
            msg.sender == owner() || msg.sender == _provider,
            "Provider: not allowed"
        );
        _;
    }
    modifier onlyManager() {
        require(
            manager[msg.sender],
            "Manager: not allowed"
        );
        _;
    }

    /// @dev initialize function - Constructor for Upgradable contract, can be only called once during deployment
    /// @dev Deploys the contract and sets msg.sender as owner
    /// @param name name of the vault token
    /// @param symbol symbol of the vault token
    /// @param maxDepositFees Fees charged in parts per million; 1% = 10000ppm
    /// @param maxWithdrawalFees Fees charged in parts per million; 1% = 10000ppm
    /// @param asset underlying asset address
    /// @param maxStrategies Number of maximum strategies
    function initialize(
        string memory name,
        string memory symbol,
        uint256 maxDepositFees,
        uint256 maxWithdrawalFees,
        IERC20MetadataUpgradeable asset,
        uint8 maxStrategies
    ) public initializer {
        require(maxDepositFees > 0 && maxDepositFees <= 1e6, "invalid maxDepositFee");
        require(maxWithdrawalFees > 0 && maxWithdrawalFees <= 1e6, "invalid maxWithdrawalFees");

        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __ERC20_init(name, symbol);
        __ERC4626_init(asset);
        manager[msg.sender] = true;
        maxDepositFee = maxDepositFees;
        maxWithdrawalFee = maxWithdrawalFees;
        MAX_STRATEGIES = maxStrategies;
        feeReceiver = msg.sender;
    }
    
    /// @dev deposits assets and mints shares(amount - swapFee + depositFee) to callers address
    /// @return shares - number of minted vault tokens
    function depositMatic(uint256 amount) 
    external
    override
    nonReentrant
    whenNotPaused 
    onlyProvider 
    returns (uint256 shares) {        
        require(amount > 0, "invalid amount");
        address src = msg.sender;
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(asset()), msg.sender, address(this), amount);

        shares = _assessFee(shares, depositFee);

        uint256 waitingPoolDebt = waitingPool.totalDebt();
        uint256 waitingPoolBalance = IERC20Upgradeable(asset()).balanceOf(address(waitingPool));

        // check and fullfil the pending withdrawals of the waiting pool first
        if(waitingPoolDebt > 0 && waitingPoolBalance < waitingPoolDebt) {
            uint256 waitingPoolDebtDiff = waitingPoolDebt - waitingPoolBalance;
            uint256 poolAmount = (waitingPoolDebtDiff < shares) ? waitingPoolDebtDiff : shares;
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(asset()), address(waitingPool), poolAmount);
        }
        _mint(src, shares);

        if(allocateOnDeposit == 1) {
            allocate();
        }
        emit Deposit(src, src, amount, shares);
    }

    /// @dev deposits specific amount of assets into the given strategy
    /// @param strategy address of the strategy
    /// @param amount assets to deposit into strategy
    function depositToStrategy(address strategy, uint256 amount) public onlyManager {
        require(_depositToStrategy(strategy, amount));
    }

    /// @dev deposits all the assets into the given strategy
    /// @param strategy address of the strategy
    function depositAllToStrategy(address strategy) public onlyManager {
        uint256 amount = totalAssetInVault();
        require(_depositToStrategy(strategy, amount));
    }

    /// @dev internal method to deposit assets into the given strategy
    /// @param strategy address of the strategy
    /// @param amount assets to deposit into strategy
    function _depositToStrategy(address strategy, uint256 amount) private returns (bool success) {
        require(amount > 0, "invalid deposit amount");
        require(strategyParams[strategy].active, "invalid strategy address");
        require(totalAssetInVault() >= amount, "insufficient balance");

        amount = IBaseStrategy(strategy).canDeposit(amount);
        if(amount <= 0) return false;

        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(asset()), strategy, amount);
        uint256 value = IBaseStrategy(strategy).deposit(amount);
        if(value > 0) {
            totalDebt += value;
            strategyParams[strategy].debt += value;
            emit DepositedToStrategy(strategy, amount, value);
            return true;
        }
    }

    /// @dev Tries to allocate funds to strategies based on their allocations.
    ///      (It will be triggered mostly in case of deposits to avoid unnecessary swapFees)
    function allocate() public {
        for(uint8 i = 0; i < strategies.length; i++) {
            if(strategyParams[strategies[i]].active) {
                StrategyParams memory strategy =  strategyParams[strategies[i]];
                uint256 allocation = strategy.allocation;
                if(allocation > 0) {
                    uint256 totalAssetAndDebt = totalAssetInVault() + totalDebt;
                    uint256 strategyRatio = (strategy.debt * 1e6) / totalAssetAndDebt;
                    if(strategyRatio < allocation) {
                        uint256 depositAmount = ((totalAssetAndDebt * allocation) / 1e6) - strategy.debt;
                        if(totalAssetInVault() > depositAmount && depositAmount > 0) {
                            _depositToStrategy(strategies[i], depositAmount);
                        }
                    }
                }
            }
        }
    }

    /// @dev burns vault tokens and withdraws(amount - withdrawalFee) to recipient's address
    /// @param account receipient's address
    /// @param amount amount of assets to withdraw
    /// @return shares amount of assets(excluding fee)
    function withdrawMatic(address account, uint256 amount) 
    external
    override
    nonReentrant 
    whenNotPaused
    onlyProvider 
    returns (uint256 shares) {
        require(amount > 0, "invalid withdrawal amount");
        address src = msg.sender;
        shares = amount;
        _burn(src, shares);
        uint256 maticBalance = totalAssetInVault();
        if(maticBalance < amount) {
            // Strategy should use 'account' as recipient if delayed unstake, else use 'msg.sender' as recipient
            (uint256 withdrawn, bool delayed) = _withdrawFromActiveStrategies(account, amount - maticBalance);
            if(withdrawn == 0) {
                // deduct withdrawalFee and then submit to waiting pool
                shares = _assessFee(shares, withdrawalFee);
                waitingPool.addToQueue(account, shares);
                if(maticBalance > 0) {
                    SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(asset()), address(waitingPool), maticBalance);
                }
                emit Withdraw(src, src, src, amount, shares);
                return amount;
            } else if (delayed) { 
                // Delayed Unstake: 'withdrawn' goes to 'account' from strategy
                shares = maticBalance;
            } else {
                // Immediate Unstake: 'withdrawn' comes to MasterVault
                shares = maticBalance + withdrawn;
            }
        }
        shares = _assessFee(shares, withdrawalFee);
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(asset()), account, shares);

        emit Withdraw(src, src, src, amount, shares);
        return amount;
    }

    /// @dev withdraw specific amount of assets from the given strategy
    /// @param strategy address of the strategy
    /// @param amount assets to withdraw from the strategy
    function withdrawFromStrategy(address strategy, uint256 amount) public onlyManager {
        (uint256 withdrawn,) = _withdrawFromStrategy(address(this), strategy, amount);
        require(withdrawn > 0, "cannot withdraw from strategy");
    }

    /// @dev withdraw strategy's total debt
    /// @param strategy address of the strategy
    function withdrawAllFromStrategy(address strategy) external onlyManager {
        (uint256 withdrawn,) = _withdrawFromStrategy(address(this), strategy, strategyParams[strategy].debt);
        require(withdrawn > 0, "cannot withdraw from strategy");
    }

    /// @dev internal function to withdraw specific amount of assets from the given strategy
    /// @param strategy address of the strategy
    /// @param amount assets to withdraw from the strategy
    /// NOTE: subtracts the given amount of assets instead of value(withdrawn funds) because 
    ///       of the swapFee that is deducted in the swapPool contract and that fee needs 
    ///       to be paid by the users only
    function _withdrawFromStrategy(address recipient, address strategy, uint256 amount) private returns(uint256, bool) {
        require(amount > 0, "invalid withdrawal amount");
        // check if strategy have debt >= amount(no need to check if strategy is active)
        require(strategyParams[strategy].debt >= amount, "insufficient assets in strategy");
        (uint256 value, bool delayed) = IBaseStrategy(strategy).withdraw(recipient, amount);
        require(value >= amount, "invalid withdrawn amount");
        
        totalDebt -= amount;
        strategyParams[strategy].debt -= amount;
        emit WithdrawnFromStrategy(strategy, amount, value);
        
        return (value, delayed);
    }

    /// @dev attemps withdrawal from the strategies
    /// @param amount assets to withdraw from strategy
    /// @return withdrawn - assets withdrawn from the strategy
    function _withdrawFromActiveStrategies(address recipient, uint256 amount) private returns(uint256 withdrawn, bool delayed) {
        for(uint8 i = 0; i < strategies.length; i++) {
           if(strategyParams[strategies[i]].active && 
              strategyParams[strategies[i]].debt >= amount) {
                return _withdrawFromStrategy(recipient, strategies[i], amount);
           }
        }
    }

    /// @dev Sends required Matic Token amount to waitingPool to equalize debt
    /// @notice '_withdrawFromActiveStrategies' might have strategy with unstake delay.
    function cancelDebt() public onlyManager {
        uint256 waitingPoolDebt = waitingPool.totalDebt();
        uint256 waitingPoolBal = IERC20Upgradeable(asset()).balanceOf(address(waitingPool));
        
        uint256 withdrawn; bool delayed;
        if (waitingPoolDebt > waitingPoolBal) {
            uint256 withdrawAmount = waitingPoolDebt - waitingPoolBal;
            (withdrawn, delayed) = _withdrawFromActiveStrategies(address(waitingPool), withdrawAmount + 1);
            if(withdrawn > 0 && !delayed) {
                SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(asset()), address(waitingPool), withdrawn);
            }
        }
    }

    /// @dev Triggers tryRemove() of waiting pool contract
    function tryRemove() public onlyManager {
        waitingPool.tryRemove();
    }

    /// @dev sets new strategy
    /// @param strategy address of the strategy
    /// @param allocation percentage of total assets available in the contract 
    ///                   that needs to be allocated to the given strategy
    function setStrategy(
        address strategy,
        uint256 allocation   // 1% = 10000
        )
        external onlyOwner {
        require(strategy != address(0));
        require(strategies.length < MAX_STRATEGIES, "max strategies exceeded");

        uint256 totalAllocations;
        for(uint256 i = 0; i < strategies.length; i++) {
            if(strategies[i] == strategy) {
                revert("strategy already exists");
            }
            if(strategyParams[strategies[i]].active) {
                totalAllocations += strategyParams[strategies[i]].allocation;
            }
        }

        require(totalAllocations + allocation <= 1e6, "allocations cannot be more than 100%");

        StrategyParams memory params = StrategyParams({
            active: true,
            allocation: allocation,
            debt: 0
        });

        strategyParams[strategy] = params;
        strategies.push(strategy);
        emit StrategyAdded(strategy, allocation);
    }
    
    /// @dev withdraws all the assets from the strategy and marks it inactive
    /// @param strategy address of the strategy
    /// NOTE: To avoid any unforeseen issues because of solidity divisions 
    ///       and always be able to deactivate a strategy, 
    ///       it withdraws strategy's (debt - 10) assets and set debt to 0.
    function retireStrat(address strategy) external onlyManager {
        // require(strategyParams[strategy].active, "strategy is not active");
        if(_deactivateStrategy(strategy)) {
            return;
        }
        _withdrawFromStrategy(address(this), strategy, strategyParams[strategy].debt);
        require(_deactivateStrategy(strategy), "cannot retire strategy");
    }

    /// @dev internal function to check strategy's debt and deactive it.
    /// @param strategy address of the strategy
    function _deactivateStrategy(address strategy) private returns(bool success) {
        if (strategyParams[strategy].debt <= 10) {
            strategyParams[strategy].active = false;
            strategyParams[strategy].debt = 0;
            return true;
        }
    }

    function _isValidAllocation() private view returns(bool) {
        uint256 totalAllocations;
        for(uint256 i = 0; i < strategies.length; i++) {
            if(strategyParams[strategies[i]].active) {
                totalAllocations += strategyParams[strategies[i]].allocation;
            }
        }

        return totalAllocations <= 1e6;
    }

    /// @dev Returns the amount of assets that can be withdrawn instantly
    function availableToWithdraw() public view returns(uint256 available) {
        for(uint8 i = 0; i < strategies.length; i++) {
            available += IWETH(asset()).balanceOf(strategies[i]);   // excluding the amount that is deposited to strategies
        }
        available += totalAssetInVault();
    }

    /// @dev Returns the amount of assets present in the contract(assetBalance - feeEarned)
    function totalAssetInVault() public view returns(uint256 balance) {
        return (totalAssets() > feeEarned) ? totalAssets() - feeEarned : 0;
    }

    /// @dev migrates strategy contract - withdraws everything from the oldStrategy and 
    ///      overwrites it with new strategy
    /// @param oldStrategy address of the old strategy
    /// @param newStrategy address of the new strategy 
    /// @param newAllocation percentage of total assets available in the contract
    ///                      that needs to be allocated to the new strategy
    // NOTE: Assets will be allocated to new strategy when the allocate() function is triggered next time
    function migrateStrategy(address oldStrategy, address newStrategy, uint256 newAllocation) external onlyManager {
        require(oldStrategy != address(0));
        require(newStrategy != address(0));
        
        uint256 oldStrategyDebt = strategyParams[oldStrategy].debt;
        
        if(oldStrategyDebt > 0) {
            (uint256 withdrawn,) = _withdrawFromStrategy(address(this), oldStrategy, strategyParams[oldStrategy].debt);
            require(withdrawn > 0, "cannot withdraw from strategy");
        }
        StrategyParams memory params = StrategyParams({
            active: true,
            allocation: newAllocation,
            debt: 0
        });
        bool isValidStrategy;
        for(uint256 i = 0; i < strategies.length; i++) {
            if(strategies[i] == oldStrategy) {
                isValidStrategy = true;
                strategies[i] = newStrategy;
                strategyParams[newStrategy] = params;
                
                break;
            }
        }
        require(isValidStrategy, "invalid oldStrategy address");
        require(_deactivateStrategy(oldStrategy),"cannot deactivate old strategy");
        require(_isValidAllocation(), "allocations cannot be more than 100%");
        emit StrategyMigrated(oldStrategy, newStrategy, newAllocation);
    }

    /// @dev deducts the fee percentage from the given amount
    /// @param amount amount to deduct fee from
    /// @param fees fee percentage
    function _assessFee(uint256 amount, uint256 fees) private returns(uint256 value) {
        if(fees > 0) {
            uint256 fee = (amount * fees) / 1e6;
            value = amount - fee;
            feeEarned += fee;
        } else {
            return amount;
        }
    }

    receive() external payable {
        require(msg.sender == asset()); // only accept ETH from the WETH contract
    }

    /// @dev only owner can call this function to withdraw earned fees
    function withdrawFee() external onlyOwner{
        if(feeEarned > 0) {
            uint256 toSend = feeEarned;
            feeEarned = 0;
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(asset()), address(waitingPool), toSend);
        }
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unpause() external onlyOwner whenPaused {
        _unpause();
    }

    /// @dev only owner can set new deposit fee
    /// @param newDepositFee new deposit fee percentage
    function setDepositFee(uint256 newDepositFee) external onlyOwner {
        require(maxDepositFee > newDepositFee,"more than maxDepositFee");
        depositFee = newDepositFee;    // 1% = 10000ppm
        emit DepositFeeChanged(newDepositFee);
    }

    /// @dev only owner can set new withdrawal fee
    /// @param newWithdrawalFee new withdrawal fee percentage
    function setWithdrawalFee(uint256 newWithdrawalFee) external onlyOwner {
        require(maxWithdrawalFee > newWithdrawalFee,"more than maxWithdrawalFee");
        withdrawalFee = newWithdrawalFee;
        emit WithdrawalFeeChanged(newWithdrawalFee);
    }

    /// @dev only owner can change Deposit allocation status
    /// @param _status 0-Disabled, 1-Enabled
    function changeAllocateOnDeposit(uint256 _status) external onlyOwner {
        require(_status >= 0 && _status < 2, "status range 0-1");
        allocateOnDeposit = _status;
        emit AllocationOnDepositChangeed(_status);
    }

    /// @dev only owner can set new waiting pool address
    /// @param _waitingPool new waiting pool address
    function setWaitingPool(address _waitingPool) external onlyOwner {
        require(_waitingPool != address(0));
        waitingPool = IWaitingPool(_waitingPool);
        emit WaitingPoolChanged(_waitingPool);
    }

    /// @dev only owner can set new cap limit of waiting pool
    /// @param _cap new cap limit
    function setWaitingPoolCap(uint256 _cap) external onlyOwner {
        waitingPool.setCapLimit(_cap);
        emit WaitingPoolCapChanged(_cap);
    }

    /// @dev only owner can add new manager
    /// @param newManager new manager address
    function addManager(address newManager) external onlyOwner {
        require(newManager != address(0));
        manager[newManager] = true;
        emit ManagerAdded(newManager);
    }

    /// @dev only owner can remove manager
    /// @param _manager manager address
    function removeManager(address _manager) external onlyOwner {
        require(manager[_manager]);
        manager[_manager] = false;
        emit ManagerRemoved(_manager);
    } 

    /// @dev only owner can change provider address
    /// @param provider new provider address
    function changeProvider(address provider) external onlyOwner {
        require(provider != address(0));
        _provider = provider;
        emit ProviderChanged(provider);
    }

    /// @dev only owner can change fee receiver address
    /// @param _feeReceiver new fee receiver address
    function changeFeeReceiver(address payable _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0));
        feeReceiver = _feeReceiver;
        emit FeeReceiverChanged(_feeReceiver);
    }

    /// @dev only owner can change strategy's allocation
    /// @param strategy strategy address
    /// @param allocation new allocation - percentage of total assets available in the contract
    ///                   that needs to be allocated to the new strategy
    function changeStrategyAllocation(address strategy, uint256 allocation) external onlyOwner {
        require(strategy != address(0));        
        strategyParams[strategy].allocation = allocation;
        require(_isValidAllocation(), "allocations cannot be more than 100%");

        emit StrategyAllocationChanged(strategy, allocation);
    }
    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        // Kept only for the sake of ERC4626 standard
        revert();
    }
    function mint(uint256 shares, address receiver) public override returns (uint256) {
        // Kept only for the sake of ERC4626 standard
        revert();
    }
    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256) {
        // Kept only for the sake of ERC4626 standard
        revert();
    }
    function redeem(uint256 shares, address receiver, address owner) public override returns (uint256) {
        // Kept only for the sake of ERC4626 standard
        revert();
    }
}
