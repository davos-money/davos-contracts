// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BaseStrategy.sol";

import "../MasterVault/interfaces/IMasterVault.sol";
import "../ceros/interfaces/ICerosRouter.sol";

contract CerosYieldConverterStrategy is BaseStrategy {

    // --- Vars ---
    IMasterVault public masterVault;

    // --- Events ---
    event DestinationChanged(address _cerosRouter);

    // --- Mods ---
    modifier onlyMasterVault() {

        require(msg.sender == address(masterVault), "Strategy/not-masterVault");
        _;
    }
    // --- Init ---
    /** Initializer for upgradeability
      * @param _destination cerosRouter contract
      * @param _feeRecipient fee recipient
      * @param _underlyingToken underlying token 
      * @param _masterVault masterVault contract
      */
    function initialize(address _destination, address _feeRecipient, address _underlyingToken, address _masterVault) public initializer {

        __BaseStrategy_init(_destination, _feeRecipient, _underlyingToken);

        masterVault = IMasterVault(_masterVault);
        underlying.approve(address(_destination), type(uint256).max);
        underlying.approve(address(_masterVault), type(uint256).max);
    }

    // --- Admin ---
    /** Change destination contract
      * @param _destination new cerosRouter contract
      */
    function changeDestination(address _destination) external onlyOwner {

        require(_destination != address(0));

        underlying.approve(address(destination), 0);
        destination = _destination;
        underlying.approve(address(_destination), type(uint256).max);

        emit DestinationChanged(_destination);
    }

    // --- MasterVault ---
    /** Deposit underlying to destination contract
      * @param _amount underlying token amount
      */
    function deposit(uint256 _amount) external onlyMasterVault returns(uint256 value) {

        require(_amount <= underlying.balanceOf(address(this)), "Strategy/insufficient-balance");

        return _deposit(_amount);
    }
    /** Internal -> deposits underlying to destination
      * @param _amount underlying token amount
      */
    function _deposit(uint256 _amount) internal returns (uint256 value) {

        require(!depositPaused, "Strategy/paused");
        require(_amount > 0, "Strategy/invalid-amount");

        _beforeDeposit(_amount);
        return ICerosRouter(destination).deposit(_amount);
    }
    /** Withdraw underlying from destination to recipient
      * @dev incase of immediate unstake, 'msg.sender' should be used instead of '_recipient'
      * @param _recipient receiver of tokens incase of delayed unstake
      * @param _amount underlying token amount
      * @return value amount withdrawn from destination
      * @return delayed if true, the unstake takes time to reach receiver, thus, can't be MasterVault
      */
    function withdraw(address _recipient, uint256 _amount) onlyMasterVault external returns(uint256 value, bool delayed) {

        return (_withdraw(_recipient, _amount), true);
    }
    /** Internal -> withdraws underlying from destination to recipient
      * @param _recipient receiver of tokens incase of delayed unstake
      * @param _amount underlying token amount
      * @return value amount withdrawn from destination
      */
    function _withdraw(address _recipient, uint256 _amount) internal returns (uint256 value) {

        require(_amount > 0, "Strategy/invalid-amount");        
        ICerosRouter(destination).withdrawFor(_recipient, _amount);

        return _amount;
    }

    // --- Strategist ---
    /** Claims yield from destination in aMATICc and transfers to feeRecipient
      */
    function harvest() external onlyStrategist {

        _harvestTo(feeRecipient);
    }
    /** Internal -> claims yield from destination
      * @param _to receiver of yield
      */
    function _harvestTo(address _to) private returns(uint256 yield) {

        yield = ICerosRouter(destination).getYieldFor(address(this));
        if(yield > 0) yield = ICerosRouter(destination).claim(_to);

        uint256 profit = ICerosRouter(destination)._profits(address(this));
        if(profit > 0) { yield += profit; ICerosRouter(destination).claimProfit(_to); }
    }

    // --- Views ---
    /** Returns the depositable amount based on liquidity
      */
    function canDeposit(uint256 _amount) public pure returns(uint256 correctAmount) {

        correctAmount = _amount;
    }
}