// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MockAnkrETHa is OwnableUpgradeable, ERC20Upgradeable {
    
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

    function convertToShares(uint256 assets) public view virtual returns (uint256) {
        return assets;
    }

    function convertToAssets(uint256 shares) public view virtual returns (uint256) {
        return shares;
    }

    function getWstETHByStETH(uint256 _stETHAmount) external view returns (uint256) {
        return _stETHAmount;
    }

    function getStETHByWstETH(uint256 _wstETHAmount) external view returns (uint256) {
        return _wstETHAmount;
    }

    function getRethValue(uint256 _ethAmount) public view returns (uint256) {
        return _ethAmount;
    }

    function getEthValue(uint256 _rethAmount) public view returns (uint256) {
        return _rethAmount;
    }
}