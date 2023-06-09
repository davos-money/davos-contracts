// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRatioAdapter {

    // --- Events ---
    event TokenSet(address token, string from, string to);

    // --- Functions ---
    function fromValue(address token, uint256 amount) external returns (uint256);
    function toValue(address token, uint256 amount) external returns (uint256);
}