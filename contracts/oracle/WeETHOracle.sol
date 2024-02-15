// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./extensions/CrossRateLstOracle.sol";

contract WeETHOracle is CrossRateLstOracle {

    function initialize(AggregatorV3Interface _aggregatorAddress, address _weETH, IMasterVault _masterVault, IRatioAdapter _ratioAdapter) external initializer {
        __LstOracle__init(_masterVault);
        __CrossRateLstOracle__init(_aggregatorAddress, _weETH, _ratioAdapter);
    }
}