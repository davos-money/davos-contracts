// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "../LstOracle.sol";

abstract contract DirectRateLstOracle is LstOracle {

    AggregatorV3Interface internal priceFeed;

    function __DirectRateLstOracle__init(AggregatorV3Interface _aggregatorAddress) internal onlyInitializing {
        priceFeed = _aggregatorAddress;
    }

    function _peekLstPrice() internal override view returns (uint256, bool) {
        (
        /*uint80 roundID*/,
        int price,
        /*uint startedAt*/,
        /*uint timeStamp*/,
        /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        if (price < 0) {
            return (0, false);
        }
        return (uint256(price) * 1e10, true);
    }
}