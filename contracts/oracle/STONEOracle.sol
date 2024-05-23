// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./extensions/CrossRateLstOracle.sol";

contract STONEOracle is CrossRateLstOracle {

    function initialize(AggregatorV3Interface _aggregatorAddress, address _STONE, IMasterVault _masterVault, IRatioAdapter _ratioAdapter) external initializer {
        __LstOracle__init(_masterVault);
        __CrossRateLstOracle__init(_aggregatorAddress, _STONE, _ratioAdapter);
    }
}