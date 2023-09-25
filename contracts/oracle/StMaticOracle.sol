// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./extensions/CrossRateLstOracle.sol";

// AggregatorV3Interface 0xab594600376ec9fd91f8e885dadf0ce036862de0 MATIC/USD
contract StMaticOracle is CrossRateLstOracle {

    function initialize(API3Interface _aggregatorAddress, address _stMatic, IMasterVault _masterVault, IRatioAdapter _ratioAdapter) external initializer {
        __LstOracle__init(_masterVault);
        __CrossRateLstOracle__init(_aggregatorAddress, _stMatic, _ratioAdapter);
    }
}