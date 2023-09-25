// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../LstOracle.sol";

interface API3Interface {
    function read() external view returns (int224 value, uint32 timestamp);
}

interface RateProviderInterface {
    function getRate() external view returns (uint256);
}

// get price based on cross rate from priceFeed1 to priceFeed2
abstract contract Cross2RateLstOracle is LstOracle {

    RateProviderInterface internal priceFeed1; // price feed of LST (ex. rETH/ETH)
    API3Interface internal priceFeed2; // price feed of staked token (ex. ETH/USDT)

    function __Cross2RateLstOracle__init(RateProviderInterface _priceFeed1, API3Interface _priceFeed2) internal onlyInitializing {
        priceFeed1 = _priceFeed1;
        priceFeed2 = _priceFeed2;
    }

    function _peekLstPrice() internal override view returns (uint256, bool) {
        // (
        // /*uint80 roundID*/,
        // int price1,
        // /*uint startedAt*/,
        // /*uint timeStamp*/,
        // /*uint80 answeredInRound*/
        // ) = priceFeed1.latestRoundData();
        int price1 = int(priceFeed1.getRate());
        if (price1 < 0) {
            return (0, false);
        }

        // (
        // /*uint80 roundID*/,
        // int price2,
        // /*uint startedAt*/,
        // /*uint timeStamp*/,
        // /*uint80 answeredInRound*/
        // ) = priceFeed2.latestRoundData();
        (
        int224 price2,
        /*uint32 timestamp*/
        ) = priceFeed2.read();
        if (price2 < 0) {
            return (0, false);
        }

        uint256 price = uint(price1) * uint224(price2) * 10**masterVault.decimals() / 10**(18 + 18);

        return (price, true);
    }
}