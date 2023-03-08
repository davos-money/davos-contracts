// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../interfaces/PipLike.sol";

contract DGTOracle is PipLike, OwnableUpgradeable  {

    event PriceChanged(uint256 newPrice);

    uint256 private price;

    // --- Init ---
    function initialize(uint256 _initialPrice) external initializer {

        __Ownable_init();

        price = _initialPrice;
    }

    /**
     * Returns the latest price
     */
    function peek() public view returns (bytes32, bool) {

        return (bytes32(price), true);
    }

    function changePriceToken(uint256 _price) external onlyOwner {

        price = _price;
        emit PriceChanged(price);
    }
}