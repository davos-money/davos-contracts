// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

interface CometExtInterface {
    struct TotalsBasic {
        uint64 baseSupplyIndex;
        uint64 baseBorrowIndex;
        uint64 trackingSupplyIndex;
        uint64 trackingBorrowIndex;
        uint104 totalSupplyBase;
        uint104 totalBorrowBase;
        uint40 lastAccrualTime;
        uint8 pauseFlags;
    }
    function totalsBasic() external view returns (TotalsBasic memory);
}

interface CometMainInterface {
    function getSupplyRate(uint256 utilization) external view returns (uint64);
    function getUtilization() external view returns (uint256);
    function accrueAccount(address account) external;
}

interface CometInterface is CometMainInterface, CometExtInterface {
    struct UserBasic {
        int104 principal;
        uint64 baseTrackingIndex;
        uint64 baseTrackingAccrued;
        uint16 assetsIn;
        uint8 _reserved;
    }
    function userBasic(address account) external view returns (UserBasic memory);
}

interface CometRewards {
    function claim(address comet, address src, bool shouldAccrue) external;
}

contract WcUSDCv3_2 is ERC4626Upgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {

    // --- Wrappers ---
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
    // --- Constants ---
    uint64 internal constant BASE_INDEX_SCALE = 1e15;
    uint64 internal constant FACTOR_SCALE = 1e18;

    // --- Vars ---
    address public rewards;   // Comet rewards
    address public comp;      // Compound token
    address public multisig;

    // --- Events ---
    event ClaimedX(uint256 indexed _amount);
    event File(bytes32 indexed _what, address indexed _data);

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

    // --- Math ---
    function unsigned256(int256 n) internal pure returns (uint256) {

        require(n >= 0, "wcUSDC/not-unsigned256");
        return uint256(n);
    }
    function safe104(uint256 n) internal pure returns (uint104) {

        require(n <= type(uint104).max, "wcUSDC/not-safe104");
        return uint104(n);
    }
    function safe64(uint256 n) internal pure returns (uint64) {

        require(n <= type(uint64).max, "wcUSDC/not-safe64");
        return uint64(n);
    }

    // --- Public ---
    function deposit(uint256 assets, address receiver) public override nonReentrant whenNotPaused returns (uint256) {

        address src = _msgSender();

        require(assets > 0, "wcUSDC/zero-assets");
        require(receiver != address(0), "wcUSDC/zero-address");
        require(assets <= maxDeposit(src), "wcUSDC/maxDeposit-limit-reach");

        CometInterface(asset()).accrueAccount(address(this));  // note: Does not change comet user principal

        int104 prevPrincipal = CometInterface(asset()).userBasic(address(this)).principal;
        IERC20Upgradeable(asset()).safeTransferFrom(src, address(this), assets);
        uint256 shares = unsigned256(CometInterface(asset()).userBasic(address(this)).principal - prevPrincipal);

        require(shares > 0, "wcUSDC/zero-shares");

        _mint(receiver, shares);
        emit Deposit(src, receiver, assets, shares);
        
        return shares;
    }
    function redeem(uint256 shares, address receiver, address owner) public override nonReentrant whenNotPaused returns (uint256) {
        
        address src = _msgSender();

        require(shares > 0, "wcUSDC/zero-shares");
        require(shares <= maxRedeem(owner), "wcUSDC/maxRedeem-limit-reach");
        require(receiver != address(0), "wcUSDC/zero-address");

        if (src != owner) _spendAllowance(owner, src, shares);

        uint256 assets = convertToAssets(shares - 1);  // Comet asset transfer might decrease shares by 1

        require(assets > 0, "wcUSDC/zero-assets");

        CometInterface(asset()).accrueAccount(address(this));

        int104 prevPrincipal = CometInterface(asset()).userBasic(address(this)).principal;
        IERC20Upgradeable(asset()).safeTransfer(receiver, assets);
        shares =  unsigned256(prevPrincipal - CometInterface(asset()).userBasic(address(this)).principal);

        require(shares > 0, "wcUSDC/zero-zshares");

        _burn(owner, shares); // We burn same shares
        emit Withdraw(msg.sender, receiver, owner, assets, shares);

        return assets;
    }
    function transfer(address to, uint256 amount) public override(ERC20Upgradeable, IERC20Upgradeable) returns (bool) {

        CometInterface(asset()).accrueAccount(address(this));
        bool status = super.transfer(to, amount);

        return status;
    }
    function transferFrom(address from, address to, uint256 amount) public override(ERC20Upgradeable, IERC20Upgradeable) returns (bool) {

        CometInterface(asset()).accrueAccount(address(this));
        bool status = super.transferFrom(from, to, amount);

        return status;
    }
    function claimX() public {

        // Claim Xtra COMP rewards
        CometRewards(rewards).claim(asset(), address(this), true);

        uint256 amount = IERC20Upgradeable(comp).balanceOf(address(this));
        if (amount > 0) {

            IERC20Upgradeable(comp).transfer(multisig, amount);
            emit ClaimedX(amount);
        }
    }

    // --- Views ---
    function decimals() public view virtual override(ERC20Upgradeable, IERC20MetadataUpgradeable) returns (uint8) {
        return 6;
    }
    function totalAssets() public view override returns (uint256) {

        uint64 baseSupplyIndex_ = accruedSupplyIndex();
        uint256 supply = totalSupply();
        return supply > 0 ? presentValueSupply(baseSupplyIndex_, supply) : 0;
    }
    function accruedSupplyIndex() internal view returns (uint64) {
        (uint64 baseSupplyIndex_,,uint40 lastAccrualTime) = getSupplyIndices();
        uint256 timeElapsed = uint256(getNowInternal() - lastAccrualTime);
        if (timeElapsed > 0) {
            uint256 utilization = CometInterface(asset()).getUtilization();
            uint256 supplyRate = CometInterface(asset()).getSupplyRate(utilization);
            baseSupplyIndex_ += safe64(mulFactor(baseSupplyIndex_, supplyRate * timeElapsed));
        }
        return baseSupplyIndex_;
    }
    function getSupplyIndices() internal view returns (uint64 baseSupplyIndex_, uint64 trackingSupplyIndex_, uint40 lastAccrualTime_) {
        CometExtInterface.TotalsBasic memory totals = CometInterface(asset()).totalsBasic();
        baseSupplyIndex_ = totals.baseSupplyIndex;
        trackingSupplyIndex_ = totals.trackingSupplyIndex;
        lastAccrualTime_ = totals.lastAccrualTime;
    }
    function getNowInternal() internal view virtual returns (uint40) {
        require(block.timestamp < 2**40);
        return uint40(block.timestamp);
    }
    function mulFactor(uint256 n, uint256 factor) internal pure returns (uint256) {
        return n * factor / FACTOR_SCALE;
    }
    function presentValueSupply(uint64 baseSupplyIndex_, uint256 principalValue_) internal pure returns (uint256) {
        return principalValue_ * baseSupplyIndex_ / BASE_INDEX_SCALE;
    }
    function principalValueSupply(uint64 baseSupplyIndex_, uint256 presentValue_) internal pure returns (uint104) {
        return safe104((presentValue_ * BASE_INDEX_SCALE) / baseSupplyIndex_);
    }
    function convertToAssets(uint256 shares) public view override returns (uint256) {
        uint64 baseSupplyIndex_ = accruedSupplyIndex();
        return shares > 0 ? presentValueSupply(baseSupplyIndex_, shares) : 0;
    }
    function convertToShares(uint256 assets) public view override returns (uint256) {
        uint64 baseSupplyIndex_ = accruedSupplyIndex();
        return assets > 0 ? principalValueSupply(baseSupplyIndex_, assets) : 0;
    }
    function previewDeposit(uint256 assets) public view virtual override returns (uint256) {
        return convertToShares(assets);
    }
    function previewMint(uint256 shares) public view override returns (uint256) {
        return convertToAssets(shares);
    } 
    function previewWithdraw(uint256 assets) public view override returns (uint256) {
        return convertToShares(assets);
    }
    function previewRedeem(uint256 shares) public view virtual override returns (uint256) {
        return convertToAssets(shares);
    }
    function maxWithdraw(address owner) public view virtual override returns (uint256) {
        return convertToAssets(balanceOf(owner));
    }
    function underlyingBalance(address account) public view returns (uint256) {
        uint64 baseSupplyIndex_ = accruedSupplyIndex();
        uint256 principal = balanceOf(account);
        return principal > 0 ? presentValueSupply(baseSupplyIndex_, principal) : 0;
    }
    
    // --- Admin ---
    function pause() public onlyOwner {
        _pause();
    }
    function unpause() public onlyOwner {
        _unpause();
    }
    function file(bytes32 _what, address _data) external onlyOwner {

        require(_data != address(0), "wcUSDC/zero-address");

        if (_what == "rewards") rewards = _data;
        else if (_what == "comp") comp = _data;
        else if (_what == "multisig") multisig = _data;
        else revert ("wcUSDC/invalid-string");

        emit File(_what, _data);
    }
    
    // ---------------
    // --- ERC4626 ---
    /** Kept only for the sake of ERC4626 standard
      */
    function mint(uint256 shares, address receiver) public override returns (uint256) { revert(); }
    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256) { revert(); }
}