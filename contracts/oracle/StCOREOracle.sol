// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./extensions/DirectRateLstOracle.sol";

contract StCOREOracle is DirectRateLstOracle {

    function initialize(AggregatorV3Interface _aggregatorAddress, IMasterVault _masterVault) external initializer {
        __LstOracle__init(_masterVault);
        __DirectRateLstOracle__init(_aggregatorAddress);
    }
}