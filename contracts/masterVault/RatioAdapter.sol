// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IRatioAdapter.sol";

// utility contract to support different interfaces of get ratio
contract RatioAdapter is OwnableUpgradeable, IRatioAdapter {

    mapping(address => string) public fromMethods;
    mapping(address => string) public toMethods;

    /// @custom:oz-upgrades-unsafe-allow constructor
    // --- Constructor ---
    constructor() { _disableInitializers(); }

    // --- Init ---
    function initialize() external initializer {
    }


    /// @notice get token amount of value
    function fromValue(address token, uint256 amount) external view returns (uint256) {
        string memory method = toMethods[token];
        return _call(token, method, amount);
    }

    /// @notice get value of token amount
    function toValue(address token, uint256 amount) external view returns (uint256) {
        string memory method = fromMethods[token];
        return _call(token, method, amount);
    }

    function _call(address token, string memory method, uint256 arg) internal view returns (uint256) {
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature(method, arg)
        );

        if (!success) {
            return 0;
        }

        (uint256 res) = abi.decode(data, (uint256));

        return res;
    }

    function setToken(address token, string calldata from, string calldata to) external onlyOwner {
        fromMethods[token] = from;
        toMethods[token] = to;
        emit TokenSet(token, from, to);
    }
}
