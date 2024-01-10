// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

interface IComet {
    function accrueAccount(address account) external;
}

contract WcUSDCv3 is ERC4626Upgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {

    /// @custom:oz-upgrades-unsafe-allow constructor
    // --- Constructor ---
    constructor() { _disableInitializers(); }

    // --- Init ---
    function initialize(string memory _name, string memory _symbol, address _underlying) external initializer {

        __ERC4626_init(IERC20MetadataUpgradeable(_underlying));
        __ERC20_init(_name, _symbol);
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
    }

    // --- Provider ---
    function deposit(uint256 assets, address receiver) public override nonReentrant whenNotPaused returns (uint256) {

        address src = _msgSender();

        require(assets > 0, "WcUSDCv3/invalid-amount");
        require(receiver != address(0), "WcUSDCv3/0-address");
        require(assets <= maxDeposit(src), "WcUSDCv3/deposit-more-than-max");

        IComet(asset()).accrueAccount(receiver);

        uint256 shares = previewDeposit(assets);
        _deposit(src, src, assets, shares);

        return shares;
    }
    function redeem(uint256 shares, address receiver, address owner) public override nonReentrant whenNotPaused returns (uint256) {

        require(shares <= maxRedeem(owner), "WcUSDCv3/withdraw-more-than-max");
        require(receiver != address(0), "WcUSDCv3/0-address");

        IComet(asset()).accrueAccount(owner);

        uint256 assets = previewRedeem(shares);

        _withdraw(owner, receiver, owner, assets, shares);

        return assets;
    }
    
    // ---------------
    // --- ERC4626 ---
    /** Kept only for the sake of ERC4626 standard
      */
    function mint(uint256 shares, address receiver) public override returns (uint256) { revert(); }
    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256) { revert(); }
}