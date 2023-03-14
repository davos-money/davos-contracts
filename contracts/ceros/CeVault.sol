// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ICeVault.sol";

import "./interfaces/ICertToken.sol";

contract CeVault is ICeVault, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {

    // --- Wrapper ---
    using SafeMathUpgradeable for uint256;

    // --- Vars ---
    string public s_name;
    address public s_cerosRouter;
    ICertToken public s_ceToken;
    ICertToken public s_aMATICc;
    mapping(address => uint256) public s_claimed;          // aMATICc
    mapping(address => uint256) public s_depositors;       // aMATICc
    mapping(address => uint256) public s_ceTokenBalances;  // MATIC

    // --- Mods ---
    modifier onlyCerosRouter() {
        
        require(msg.sender == s_cerosRouter, "CeVault/not-cerosRouter");
        _;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    // --- Constructor ---
    constructor() { _disableInitializers(); }

    // --- Init ---
    function initialize(string memory _name, address _ceToken, address _aMATICc) external initializer {

        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        s_name = _name;
        s_ceToken = ICertToken(_ceToken);
        s_aMATICc = ICertToken(_aMATICc);
    }

    // --- CerosRouter ---
    function depositFor(address _recipient, uint256 _amount) external override nonReentrant onlyCerosRouter whenNotPaused returns (uint256) {

        return _deposit(_recipient, _amount);
    }
    function _deposit(address _account, uint256 _amount) private returns (uint256) {

        s_aMATICc.transferFrom(msg.sender, address(this), _amount);
        uint256 ratio = s_aMATICc.ratio();
        uint256 toMint = safeCeilMultiplyAndDivide(_amount, 1e18, ratio);

        s_depositors[_account] += _amount;
        s_ceTokenBalances[_account] += toMint;
        ICertToken(s_ceToken).mint(_account, toMint);

        emit Deposited(msg.sender, _account, toMint);
        return toMint;
    }

    function withdrawFor(address _owner, address _recipient, uint256 _amount) external override nonReentrant onlyCerosRouter whenNotPaused returns (uint256) {

        return _withdraw(_owner, _recipient, _amount);
    }
    function _withdraw(address _owner, address _recipient, uint256 _amount) private returns (uint256) {

        uint256 ratio = s_aMATICc.ratio();
        uint256 realAmount = safeCeilMultiplyAndDivide(_amount, ratio, 1e18);
        require(s_aMATICc.balanceOf(address(this)) >= realAmount, "CeVault/insufficient-aMATICc");

        uint256 balance = s_ceTokenBalances[_owner];
        require(balance >= _amount, "CeVault/insufficient-MATIC");
        s_ceTokenBalances[_owner] -= _amount;

        ICertToken(s_ceToken).burn(_owner, _amount);
        s_depositors[_owner] -= realAmount;
        s_aMATICc.transfer(_recipient, realAmount);

        emit Withdrawn(_owner, _recipient, realAmount);
        return realAmount;
    }

    function claimYieldsFor(address _owner, address _recipient) external override onlyCerosRouter nonReentrant returns (uint256) {

        return _claimYields(_owner, _recipient);
    }
    function _claimYields(address _owner, address _recipient) private returns (uint256) {

        uint256 availableYields = getYieldFor(_owner);
        require(availableYields > 0, "CeVault/no-yields");

        s_claimed[_owner] += availableYields;
        s_aMATICc.transfer(_recipient, availableYields);

        emit Claimed(_owner, _recipient, availableYields);
        return availableYields;
    }

    // --- Internal ---
    function safeCeilMultiplyAndDivide(uint256 a, uint256 b, uint256 c) internal pure returns (uint256) {

        // Ceil (a * b / c)
        uint256 remainder = a.mod(c);
        uint256 result = a.div(c);
        bool safe;
        (safe, result) = result.tryMul(b);
        if (!safe) {
            return 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        }
        (safe, result) = result.tryAdd(remainder.mul(b).add(c.sub(1)).div(c));
        if (!safe) {
            return 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        }
        return result;
    }

    // --- Admin ---
    function changeCerosRouter(address _cerosRouter) external onlyOwner {

        require(_cerosRouter != address(0));
        s_cerosRouter = _cerosRouter;

        emit CerosRouterChanged(_cerosRouter);
    }
    function pause() external onlyOwner {

        _pause();
    }
    function unpause() external onlyOwner {

        _unpause();
    }

    // --- Views ---
    function getTotalAmountInVault() external view override returns (uint256) {

        return s_aMATICc.balanceOf(address(this));
    }
    // yield + principal = deposited(before claim)
    // BUT after claim yields: available_yield + principal == deposited - claimed
    // available_yield = yield - claimed;
    // principal = deposited*(current_ratio/init_ratio)=cetoken.balanceOf(account)*current_ratio;
    function getPrincipalOf(address _account) public view override returns (uint256) {

        uint256 ratio = s_aMATICc.ratio();
        return (s_ceTokenBalances[_account] * ratio) / 1e18; // in aMATICc
    }
    // yield = deposited*(1-current_ratio/init_ratio) = cetoken.balanceOf*init_ratio-cetoken.balanceOf*current_ratio
    // yield = cetoken.balanceOf*(init_ratio-current_ratio) = amount(in aMATICc) - amount(in aMATICc)
    function getYieldFor(address _account) public view override returns (uint256) {

        uint256 principal = getPrincipalOf(_account);
        if (principal >= s_depositors[_account]) {
            return 0;
        }
        uint256 totalYields = s_depositors[_account] - principal;
        if (totalYields <= s_claimed[_account]) {
            return 0;
        }
        return totalYields - s_claimed[_account];
    }
}