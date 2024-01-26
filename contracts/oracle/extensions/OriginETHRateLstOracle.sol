// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../LstOracle.sol";

interface WOETHOracle {
    function read() external view returns (uint256);
}

// get price using conversion of lst to value and using value price feed to USD
abstract contract OriginETHRateLstOracle is LstOracle {

    WOETHOracle oracle;

    function __OriginETHRateLstOracle__init(address _oracle) internal onlyInitializing {

        oracle = WOETHOracle(_oracle);
    }

    function _peekLstPrice() internal override view returns (uint256, bool) {
        
        uint256 lsTokenPrice = oracle.read();
        if (lsTokenPrice < 0) {
            return (0, false);
        }
        return (lsTokenPrice, true);
    }
}