// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/IWaitingPool.sol";

import "./interfaces/IMasterVault.sol";

contract WaitingPool is IWaitingPool, Initializable, ReentrancyGuardUpgradeable {

    // --- Wrapper ---
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // --- Vars ---
    struct Person {
        address _address;
        bool _settled;
        uint256 _debt;
    }

    IMasterVault public s_masterVault;
    address public s_maticToken;

    Person[] public s_people;
    uint256 public s_index;
    uint256 public s_totalDebt;
    uint256 public s_capLimit;

    // --- Events ---
    event WithdrawPending(address user, uint256 amount);
    event WithdrawCompleted(address user, uint256 amount);

    // --- Mods ---
    modifier onlyMasterVault() {

        require(msg.sender == address(s_masterVault));
        _;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    // --- Constructor ---
    constructor() { _disableInitializers(); }

    // --- Init ---
    /** Initializer for upgradeability
      * @param _masterVault masterVault contract
      * @param _maticToken ERC20 matic
      * @param _capLimit number of indices to be payed in one call
      */
    function initialize(address _masterVault, address _maticToken, uint256 _capLimit) external initializer {

        require(_capLimit > 0, "WaitingPool/invalid-cap");

        __ReentrancyGuard_init();

        s_masterVault = IMasterVault(_masterVault);
        s_maticToken = _maticToken;
        s_capLimit = _capLimit;
    }

    // --- MasterVault ---
    /** Adds withdrawer from MasterVault to queue
      * @param _person address of withdrawer from MasterVault
      * @param _debt amount of withdrawal
      */
    function addToQueue(address _person, uint256 _debt) external onlyMasterVault {

        if(_debt != 0) {
            Person memory p = Person({_address: _person, _settled: false, _debt: _debt});
            s_totalDebt += _debt;
            s_people.push(p);

            emit WithdrawPending(_person, _debt);
        }
    }
    /** Try paying outstanding debt of users and settle flag to success
      */
    function tryRemove() external onlyMasterVault {

        uint256 balance;
        uint256 cap = 0;
        for(uint256 i = s_index; i < s_people.length; i++) {
            balance = getPoolBalance();
            uint256 userDebt = s_people[s_index]._debt;
            address userAddr = s_people[s_index]._address;
            if(balance >= userDebt && userDebt != 0 && !s_people[s_index]._settled && cap < s_capLimit) {
                s_totalDebt -= userDebt;
                s_people[s_index]._settled = true;
                emit WithdrawCompleted(userAddr, userDebt);

                cap++;
                s_index++;

                IERC20Upgradeable(s_maticToken).safeTransfer(userAddr, userDebt);
            } else return;
        }
    }
    /** Sets a new cap limit per tryRemove()
      * @param _capLimit new cap limit
      */
    function setCapLimit(uint256 _capLimit) external onlyMasterVault {

        require(_capLimit != 0, "WaitingPool/invalid-cap");
        
        s_capLimit = _capLimit;
    }

    // --- User ---
    /** Users can manually withdraw their funds if they were not transferred in tryRemove()
      */
    function withdrawUnsettled(uint256 _index) external nonReentrant {

        address src = msg.sender;
        require(!s_people[_index]._settled && _index < s_index && s_people[_index]._address == src, "WaitingPool/already-settled");

        uint256 withdrawAmount = s_people[_index]._debt;
        s_totalDebt -= withdrawAmount;
        s_people[_index]._settled = true;

        IERC20Upgradeable(s_maticToken).safeTransfer(src, withdrawAmount);
        emit WithdrawCompleted(src, withdrawAmount);
    }

    // --- Views ---
    function getPoolBalance() public view returns(uint256) {

        return IERC20Upgradeable(s_maticToken).balanceOf(address(this));
    }
}