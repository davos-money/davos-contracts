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

contract MockAggregator {

    int256 public answer;

    constructor(int _answer) {
        answer = _answer;
    }
    function latestRoundData() external view returns(uint80,uint,uint,uint,uint80) {
        return(0,uint(answer),0,0,0);
    }

    function update(int _answer) external {
        answer = _answer;
    }

    function decimals() external view returns (uint256) {
        return 8;
    }
}