// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMasterVault {

    // --- Events ---
    event DepositFeeChanged(uint256 _newDepositFee);
    event WithdrawalFeeChanged(uint256 _newWithdrawalFee);
    event ProviderChanged(address _provider);
    event ManagerAdded(address _newManager);
    event ManagerRemoved(address _manager);
    event FeeReceiverChanged(address _feeReceiver);
    event WaitingPoolChanged(address _waitingPool);
    event WaitingPoolCapChanged(uint256 _cap);
    event StrategyAllocationChanged(address _strategy, uint256 _allocation);
    event StrategyAdded(address _strategy, uint256 _allocation);
    event StrategyMigrated(address _oldStrategy, address _newStrategy, uint256 _newAllocation);
    event AllocationOnDepositChangeed(uint256 _status);
    event DepositedToStrategy(address _strategy, uint256 _amount, uint256 _actualAmount);
    event WithdrawnFromStrategy(address _strategy, uint256 _amount, uint256 _actualAmount);

    // --- Functions ---
    function depositMatic(uint256 _amount) external returns (uint256);
    function withdrawMatic(address _account, uint256 _amount) external payable returns (uint256);
    function feeReceiver() external returns (address);
    function withdrawalFee() external view returns (uint256);
    function strategyParams(address _strategy) external view returns(uint256 allocation, uint256 debt, bool active);
}