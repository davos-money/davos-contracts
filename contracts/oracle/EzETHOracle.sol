// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./extensions/CrossRateLstOraclePyth.sol";

contract EzETHOracle is CrossRateLstOraclePyth {

    function initialize(Pyth _aggregatorAddress, address _ezETH, IMasterVault _masterVault, IRatioAdapter _ratioAdapter) external initializer {
        __LstOracle__init(_masterVault);
        __CrossRateLstOracle__init(_aggregatorAddress, _ezETH, _ratioAdapter);
    }
}