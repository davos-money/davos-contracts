// SPDX-License-Identifier: AGPL-3.0-or-later

/// jar_v2.sol -- Davos distribution farming

// Copyright (C) 2022
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";


contract Jar_V2 is Initializable, ERC4626Upgradeable, ReentrancyGuardUpgradeable  {
    // --- Wrapper ---
    using SafeERC20Upgradeable for IERC20Upgradeable;

    
    mapping (address => uint) public wards;
    mapping(address => uint) public operators;  // Operators of contract

    // --- Auth ---
    function rely(address guy) external auth { wards[guy] = 1; }
    function deny(address guy) external auth { wards[guy] = 0; }
    modifier auth {
        require(wards[msg.sender] == 1, "Jar_V2/not-authorized");
        _;
    }

    address public DAVOS;  // The DAVOS Stable Coin
    uint public live;  // Active Flag

    
    // --- Events ---
    event Cage();
    event UnCage();
    event OperatorSet(address operator);
    event OperatorUnset(address operator);

    /// @custom:oz-upgrades-unsafe-allow constructor
    // --- Constructor ---
    constructor() { _disableInitializers(); }

    // --- Init ---
    function initialize(string memory _name, string memory _symbol, address _davosToken) external initializer {
        __ReentrancyGuard_init();
        wards[msg.sender] = 1;
        decimals = 18;
        name = _name;
        symbol = _symbol;
        DAVOS = _davosToken;
        live = 1;
    }

    // --- Math ---
    function _min(uint a, uint b) internal pure returns (uint) {
        return a < b ? a : b;
    }

    function addOperator(address _operator) external auth {
        operators[_operator] = 1;
        emit OperatorSet(_operator);
    }
    function removeOperator(address _operator) external auth {
        operators[_operator] = 0;
        emit OperatorUnset(_operator);
    }

    function putRewards(uint256 _amount ) external { 
        IERC20Upgradeable(DAVOS).safeTransferFrom(msg.sender, address(this), _amount); 
    }
}