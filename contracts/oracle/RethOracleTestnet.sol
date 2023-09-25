// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./LstOracle.sol";
import "./extensions/CrossRateLstOracle.sol";

// 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e ETH/USD
contract RethOracleTestnet is CrossRateLstOracle {
    function initialize(API3Interface _aggregatorAddress, address _rETH, IRatioAdapter _ratioAdapter, IMasterVault _masterVault) external initializer {
        __LstOracle__init(_masterVault);
        __CrossRateLstOracle__init(_aggregatorAddress, _rETH, _ratioAdapter);
    }
}