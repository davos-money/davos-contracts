// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ICerosRouter.sol";

import "./interfaces/IVault.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/IPolygonPool.sol";
import "./interfaces/ICertToken.sol";
import "./interfaces/IPriceGetter.sol";

contract CerosRouter is
ICerosRouter,
OwnableUpgradeable,
PausableUpgradeable,
ReentrancyGuardUpgradeable
{
    /// Variables
    IVault public _vault;
    ISwapRouter public _dex;
    IPolygonPool public _pool;
    ICertToken public _certToken; // aMATICc
    IERC20 public _maticToken;
    mapping(address => uint256) public _profits;
    address public _strategy;
    uint24 public _pairFee;
    IPriceGetter public _priceGetter;

    /// Modifiers
    modifier onlyStrategy() {
        require(
            msg.sender == owner() || msg.sender == _strategy,
            "Provider: not allowed"
        );
        _;
    }

    /// Init
    function initialize(
        address certToken,
        address maticToken,
        address bondToken,
        address vault,
        address dexAddress,
        uint24 pairFee,
        address pool,
        address priceGetter,
        address strategy
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        _certToken = ICertToken(certToken);
        _maticToken = IERC20(maticToken);
        _vault = IVault(vault);
        _dex = ISwapRouter(dexAddress);
        _pairFee = pairFee;
        _pool = IPolygonPool(pool);
        _priceGetter = IPriceGetter(priceGetter);
        _strategy = strategy;
        IERC20(maticToken).approve(dexAddress, type(uint256).max);
        IERC20(certToken).approve(dexAddress, type(uint256).max);
        IERC20(certToken).approve(bondToken, type(uint256).max);
        IERC20(certToken).approve(pool, type(uint256).max);
        IERC20(certToken).approve(vault, type(uint256).max);
    }

    /// Deposit Matic Token
    function deposit(uint256 amount) external override nonReentrant returns (uint256 value) {   
        {
            require(amount > 0, "invalid deposit amount");
            uint256 balanceBefore = _maticToken.balanceOf(address(this));
            _maticToken.transferFrom(msg.sender, address(this), amount);
            uint256 balanceAfter = _maticToken.balanceOf(address(this));
            require(balanceAfter >= balanceBefore + amount, "CeRouter/invalid-transfer");
        }

        // Minimum acceptable amount
        uint256 ratio = _certToken.ratio();
        uint256 minAmount = (amount * ratio) / 1e18;

        // From PolygonPool
        uint256 poolAmount = amount >= _pool.getMinimumStake() ? minAmount : 0;

        // From Dex
        uint256 dexAmount = getAmountOut(address(_maticToken), address(_certToken), amount);

        // Compare both
        uint256 realAmount;
        if (poolAmount >= dexAmount) {
            realAmount = poolAmount;
            _pool.stakeAndClaimCerts(amount);
        } else {
            realAmount = swapV3(address(_maticToken), address(_certToken), amount, minAmount, address(this));
        }

        require(realAmount >= minAmount, "CeRouter/price-low");
        require(_certToken.balanceOf(address(this)) >= realAmount, "CeRouter/wrong-certToken-amount-in-CerosRouter");
        
        // Profits
        uint256 profit = realAmount - minAmount;
        _profits[msg.sender] += profit;
        value = _vault.depositFor(msg.sender, realAmount - profit);
        emit Deposit(msg.sender, address(_maticToken), realAmount - profit, profit);
        return value;
    }
    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) public view returns (uint256 amountOut) {
        if(address(_priceGetter) == address(0)) {
            return 0;
        } else {
            amountOut = IPriceGetter(_priceGetter).getPrice(
                tokenIn,
                tokenOut,
                amountIn,
                0,
                _pairFee
            );
        }
    }
    function swapV3(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn, 
        uint256 amountOutMin, 
        address recipient) private returns (uint256 amountOut) {
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams(
            tokenIn,                // tokenIn
            tokenOut,               // tokenOut
            _pairFee,               // fee
            recipient,              // recipient
            block.timestamp + 300,  // deadline
            amountIn,               // amountIn
            amountOutMin,           // amountOutMinimum
            0                       // sqrtPriceLimitX96
        );
        amountOut = _dex.exactInputSingle(params);
    }



    // withdrawal aMATICc
    // @param recipient address to receive withdrawan aMATICc
    // @param amount in MATIC
    function withdrawAMATICc(address recipient, uint256 amount)
    external
    override
    nonReentrant
    returns (uint256 realAmount)
    {
        realAmount = _vault.withdrawFor(msg.sender, recipient, amount);
        emit Withdrawal(msg.sender, recipient, address(_certToken), realAmount);
        return realAmount;
    }
    function withdrawFor(address recipient, uint256 amount)
    external
    override
    nonReentrant
    onlyStrategy
    returns (uint256 realAmount)
    {
        realAmount = _vault.withdrawFor(msg.sender, address(this), amount);
        _pool.unstakeCertsFor(recipient, realAmount); // realAmount -> BNB
        emit Withdrawal(msg.sender, recipient, address(_maticToken), realAmount);
        return realAmount;
    }

    /// Claim Yields
    function claim(address recipient)
    external
    override
    nonReentrant
    returns (uint256 yields)
    {
        yields = _vault.claimYieldsFor(msg.sender, recipient); // in aMATICc
        emit Claim(recipient, address(_certToken), yields);
        return yields;
    }
    // Claim Profits
    function claimProfit(address recipient) external nonReentrant {
        uint256 profit = _profits[msg.sender];
        require(profit > 0, "has not got a profit");
        // let's check balance of CeRouter in aMATICc
        require(_certToken.balanceOf(address(this)) >= profit, "CeRouter/insufficient-amount");
        _certToken.transfer(recipient, profit); // in aMATICc
        _profits[msg.sender] -= profit;
        emit Claim(recipient, address(_certToken), profit);
    }

    // Setters
    function changePriceGetter(address priceGetter) external onlyOwner {
        require(priceGetter != address(0));
        _priceGetter = IPriceGetter(priceGetter);
    }
    function changePairFee(uint24 fee) external onlyOwner {
        _pairFee = fee;
        emit ChangePairFee(fee);
    }
    function changeStrategy(address strategy) external onlyOwner {
        _strategy = strategy;
        emit ChangeProvider(strategy);
    }
    function changePool(address pool) external onlyOwner {
        // update allowances
        _certToken.approve(address(_pool), 0);
        _pool = IPolygonPool(pool);
        _certToken.approve(address(_pool), type(uint256).max);
        emit ChangePool(pool);
    }
    function changeDex(address dex) external onlyOwner {
        IERC20(_maticToken).approve(address(_dex), 0);
        _certToken.approve(address(_dex), 0);
        _dex = ISwapRouter(dex);
        // update allowances
        IERC20(_maticToken).approve(address(_dex), type(uint256).max);
        _certToken.approve(address(_dex), type(uint256).max);
        emit ChangeDex(dex);
    }
    function changeVault(address vault) external onlyOwner {
        // update allowances
        _certToken.approve(address(_vault), 0);
        _vault = IVault(vault);
        _certToken.approve(address(_vault), type(uint256).max);
        emit ChangeVault(vault);
    }

    // Getters
    function getPendingWithdrawalOf(address account) external view returns (uint256) {
        return _pool.pendingUnstakesOf(account);
    }
    function getYieldFor(address account) external view returns(uint256) {
        return _vault.getYieldFor(account);
    } 
}