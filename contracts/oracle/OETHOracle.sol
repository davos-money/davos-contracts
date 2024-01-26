// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./extensions/OriginETHRateLstOracle.sol";

contract OETHOracle is OriginETHRateLstOracle {

    function initialize(address _oracle, IMasterVault _masterVault) external initializer {
        __LstOracle__init(_masterVault);
        __OriginETHRateLstOracle__init(_oracle);
    }
}