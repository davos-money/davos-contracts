// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract LSTFeed {

    // --- Vars ---
    enum Approach {
        DISCRETE,          // LST has discrete methods for conversion
        INCREASING_RATIO,  // LST has increasing ratio for conversion
        DECREASING_RATIO   // LST has decreasing ratio for conversion
    }
    struct LSTData {
        address token;      // Liquid Staking Token
        address provider;   // Ratio provider if required
        Approach approach;  
        string ratio;       // Signature to get ratio
        string shares;      // Signature to get shares from assets
        string assets;      // Signature to get assets from shares
    }

    AggregatorV3Interface public priceFeed;
    LSTData public lstData;

    // --- Constructor ---
    constructor(AggregatorV3Interface _aggregatorAddress, LSTData memory _lstData) { 

        priceFeed = _aggregatorAddress;
        lstData = _lstData;
    }

    function peekPrice() external view returns (uint256, bool) {

        (
        /*uint80 roundID*/,
        int price,
        /*uint startedAt*/,
        /*uint timeStamp*/,
        /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();

        if (price < 0) return (0, false);

        // 1 LST to asset value
        uint256 value = toAssets(1e18); 
        uint256 lstprice = value * uint(price) / 10**priceFeed.decimals();
        return (lstprice, true);
    }

    function peekRatio() external view returns (uint256) {

        LSTData memory data = lstData;
        address provider = data.provider == address(0) ? data.token : data.provider;

        if (data.approach == Approach.DISCRETE) {
            return _callWithAmount(provider, data.assets, 1e18);
        }

        if (data.approach == Approach.INCREASING_RATIO || data.approach == Approach.DECREASING_RATIO) {
            return _call(provider, data.ratio);
        }

        return 0;
    }

    function toShares(uint256 amount) public view returns (uint256) {

        LSTData memory data = lstData;
        address provider = data.provider == address(0) ? data.token : data.provider;

        if (data.approach == Approach.DISCRETE) {
            return _callWithAmount(provider, data.shares, amount);
        }

        uint256 ratio = _call(provider, data.ratio);
        if (data.approach == Approach.INCREASING_RATIO) {
            return amount * 1e18 / ratio;
        }
        if (data.approach == Approach.DECREASING_RATIO) {
            return amount * ratio / 1e18;
        }

        return 0;
    }

    function toAssets(uint256 amount) public view returns (uint256) {

        LSTData memory data = lstData;
        address provider = data.provider == address(0) ? data.token : data.provider;

        if (data.approach == Approach.DISCRETE) {
            return _callWithAmount(provider, data.assets, amount);
        }

        uint256 ratio = _call(provider, data.ratio);
        if (data.approach == Approach.INCREASING_RATIO) {
            return amount * ratio / 1e18;
        }
        if (data.approach == Approach.DECREASING_RATIO) {
            return amount * 1e18 / ratio;
        }

        return 0;
    }

    function _callWithAmount(address provider, string memory method, uint256 amount) internal view returns (uint256) {

        (bool success, bytes memory data) = provider.staticcall(abi.encodeWithSignature(method, amount));

        if (!success) return 0;

        (uint256 res) = abi.decode(data, (uint256));

        return res;
    }

    function _call(address provider, string memory method) internal view returns (uint256) {

        (bool success, bytes memory data) = provider.staticcall(abi.encodeWithSignature(method));

        if (!success) return 0;

        (uint256 res) = abi.decode(data, (uint256));

        return res;
    }
}