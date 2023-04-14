// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.10;

interface IGlobalPool {
    function stakeAndClaimAethC() external payable;

    function unstakeAETHFor(uint256 shares, address recipient) external;

    function getPendingUnstakesOf(address claimer) external view returns (uint256);
}