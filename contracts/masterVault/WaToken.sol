// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "hardhat/console.sol";

// import {WadRayMath} from 'aave-v3-core/contracts/protocol/libraries/math/WadRayMath.sol';
// import {MathUtils} from 'aave-v3-core/contracts/protocol/libraries/math/MathUtils.sol';
// import {SafeCast} from 'solidity-utils/contracts/oz-common/SafeCast.sol';

// // --- Interfaces ---
// interface IPool {
//     function getReserveNormalizedIncome(address) external view returns (uint256);
// }

// interface IAToken {
//     function POOL() external view returns(address);
//     function UNDERLYING_ASSET_ADDRESS() external view returns (address);
// }

// --- Contacts ---
contract WAToken is ERC4626Upgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {

    // --- Wrappers ---
    // using SafeCast for uint256;
    // using WadRayMath for uint256;
    // using RayMathExplicitRounding for uint256;

    // address public pool;

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

        // pool = IAToken(_underlying).POOL();
    }

    // --- Public ---
    // function redeem(uint256 shares, address receiver, address owner) public virtual override returns (uint256) {

    //     require(shares <= maxRedeem(owner), "ERC4626: redeem more than max");

    //     uint256 assets = previewRedeem(shares - 10);  // Aave asset transfer might decrease shares by 1
    //     _withdraw(_msgSender(), receiver, owner, assets, shares);

    //     return assets;
    // }

    // function rate() public view returns (uint256) {

    //     return IPool(pool).getReserveNormalizedIncome(IAToken(asset()).UNDERLYING_ASSET_ADDRESS());
    // }

    // function _convertToShares(uint256 assets, MathUpgradeable.Rounding rounding) internal override view returns (uint256) {

    //     if (uint256(rounding) == uint256(RayMathExplicitRounding.Rounding.Up)) return assets.rayDivRoundUp(rate());
    //     return assets.rayDivRoundDown(rate());
    // }

    // function _convertToAssets(uint256 shares, MathUpgradeable.Rounding rounding) internal override view returns (uint256) {

    //     if (uint256(rounding) == uint256(RayMathExplicitRounding.Rounding.Up)) return shares.rayMulRoundUp(rate());
    //     return shares.rayMulRoundDown(rate());
    // }

    // ---------------
    // --- ERC4626 ---
    /** Kept only for the sake of ERC4626 standard
      */
    function mint(uint256 shares, address receiver) public override returns (uint256) { revert(); }
    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256) { revert(); }
}

// // --- Libraries
// library RayMathExplicitRounding {

//     enum Rounding {
//         Up,
//         Down
//     }

//     uint256 internal constant RAY = 1e27;
//     uint256 internal constant WAD_RAY_RATIO = 1e9;

//     function rayMulRoundDown(uint256 a, uint256 b) internal pure returns (uint256) {
//         if (a == 0 || b == 0) {
//             return 0;
//         }
//         return (a * b) / RAY;
//     }

//     function rayMulRoundUp(uint256 a, uint256 b) internal pure returns (uint256) {
//         if (a == 0 || b == 0) {
//             return 0;
//         }
//         return ((a * b) + RAY - 1) / RAY;
//     }

//     function rayDivRoundDown(uint256 a, uint256 b) internal pure returns (uint256) {
//         return (a * RAY) / b;
//     }

//     function rayDivRoundUp(uint256 a, uint256 b) internal pure returns (uint256) {
//         return ((a * RAY) + b - 1) / b;
//     }

//     function rayToWadRoundDown(uint256 a) internal pure returns (uint256) {
//         return a / WAD_RAY_RATIO;
//     }
// }