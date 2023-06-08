// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./interfaces/IMasterVault_V2.sol";

import "./interfaces/ILiquidAsset.sol";

// --- MasterVault_V2 (Variant 2) ---
// --- Vault with instances per Liquid Staked Underlying to generate yield via ratio change and strategies ---
contract MasterVault_V2 is IMasterVault_V2, ERC4626Upgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {

    // --- Wrappers ---
    using SafeERC20Upgradeable for ILiquidAsset;

    // --- Vars ---
    address public provider;         // DavosProvider
    address public yieldHeritor;     // Yield Recipient
    uint256 public yieldMargin;      // Percentage of Yield protocol gets, 10,000 = 100%
    uint256 public yieldRatio;       // Ratio at which Yield for protocol was last claimed

    // --- Mods ---
    modifier onlyOwnerOrProvider() {
        require(msg.sender == owner() || msg.sender == provider, "MasterVault_V2/not-owner-or-provider");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    // --- Constructor ---
    constructor() { _disableInitializers(); }

    // --- Init ---
    function initialize(string memory _name, string memory _symbol, uint256 _yieldMargin, address _underlying) external initializer {

        __ERC4626_init(IERC20MetadataUpgradeable(_underlying));
        __ERC20_init(_name, _symbol);
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        yieldMargin = _yieldMargin;
        yieldRatio = ILiquidAsset(asset()).getWstETHByStETH(1e18);

        require(yieldRatio != 0, "MasterVault_V2/asset-ratio-incorrect");
    }

    // --- Provider ---
    function depositUnderlying(address _account, uint256 _amount) external override nonReentrant whenNotPaused onlyOwnerOrProvider returns (uint256 shares) {

        address src = _msgSender();

        require(_amount > 0, "MasterVault_V2/invalid-amount");
        require(_account != address(0), "MasterVault_V2/0-address");
        require(_amount <= maxDeposit(src), "MasterVault_V2/deposit-more-than-max");

        claimYield();

        uint256 shares = previewDeposit(_amount);

        _deposit(src, src, _amount, shares);

        return shares;
    }
    function withdrawUnderlying(address _account, uint256 _amount) external override nonReentrant whenNotPaused onlyOwnerOrProvider returns (uint256 assets) {

        address src = _msgSender();

        require(_amount <= maxRedeem(src), "MasterVault_V2/withdraw-more-than-max");
        require(_account != address(0), "MasterVault_V2/0-address");

        claimYield();

        uint256 assets = previewRedeem(_amount);
        _withdraw(src, _account, src, assets, _amount);

        return assets;
    }
    function claimYield() public returns (uint256) {
        
        uint256 availableYields = getVaultYield();
        if (availableYields <= 0) return 0;

        ILiquidAsset _asset = ILiquidAsset(asset());
        _asset.safeTransfer(yieldHeritor, availableYields);

        yieldRatio = _asset.getWstETHByStETH(1e18);

        emit Claim(address(this), yieldHeritor, availableYields);
        return availableYields;
    }
    
    // --- Admin ---
    function changeProvider(address _provider) external onlyOwnerOrProvider {

        require(_provider != address(0), "MasterVault_V2/0-address");
        provider = _provider;

        emit Provider(provider, _provider);
    }
    function changeYieldHeritor(address _yieldHeritor) external onlyOwnerOrProvider {

        require(_yieldHeritor != address(0), "MasterVault_V2/0-address");
        yieldHeritor = _yieldHeritor;

        emit YieldHeritor(yieldHeritor, _yieldHeritor);
    }
    function changeYieldMargin(uint256 _yieldMargin) external onlyOwnerOrProvider {

        require(_yieldMargin <= 1e4, "MasterVault_V2/should-be-less-than-max");
        yieldMargin = _yieldMargin;

        emit YieldMargin(yieldMargin, _yieldMargin);
    }
    
    // --- Views ---
    function getVaultPrinciple() public view returns (uint256) {

        uint256 ratio = ILiquidAsset(asset()).getWstETHByStETH(1e18);
        return (totalSupply() * ratio) / 1e18;
    }
    function getVaultYield() public view returns (uint256) {

        uint256 nowRatio = ILiquidAsset(asset()).getWstETHByStETH(1e18); 

        if (nowRatio > yieldRatio) return 0;

        uint256 diffRatio = yieldRatio - nowRatio;

        if (diffRatio <= 0) return 0;

        uint256 yieldRatio = (diffRatio * yieldMargin) / 1e4;
        uint256 yield = (totalSupply() * yieldRatio) / 1e18;

        return yield;
    }

    // ---------------
    // --- ERC4626 ---
    /** Kept only for the sake of ERC4626 standard
      */
    function deposit(uint256 assets, address receiver) public override returns (uint256) { revert(); }
    function mint(uint256 shares, address receiver) public override returns (uint256) { revert(); }
    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256) { revert(); }
    function redeem(uint256 shares, address receiver, address owner) public override returns (uint256) { revert(); }
}