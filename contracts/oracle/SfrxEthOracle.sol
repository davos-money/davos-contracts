// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./extensions/CrossRateLstOracle.sol";

contract SfrxEthOracle is CrossRateLstOracle {

    function initialize(API3Interface _aggregatorAddress, address _sfrxETH, IMasterVault _masterVault, IRatioAdapter _ratioAdapter) external initializer {
        __LstOracle__init(_masterVault);
        __CrossRateLstOracle__init(_aggregatorAddress, _sfrxETH, _ratioAdapter);
    }
}