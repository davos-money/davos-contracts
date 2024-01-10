// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MockToken is OwnableUpgradeable, ERC20Upgradeable {
    
    function initialize(string memory name, string memory symbol) external initializer {
        __Ownable_init();
        __ERC20_init_unchained(name, symbol);
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
}