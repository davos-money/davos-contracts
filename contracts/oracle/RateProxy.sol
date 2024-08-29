// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IEarn {
    function getCurrentExchangeRate() external view  returns (uint256);
}

contract RateProxy {

    address constant target = 0xf5fA1728bABc3f8D2a617397faC2696c958C3409;
    function getRate() external view returns(uint256) {
        uint256 value = IEarn(target).getCurrentExchangeRate();
        return (value * 1e12);
    }
}