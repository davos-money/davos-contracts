// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2021 Dai Foundation
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
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./interfaces/DavosJoinLike.sol";
import "./interfaces/VatLike.sol";
import "./interfaces/IDavos.sol";
import "./interfaces/IERC3156FlashLender.sol";
import "./interfaces/IERC3156FlashBorrower.sol";

contract Flash is Initializable, ReentrancyGuardUpgradeable, IERC3156FlashLender {

    // --- Auth ---
    function rely(address usr) external auth { wards[usr] = 1; emit Rely(usr); }
    function deny(address usr) external auth { wards[usr] = 0; emit Deny(usr); }
    mapping (address => uint256) public wards;
    modifier auth { require(wards[msg.sender] == 1, "Flash/not-authorized"); _; }

    // --- Data ---
    VatLike     public vat;
    DavosJoinLike public davosJoin;
    IDavos     public davos;
    address     public vow;

    uint256     public  max;     // Maximum borrowable DUSD [wad]
    uint256     public  toll;    // Fee to be returned      [wad = 100%]

    uint256 private constant WAD = 10 ** 18;
    uint256 private constant RAY = 10 ** 27;
    uint256 private constant RAD = 10 ** 45;

    bytes32 public constant CALLBACK_SUCCESS = keccak256("ERC3156FlashBorrower.onFlashLoan");

    // --- Events ---
    event Rely(address indexed usr);
    event Deny(address indexed usr);
    event File(bytes32 indexed what, uint256 data);
    event FlashLoan(address indexed receiver, address token, uint256 amount, uint256 fee);

    /// @custom:oz-upgrades-unsafe-allow constructor
    // --- Constructor ---
    constructor() { _disableInitializers(); }
    
    // --- Init ---
    function initialize(address _vat, address _dusd, address _davosJoin, address _vow) external initializer {
        wards[msg.sender] = 1;
        vat = VatLike(_vat);
        davosJoin = DavosJoinLike(_davosJoin);
        davos = IDavos(_dusd);
        vow = _vow;

        vat.hope(_davosJoin);
        davos.approve(_davosJoin, type(uint256).max);
        emit Rely(msg.sender);
    }

    // --- Administration ---
    function file(bytes32 what, uint256 data) external auth {
        if (what == "max") {
            // Add an upper limit of 10^27 DUSD to avoid breaking technical assumptions of DUSD << 2^256 - 1
            require((max = data) <= RAD, "Flash/ceiling-too-high");
        } else if (what == "toll") toll = data;
        else revert("Flash/file-unrecognized-param");
        emit File(what, data);
    }

    // --- ERC 3156 Spec ---
    function maxFlashLoan(address token) external override view returns (uint256) {
        if (token == address(davos)) {
            return max;
        } else {
            return 0;
        }
    }

    function flashFee(address token, uint256 amount) external override view returns (uint256) {
        require(token == address(davos), "Flash/token-unsupported");
        return (amount * toll) / WAD;
    }

    function flashLoan(IERC3156FlashBorrower receiver, address token, uint256 amount, bytes calldata data) external override nonReentrant returns (bool) {
        require(token == address(davos), "Flash/token-unsupported");
        require(amount <= max, "Flash/ceiling-exceeded");
        require(vat.live() == 1, "Flash/vat-not-live");

        uint256 amt = amount * RAY;
        uint256 fee = (amount * toll) / WAD;
        uint256 total = amount + fee;

        vat.suck(address(this), address(this), amt);
        davosJoin.exit(address(receiver), amount);

        emit FlashLoan(address(receiver), token, amount, fee);

        require(receiver.onFlashLoan(msg.sender, token, amount, fee, data) == CALLBACK_SUCCESS, "Flash/callback-failed");

        davos.transferFrom(address(receiver), address(this), total);
        davosJoin.join(address(this), total);
        vat.heal(amt);

        return true;
    }

    function accrue() external nonReentrant {
        vat.move(address(this), vow, vat.davos(address(this)));
    }
}