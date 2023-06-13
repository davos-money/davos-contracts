// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IRatioAdapter.sol";

// utility contract to support different interfaces of get ratio
contract RatioAdapter is OwnableUpgradeable, IRatioAdapter {

    enum Approach { REDIRECT, BY_INCREASING_RATIO, BY_DECREASING_RATIO }

    struct TokenData {
        string ratio;
        string from;
        string to;
        Approach approach;
    }

    mapping(address => TokenData) internal data;

    /// @custom:oz-upgrades-unsafe-allow constructor
    // --- Constructor ---
    constructor() { _disableInitializers(); }

    // --- Init ---
    function initialize() external initializer {
        __Ownable_init();
    }

    /// @notice get token amount of value
    function fromValue(address token, uint256 amount) external view returns (uint256) {
        TokenData memory tokenData = data[token];
        if (tokenData.approach == Approach.REDIRECT) {
            return _callWithAm(token, tokenData.from, amount);
        }

        uint256 ratio = _call(token, tokenData.ratio);
        if (tokenData.approach == Approach.BY_INCREASING_RATIO) {
            return amount * ratio / 1e18;
        }
        if (tokenData.approach == Approach.BY_DECREASING_RATIO) {
            return amount * 1e18 / ratio;
        }

        return 0;
    }

    /// @notice get value of token amount
    function toValue(address token, uint256 amount) external view returns (uint256) {
        TokenData memory tokenData = data[token];
        if (tokenData.approach == Approach.REDIRECT) {
            return _callWithAm(token, tokenData.to, amount);
        }

        uint256 ratio = _call(token, tokenData.ratio);
        if (tokenData.approach == Approach.BY_INCREASING_RATIO) {
            return amount * 1e18 / ratio;
        }
        if (tokenData.approach == Approach.BY_DECREASING_RATIO) {
            return amount * ratio / 1e18;
        }

        return 0;
    }

    function _callWithAm(address token, string memory method, uint256 amount) internal view returns (uint256) {
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature(method, amount)
        );

        if (!success) {
            return 0;
        }

        (uint256 res) = abi.decode(data, (uint256));

        return res;
    }

    function _call(address token, string memory method) internal view returns (uint256) {
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature(method)
        );

        if (!success) {
            return 0;
        }

        (uint256 res) = abi.decode(data, (uint256));

        return res;
    }

    function setToken(
        address token,
        string calldata to,
        string calldata from,
        string calldata getRatio,
        bool isIncreasing
    ) external onlyOwner {
        require(token != address(0), "RatioAdapter/0-address");

        TokenData memory tokenData;

        if (bytes(from).length > 0 && bytes(to).length > 0) {
            tokenData = TokenData("", from, to, Approach.REDIRECT);
        } else if (bytes(getRatio).length > 0) {
            Approach appr;
            if (isIncreasing) {
                appr = Approach.BY_INCREASING_RATIO;
            } else {
                appr = Approach.BY_DECREASING_RATIO;
            }
            tokenData = TokenData(getRatio, "", "", appr);
        } else {
            revert("RatioAdapter/unknown-approach");
        }

        data[token] = tokenData;
        emit TokenSet(token, uint8(tokenData.approach));
    }
}
