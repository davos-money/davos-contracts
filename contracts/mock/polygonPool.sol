// SPDX-License-Identifier: AGPL-3.0-or-later

/// jar.sol -- Davos distribution farming

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

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface TokenInterface {
    function mint(address, uint256) external;
    function burn(address, uint256) external;
    function transfer(address, uint256) external;
    function transferFrom(address, address, uint256) external;
    function ratio() external view returns(uint256);
}

contract PolygonPool {

    // aMATICc
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint) public balanceOf;

    uint256 private _minimumStake;
    address public cert;
    address public wMATIC;

    constructor(address _cert, address _wMATIC) {
        _minimumStake = 5e15;
        cert = _cert;
        wMATIC = _wMATIC;
    }

    function setMinimumStake(uint256 minimumStake_) external {
        _minimumStake = minimumStake_;
    }

    function stakeAndClaimCerts(uint256 amount) external {
        TokenInterface(wMATIC).transferFrom(msg.sender, address(this), amount);
        uint256 mintAmount = (amount * TokenInterface(cert).ratio()) / 1e18;
        TokenInterface(cert).mint(msg.sender, mintAmount);
    }

    function unstakeCertsFor(address recipient, uint256 shares, uint256 fee, uint256 useBeforeBlock, bytes memory signature) external payable {
        TokenInterface(cert).burn(msg.sender, shares);
        uint256 mintAmount = (shares * 1e18) / TokenInterface(cert).ratio();
        TokenInterface(wMATIC).transfer(recipient, mintAmount);
    }

    function getMinimumStake() external returns(uint256) {
        return _minimumStake;
    }
}