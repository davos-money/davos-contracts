// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./extensions/Cross2RateLstOracle.sol";

contract CbEthOracle is Cross2RateLstOracle {
    function initialize(AggregatorV3Interface _aggregatorAddress1, AggregatorV3Interface _aggregatorAddress2, IMasterVault _masterVault) external initializer {
        __LstOracle__init(_masterVault);
        __Cross2RateLstOracle__init(_aggregatorAddress1, _aggregatorAddress2);
    }
}