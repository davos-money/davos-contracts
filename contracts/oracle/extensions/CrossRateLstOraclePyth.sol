// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../LstOracle.sol";

interface Pyth {

    struct Price {
        // Price
        int64 price;
        // Confidence interval around the price
        uint64 conf;
        // Price exponent
        int32 expo;
        // Unix timestamp describing when the price was published
        uint publishTime;
    }
    struct PriceFeed {
        // The price ID.
        bytes32 id;
        // Latest available price
        Price price;
        // Latest available exponentially-weighted moving average price
        Price emaPrice;
    }
    function queryPriceFeed(bytes32 id) external view returns (PriceFeed memory priceFeed);
}

// get price using conversion of lst to value and using value price feed to USD
abstract contract CrossRateLstOraclePyth is LstOracle {

    Pyth internal priceFeed; // price feed of value (ex. ETH/USD)
    address internal lsToken; // liquid staked token (ex. wstETH, ankrETH)
    IRatioAdapter internal ratioAdapter; // ratio adapter for conversion
    bytes32 internal id;

    function __CrossRateLstOracle__init(Pyth _aggregatorAddress, bytes32 _id, address _lsToken, IRatioAdapter _ratioAdapter) internal onlyInitializing {
        lsToken = _lsToken;
        ratioAdapter = _ratioAdapter;
        priceFeed = _aggregatorAddress;
        id = _id;
    }

    function _peekLstPrice() internal override view returns (uint256, bool) {
       
        Pyth.PriceFeed memory feed = priceFeed.queryPriceFeed(id);
        Pyth.Price memory price = feed.price;
        if (price.price < 0) {
            return (0, false);
        }
        // Get Staked Token equivalent to 1 LST and multiply with Staked Token price
        uint256 value = ratioAdapter.toValue(lsToken, 1e18);
        uint256 lsTokenPrice = value * uint(int256(price.price)) / 10**8;
        return (lsTokenPrice, true);
    }
}