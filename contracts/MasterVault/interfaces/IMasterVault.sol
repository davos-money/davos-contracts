// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// import "./IERC4626Upgradeable.sol";

interface IMasterVault {
    event DepositFeeChanged(uint256 newDepositFee);
    event MaxDepositFeeChanged(uint256 newMaxDepositFee);
    event WithdrawalFeeChanged(uint256 newWithdrawalFee);
    event MaxWithdrawalFeeChanged(uint256 newMaxWithdrawalFee);
    event ProviderChanged(address provider);
    event RouterChanged(address ceRouter);
    event ManagerAdded(address newManager);
    event ManagerRemoved(address manager);
    event FeeReceiverChanged(address feeReceiver);
    event WaitingPoolChanged(address waitingPool);
    event WaitingPoolCapChanged(uint256 cap);
    event StrategyAllocationChanged(address strategy, uint256 allocation);
    event SwapPoolChanged(address swapPool);
    event StrategyAdded(address strategy, uint256 allocation);
    event StrategyMigrated(address oldStrategy, address newStrategy, uint256 newAllocation);
    event SwapFeeStatusChanged(uint256 status);
    event AllocationOnDepositChangeed(uint256 status);
    
    // amount: asset that are deposited to strategy
    // actualAmount: amount - strategyFee, if any
    event DepositedToStrategy(address strategy, uint256 amount, uint256 actualAmount);

    // amount: asset that needs to be withdrawn from strategy
    // actualAmount: amount - strategyFee, if any
    event WithdrawnFromStrategy(address strategy, uint256 amount, uint256 actualAmount);

    function withdrawMatic(address account, uint256 amount) external  returns (uint256);
    function depositMatic(uint256 amount) external returns (uint256);
    function feeReceiver() external returns (address);
    function withdrawalFee() external view returns (uint256);
    function strategyParams(address strategy) external view returns(bool active, uint256 allocation, uint256 debt);
}