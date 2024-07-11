pragma solidity ^0.8.10;

import "./extensions/CrossRateLstOraclePyth.sol";

contract NrTokenOracle is CrossRateLstOraclePyth {

    function initialize(Pyth _aggregatorAddress, bytes32 _id, address _nrToken, IMasterVault _masterVault, IRatioAdapter _ratioAdapter) external initializer {
        __LstOracle__init(_masterVault);
        __CrossRateLstOracle__init(_aggregatorAddress, _id, _nrToken, _ratioAdapter);
    }
}