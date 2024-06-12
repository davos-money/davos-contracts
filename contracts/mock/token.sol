// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC20ModUpgradeable.sol";

contract Token is OwnableUpgradeable, ERC20ModUpgradeable {

    uint256 public ratio;
    
    function initialize(string memory name, string memory symbol) external initializer {
        __Ownable_init();
        __ERC20_init_unchained(name, symbol);
        ratio = 1e18;
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function setRatio(uint256 _ratio) external {
        ratio = _ratio;
    }

    function deposit() public payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external payable {
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    // wstETH
    function getWstETHByStETH(uint256 amount) external view returns(uint256) {
        return amount * ratio / 1e18;
    }

    function getStETHByWstETH(uint256 amount) external view returns(uint256) {
        return amount * 1e18 / ratio;
    }

    // stMatic
    function convertMaticToStMatic(uint256 _balance)
    external
    view
    returns (
        uint256,
        uint256,
        uint256
    )
    {
        return (_balance * ratio / 1e18, 0, 0);
    }

    function convertStMaticToMatic(uint256 _balance)
    external
    view
    returns (
        uint256,
        uint256,
        uint256
    )
    {
        return (_balance * 1e18 / ratio, 0, 0);
    }

    // rETH - ratio goes up
    // ETH => rETH
    function getRethValue(uint256 amount) external view returns (uint256) {
        return amount * 1e18 / ratio;
    }

    // rETH => ETH
    function getEthValue(uint256 amount) external view returns (uint256) {
        return amount * ratio / 1e18;
    }

    // sfrxETH
    function convertToAssets(uint256 amount) external view returns (uint256) {
        return amount * 1e18 / ratio;
    }

    function convertToShares(uint256 amount) external view returns (uint256) {
        return amount * ratio / 1e18;
    }

    // ankrETH
    function sharesToBonds(uint256 amount) external view returns (uint256) {
        return amount * 1e18 / ratio;
    }

    function bondsToShares(uint256 amount) external view returns (uint256) {
        return amount * ratio / 1e18;
    }

    // MATICx
    function convertMaticToMaticX(uint256 _balance)
    external
    view
    returns (
        uint256,
        uint256,
        uint256
    )
    {
        return (_balance * ratio / 1e18, 0, 0);
    }

    function convertMaticXToMatic(uint256 _balance)
    external
    view
    returns (
        uint256,
        uint256,
        uint256
    )
    {
        return (_balance * 1e18 / ratio, 0, 0);
    }

    // swETH - doesn't have methods for conversion
    function ethToSwETHRate() external view returns (uint256) {
        return ratio;
    }

    // cbETH
    function exchangeRate() external view returns (uint256) {
        return ratio;
    }
}
