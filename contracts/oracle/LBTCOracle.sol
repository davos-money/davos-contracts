// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./extensions/CrossRateLstOracle.sol";

contract LBTCOracle is CrossRateLstOracle {

    function initialize(AggregatorV3Interface _aggregatorAddress, address _lbtc, IMasterVault _masterVault, IRatioAdapter _ratioAdapter) external initializer {
        __LstOracle__init(_masterVault);
        __CrossRateLstOracle__init(_aggregatorAddress, _lbtc, _ratioAdapter);
    }

    function baseRatio() external pure returns(uint256) {
        return 1e18;
    }
}