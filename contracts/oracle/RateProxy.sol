// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IAPI3 {
    function read() external view returns (int224 value, uint32 timestamp);
}

contract RateProxy {

    address constant target = 0x672020bd166A51A79Ada022B51C974775d17e0f6;
    function getRate() external view returns(uint256) {
        (int224 value, ) = IAPI3(target).read();
        return uint256(int256(value));
    }
}