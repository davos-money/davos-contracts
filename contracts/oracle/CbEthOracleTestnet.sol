// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./LstOracle.sol";
import "./extensions/CrossRateLstOracle.sol";

contract CbEthOracleTestnet is CrossRateLstOracle {
    function initialize(AggregatorV3Interface _aggregatorAddress, address _cbETH, IRatioAdapter _ratioAdapter, IMasterVault _masterVault) external initializer {
        __LstOracle__init(_masterVault);
        __CrossRateLstOracle__init(_aggregatorAddress, _rETH, _ratioAdapter);
    }
}