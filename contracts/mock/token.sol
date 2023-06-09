// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC20ModUpgradeable.sol";

contract Token is OwnableUpgradeable, ERC20ModUpgradeable {

    uint256 public ratio = 1e18;
    
    function initialize(string memory name, string memory symbol) external initializer {
        __Ownable_init();
        __ERC20_init_unchained(name, symbol);
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
}
