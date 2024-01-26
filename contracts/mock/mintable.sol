// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MockToken is OwnableUpgradeable, ERC20Upgradeable {

    struct UserBasic {
        int104 principal;
        uint64 baseTrackingIndex;
        uint64 baseTrackingAccrued;
        uint16 assetsIn;
        uint8 _reserved;
    }
    
    function initialize(string memory name, string memory symbol) external initializer {
        __Ownable_init();
        __ERC20_init_unchained(name, symbol);
    }

    function decimals() public view override returns(uint8) {
        return 18;
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function mint(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    function convertToAssets(uint256 amount) external view returns (uint256) {
        return amount;
    }

    function convertToShares(uint256 amount) external view returns (uint256) {
        return amount;
    }

    function accrueAccount(address) external {}

    function userBasic(address account) external view returns (UserBasic memory) {
        UserBasic memory basic;
        basic.principal = int104(uint104(balanceOf(account)));
        return basic;
    }
}