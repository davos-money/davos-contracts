//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../MasterVault/interfaces/IMasterVault.sol";
import "../ceros/interfaces/ISwapPool.sol";
import "../ceros/interfaces/ICertToken.sol";
import "../ceros/interfaces/ICerosRouter.sol";
import "./BaseStrategy.sol";

contract CerosYieldConverterStrategy is BaseStrategy {

    ICerosRouter private _ceRouter;
    ICertToken private _certToken;
    IMasterVault public vault;

    event SwapPoolChanged(address swapPool);
    event CeRouterChanged(address ceRouter);

    /// @dev initialize function - Constructor for Upgradable contract, can be only called once during deployment
    /// @param destination Address of the ceros router contract
    /// @param feeRecipient Address of the fee recipient
    /// @param underlyingToken Address of the underlying token(wMatic)
    /// @param certToekn Address of aMATICc token
    /// @param masterVault Address of the masterVault contract
    function initialize(
        address destination,
        address feeRecipient,
        address underlyingToken,
        address certToekn,
        address masterVault
    ) public initializer {
        __BaseStrategy_init(destination, feeRecipient, underlyingToken);
        _ceRouter = ICerosRouter(destination);
        _certToken = ICertToken(certToekn);
        vault = IMasterVault(masterVault);
        underlying.approve(address(destination), type(uint256).max);
        underlying.approve(address(vault), type(uint256).max);
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
    function deposit(uint256 amount) external onlyVault returns(uint256 value) {
        require(amount <= underlying.balanceOf(address(this)), "insufficient balance");
        return _deposit(amount);
    }

    /// @dev internal function to deposit the given amount of underlying tokens into ceros
    /// @param amount amount of underlying tokens
    function _deposit(uint256 amount) internal returns (uint256 value) {
        require(!depositPaused, "deposits are paused");
        require(amount > 0, "invalid amount");
        _beforeDeposit(amount);
        return _ceRouter.deposit(amount);
    }

    /// @dev withdraws the given amount of underlying tokens from ceros and transfers to masterVault
    /// @param amount amount of underlying tokens
    /// @param delayed if true, the unstake takes time to reach receiver, thus, can't be MasterVault
    function withdraw(address recipient, uint256 amount) onlyVault external returns(uint256 value, bool delayed) {
        return (_withdraw(recipient, amount), true);
    }

    /// @dev internal function to withdraw the given amount of underlying tokens from ceros
    ///      and transfers to masterVault
    /// @param amount amount of underlying tokens
    /// @return value - returns the amount of underlying tokens withdrawn from ceros
    function _withdraw(address recipient, uint256 amount) internal returns (uint256 value) {
        require(amount > 0, "invalid amount");        
        _ceRouter.withdrawFor(recipient, amount);
        return amount;
    }

    receive() external payable {
        require(msg.sender == address(underlying)); // only accept ETH from the WETH contract
    }

    /// @dev returns the depositable amount based on liquidity
    function canDeposit(uint256 amount) public pure returns(uint256 correctAmount) {
        correctAmount = amount;
    }

    /// @dev claims yeild from ceros in aMATICc and transfers to feeRecipient
    function harvest() external onlyStrategist {
        _harvestTo(feeRecipient);
    }

    /// @dev internal function to claim yeild from ceros in aMATICc and transfers to desired address
    function _harvestTo(address to) private returns(uint256 yield) {
        yield = _ceRouter.getYieldFor(address(this));
        if(yield > 0) {
            yield = _ceRouter.claim(to);  // TODO: handle: reverts if no yield
        }
        uint256 profit = _ceRouter._profits(address(this));
        if(profit > 0) {
            yield += profit;
            _ceRouter.claimProfit(to);
        }
    }

    /// @dev only owner can change ceRouter
    /// @param ceRouter new ceros router address
    function changeCeRouter(address ceRouter) external onlyOwner {
        require(ceRouter != address(0));
        underlying.approve(address(_ceRouter), 0);
        destination = ceRouter;
        _ceRouter = ICerosRouter(ceRouter);
        underlying.approve(address(_ceRouter), type(uint256).max);
        emit CeRouterChanged(ceRouter);
    }
}