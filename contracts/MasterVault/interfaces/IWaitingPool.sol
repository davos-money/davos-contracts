// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWaitingPool {

    // --- Funtions ---
    function addToQueue(address, uint256) external;
    function tryRemove() external;
    function getPoolBalance() external view returns(uint256);
    function setCapLimit(uint256) external; 
    function s_totalDebt() external view returns(uint256);
}