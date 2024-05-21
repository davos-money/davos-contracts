// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./extensions/CrossRateLstOracle.sol";

contract USDPlusOracle is CrossRateLstOracle {

    function initialize(AggregatorV3Interface _aggregatorAddress, address _wUSDPlus, IMasterVault _masterVault, IRatioAdapter _ratioAdapter) external initializer {
        __LstOracle__init(_masterVault);
        __CrossRateLstOracle__init(_aggregatorAddress, _wUSDPlus, _ratioAdapter);
    }
}