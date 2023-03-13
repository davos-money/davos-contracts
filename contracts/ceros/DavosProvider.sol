// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/IDavosProvider.sol";

import "./interfaces/ICertToken.sol";
import "../MasterVault/interfaces/IMasterVault.sol";
import "./interfaces/IDao.sol";

contract DavosProvider is IDavosProvider, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {

    // --- Wrapper ---
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // --- Vars ---
    IERC20Upgradeable public s_matic;          // ERC20 Matic
    IERC20Upgradeable public s_collateral;     // ceToken in MasterVault
    ICertToken public s_collateralDerivative;  // dMATIC
    IMasterVault public s_masterVault;
    IDao public s_interaction;

    // --- Mods ---
    modifier onlyOwnerOrInteraction() {
        require(msg.sender == owner() || msg.sender == address(s_interaction), "DavosProvider/not-interaction-or-owner");
        _;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    // --- Constructor ---
    constructor() { _disableInitializers(); }
    
    // --- Init ---
    function initialize(address _matic, address _collateralDerivative, address _masterVault, address _interaction) external initializer {

        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        s_matic = IERC20Upgradeable(_matic);
        s_collateral = IERC20Upgradeable(_masterVault);
        s_collateralDerivative = ICertToken(_collateralDerivative);
        s_masterVault = IMasterVault(_masterVault);
        s_interaction = IDao(_interaction);

        IERC20Upgradeable(s_matic).approve(_masterVault, type(uint256).max);
        IERC20Upgradeable(s_collateral).approve(_interaction, type(uint256).max);
    }
    
    // --- User ---
    function provide(uint256 _amount) external override whenNotPaused nonReentrant returns (uint256 value) {

        s_matic.safeTransferFrom(msg.sender, address(this), _amount);
        value = s_masterVault.depositMatic(_amount);
        value = _provideCollateral(msg.sender, value);

        emit Deposit(msg.sender, value);
        return value;
    }
    function release(address _recipient, uint256 _amount) external payable override whenNotPaused nonReentrant returns (uint256 realAmount) {

        require(_recipient != address(0));
        realAmount = _withdrawCollateral(msg.sender, _amount);
        realAmount = s_masterVault.withdrawMatic{value: msg.value}(_recipient, realAmount);

        emit Withdrawal(msg.sender, _recipient, realAmount);
        return realAmount;
    }
    
    // --- Interaction ---
    function liquidation(address _recipient, uint256 _amount) external override onlyOwnerOrInteraction nonReentrant {

        require(_recipient != address(0));
        s_masterVault.withdrawMatic(_recipient, _amount);
    }
    function daoBurn(address _account, uint256 _amount) external override onlyOwnerOrInteraction nonReentrant {

        require(_account != address(0));
        s_collateralDerivative.burn(_account, _amount);
    }
    function daoMint(address _account, uint256 _amount) external override onlyOwnerOrInteraction nonReentrant {

        require(_account != address(0));
        s_collateralDerivative.mint(_account, _amount);
    }
    function _provideCollateral(address _account, uint256 _amount) internal returns (uint256 deposited) {

        deposited = s_interaction.deposit(_account, address(s_collateral), _amount);
        s_collateralDerivative.mint(_account, deposited);
    }
    function _withdrawCollateral(address _account, uint256 _amount) internal returns (uint256 withdrawn) {
        
        withdrawn = s_interaction.withdraw(_account, address(s_collateral), _amount);
        s_collateralDerivative.burn(_account, withdrawn);
    }

    // --- Admin ---
    function pause() external onlyOwner {

        _pause();
    }
    function unPause() external onlyOwner {

        _unpause();
    }
    function changeMatic(address _matic) external onlyOwner {

        s_matic = IERC20Upgradeable(_matic);
        emit MaticChanged(_matic);
    }
    function changeCollateral(address _collateral) external onlyOwner {

        IERC20Upgradeable(s_collateral).approve(address(s_interaction), 0);
        s_collateral = IERC20Upgradeable(_collateral);
        IERC20Upgradeable(_collateral).approve(address(s_interaction), type(uint256).max);
        emit CollateralChanged(_collateral);
    }
    function changeCollateralDerivative(address _collateralDerivative) external onlyOwner {

        s_collateralDerivative = ICertToken(_collateralDerivative);
        emit CollateralDerivativeChanged(_collateralDerivative);
    }
    function changeMasterVault(address _masterVault) external onlyOwner {

        s_masterVault = IMasterVault(_masterVault);
        emit MasterVaultChanged(_masterVault);
    }
    function changeInteraction(address _interaction) external onlyOwner {
        
        IERC20Upgradeable(s_collateral).approve(address(s_interaction), 0);
        s_interaction = IDao(_interaction);
        IERC20Upgradeable(s_collateral).approve(address(_interaction), type(uint256).max);
    }
}