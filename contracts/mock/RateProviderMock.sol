// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

/**
 * @title RateProvider
 */
contract RateProviderMock {
    uint256 internal _rate;

    constructor(uint256 initialRate) {
        _rate = initialRate;
    }

    function getRate() external view returns (uint256) {
        return _rate;
    }

    function update(uint256 rate) external {
        _rate = rate;
    }
}