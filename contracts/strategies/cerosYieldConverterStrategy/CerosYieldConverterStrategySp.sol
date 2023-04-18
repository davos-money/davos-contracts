//SPDX-License-Identifier: MICerosRouterPolygonIT
pragma solidity ^0.8.0;

import "../../masterVault/interfaces/IMasterVault.sol";
import "../../ceros/interfaces/ISwapPool.sol";
import "../../ceros/interfaces/ICertToken.sol";
import "../../ceros/interfaces/ICerosRouterSp.sol";
import "../BaseStrategy.sol";

contract CerosYieldConverterStrategySp is BaseStrategy {

    ICerosRouterSp private _ceRouter;
    ICertToken private _certToken;
    IMasterVault public vault;

    address private _swapPool;

    bool feeFlag;

    event SwapPoolChanged(address swapPool);
    event CeRouterChanged(address ceRouter);

    /// @dev initialize function - Constructor for Upgradable contract, can be only called once during deployment
    /// @param destination Address of the ceros router contract
    /// @param feeRecipient Address of the fee recipient
    /// @param underlyingToken Address of the underlying token(wMatic)
    /// @param certToekn Address of aMATICc token
    /// @param masterVault Address of the masterVault contract
    /// @param swapPool Address of swapPool contract
    function initialize(
        address destination,
        address feeRecipient,
        address underlyingToken,
        address certToekn,
        address masterVault,
        address swapPool
    ) public initializer {
        __BaseStrategy_init(destination, feeRecipient, underlyingToken);
        _ceRouter = ICerosRouterSp(destination);
        _certToken = ICertToken(certToekn);
        _swapPool = swapPool;
        vault = IMasterVault(masterVault);
        underlying.approve(address(destination), type(uint256).max);
        underlying.approve(address(vault), type(uint256).max);
        _certToken.approve(_swapPool, type(uint256).max);
    }

    /**
     * Modifiers
     */
    modifier onlyVault() {
        require(msg.sender == address(vault), "!vault");
        _;
    }

    /// @dev deposits the given amount of underlying tokens into ceros
    /// @param amount amount of underlying tokens
    function deposit(uint256 amount) external payable override onlyVault whenNotPaused returns(uint256 value) {
        require(amount <= underlying.balanceOf(address(this)), "insufficient balance");
        return _deposit(amount);
    }

    /// @dev internal function to deposit the given amount of underlying tokens into ceros
    /// @param amount amount of underlying tokens
    function _deposit(uint256 amount) internal returns (uint256 value) {
        require(amount > 0, "invalid amount");
        _beforeDeposit(amount);
        return _ceRouter.depositWMatic(amount);
    }

    /// @dev withdraws the given amount of underlying tokens from ceros and transfers to masterVault
    /// @param amount amount of underlying tokens
    function withdraw(address recipient, uint256 amount) external payable override onlyVault whenNotPaused returns(uint256 value) {
        return _withdraw(amount);
    }

    /// @dev internal function to withdraw the given amount of underlying tokens from ceros
    ///      and transfers to masterVault
    /// @param amount amount of underlying tokens
    /// @return value - returns the amount of underlying tokens withdrawn from ceros
    function _withdraw(uint256 amount) internal returns (uint256 value) {
        require(amount > 0, "invalid amount");
        uint256 wethBalance = underlying.balanceOf(address(this));
        if(amount < wethBalance) {
            SafeERC20Upgradeable.safeTransfer(underlying, address(vault), amount);
            return amount;
        }
        
        uint256 amountOut; bool enoughLiquidity; uint256 remaining = amount - wethBalance;
        (amountOut, enoughLiquidity) = ISwapPool(_swapPool).getAmountOut(false, (remaining * _certToken.ratio()) / 1e18, feeFlag); // (amount * ratio) / 1e18
        if (enoughLiquidity) {
            value = _ceRouter.withdrawWithSlippage(address(this), remaining, amountOut);
            require(value >= amountOut, "invalid out amount");
            uint256 withdrawAmount = wethBalance + value;
            if (amount < withdrawAmount) {
                // transfer extra funds to feeRecipient 
                SafeERC20Upgradeable.safeTransfer(underlying, feeRecipient, withdrawAmount - amount);
            } else {
                amount = withdrawAmount;
            }
            SafeERC20Upgradeable.safeTransfer(underlying, address(vault), amount);
            return amount;
        }
    }

    receive() external payable {
        require(msg.sender == address(underlying)); // only accept ETH from the WETH contract
    }

    /// @dev returns the depositable amount based on liquidity
    function canDeposit(uint256 _amount) external view override returns(uint256 capacity, uint256 chargedCapacity) {
        uint256 amountOut; bool enoughLiquidity;
        (amountOut, enoughLiquidity) = ISwapPool(_swapPool).getAmountOut(true, _amount, true);
        if (!enoughLiquidity) { // If liquidity not enough, calculate amountIn for remaining liquidity
            (capacity,) = ISwapPool(_swapPool).getAmountIn(true, ISwapPool(_swapPool).cerosTokenAmount() - 1, false);
            (amountOut,) = ISwapPool(_swapPool).getAmountOut(true, capacity, true);
            (chargedCapacity,) = ISwapPool(_swapPool).getAmountOut(false, amountOut, false);
        } else {
            capacity = _amount;
            (chargedCapacity,) = ISwapPool(_swapPool).getAmountOut(false, amountOut, false);
        }
    }

    /// @dev returns the withdrawable amount based on liquidity
    function canWithdraw(uint256 _amount) external view override returns(uint256 capacity, uint256 chargedCapacity) {
        uint256 wethBalance = underlying.balanceOf(address(this));
        if(_amount < wethBalance) return (_amount, _amount);
        
        uint256 amountin; uint256 amountOut; bool enoughLiquidity; uint256 remaining = _amount - wethBalance;
        (amountOut, enoughLiquidity) = ISwapPool(_swapPool).getAmountOut(false, (remaining * _certToken.ratio()) / 1e18, feeFlag);

        if (!enoughLiquidity) {
            (amountin,) = ISwapPool(_swapPool).getAmountIn(false, ISwapPool(_swapPool).nativeTokenAmount() - 1, false);
            (amountOut,) = ISwapPool(_swapPool).getAmountOut(false, amountin, false);
            capacity = wethBalance + amountOut;
            (amountOut,) = ISwapPool(_swapPool).getAmountOut(true, (amountOut * _certToken.ratio()) / 1e18, false);
            chargedCapacity = wethBalance + amountOut;
        } else {
            capacity = wethBalance + amountOut;
            (amountOut,) = ISwapPool(_swapPool).getAmountOut(true, (amountOut * _certToken.ratio()) / 1e18, false);
            chargedCapacity = wethBalance + amountOut;
        }
    }

    /// @dev claims yeild from ceros in aMATICc and transfers to feeRecipient
    function harvest() external onlyOwnerOrStrategist {
        _harvestTo(feeRecipient);
    }

    /// @dev claims yeild from ceros in aMATICc, converts them to wMATIC and transfers them to feeRecipient
    function harvestAndSwap() external onlyOwnerOrStrategist {
        uint256 yield = _harvestTo(address(this));
        (uint256 amountOut, bool enoughLiquidity) = ISwapPool(_swapPool).getAmountOut(false, yield, true);
        if (enoughLiquidity && amountOut > 0) {
            amountOut = ISwapPool(_swapPool).swap(false, yield, address(this));
            SafeERC20Upgradeable.safeTransfer(underlying, feeRecipient, amountOut);
        }
    }

    /// @dev internal function to claim yeild from ceros in aMATICc and transfers to desired address
    function _harvestTo(address to) private returns(uint256 yield) {
        yield = _ceRouter.getYieldFor(address(this));
        if(yield > 0) {
            yield = _ceRouter.claim(to);  // TODO: handle: reverts if no yield
        }
        uint256 profit = _ceRouter.getProfitFor(address(this));
        if(profit > 0) {
            yield += profit;
            _ceRouter.claimProfit(to);
        }
    }

    /// @dev only owner can change swap pool address
    /// @param swapPool new swap pool address
    function changeSwapPool(address swapPool) external onlyOwner {
        require(swapPool != address(0));
        _certToken.approve(_swapPool, 0);
        _swapPool = swapPool;
        _certToken.approve(_swapPool, type(uint256).max);
        emit SwapPoolChanged(swapPool);
    }

    /// @dev only owner can change ceRouter
    /// @param ceRouter new ceros router address
    function changeCeRouter(address ceRouter) external onlyOwner {
        require(ceRouter != address(0));
        underlying.approve(address(_ceRouter), 0);
        destination = ceRouter;
        _ceRouter = ICerosRouterSp(ceRouter);
        underlying.approve(address(_ceRouter), type(uint256).max);
        emit CeRouterChanged(ceRouter);
    }

    function changeFeeFlag(bool _flag) external onlyOwner {
        feeFlag = _flag;
    }
}