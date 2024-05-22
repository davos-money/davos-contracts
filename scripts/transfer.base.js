let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Addresses
    let _multisig = "0x400d5477e52c5037f6eF1BceBc063eDF68a7603D";

    let _davosProvider1 = "0xd9BE9956C822000cc0078C16C66B7dd83E6E07C4"; 
    let _masterVault1 = "0x455Db2994ecfBF5F23936eeA0Fe34D7e3522c9cd";
    let _gemJoin1 = "0x6f44E8fD1C8663C29e4d162Ca7BeC577490e1Bbf";
    let _clip1 = "0xCdF972e0EC2aAe2cDbCaafb2D9d890990d7EB64F";
    let _dCol1 = "0xAEDE8Ff87ad9b08397f68D577fCe20Bf1d19E24d";

    let _interaction = "0x4039Df3B098124b42Ba54bC75B9b6e20ec3060BC";
    let _rewards = "0xD34176E8B4Efb3C846dC07A9938498067525F893";
    let _vat = "0xd678b48DC9b92626b5C406C3f07a153FB9f23687";
    let _spot = "0x7B0E879f4860767d5e2455591Ba025978ab3461F";
    let _davosJoin = "0xc9069E47C72C0c54F473Ca44691cF64e5C95a823";
    let _jug = "0x5bF6C2a5dF522FeD9FaA17AA280510b4F78163E6";
    let _vow = "0xcb52C3ED8d7a809f05ED93e6E86B837e116C7AcD";
    let _dog = "0x5E7A00d850CD5E523002F25fA358a07C028ddC93";
    let _abacus = "0x738F9Ed74a64a01DA9FA3561230eBFa0F309cdC3";
    let _ratioAdapter = "0x8428F7C1Dd8Ee21e11924A7D71221641d3f2c3fA";

    console.log("Transfering Ownerships");

    // Fetching for Set1
    console.log("SET 1");
    let davosProvider = await ethers.getContractAt("DavosProvider", _davosProvider1);
    let masterVault = await ethers.getContractAt("MasterVault", _masterVault1)
    let gemJoin = await ethers.getContractAt("GemJoin", _gemJoin1);
    let clip = await ethers.getContractAt("Clipper", _clip1)
    let dCol = await ethers.getContractAt("dCol", _dCol1);

    await davosProvider.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    await masterVault.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    await gemJoin.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    await clip.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    await dCol.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("5");

    // Fetching for RatioAdapter
    console.log("Set 4");
    let ratioAdapter = await ethers.getContractAt("RatioAdapter", _ratioAdapter);
    await ratioAdapter.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1")

    // Fetching for ProxyAdmins
    console.log("Set 6");
    let pa1 = await ethers.getContractAt("DavosProvider", "0x4B3fb1CD9eF4171509de149f8f3F5716892d405c");
    // let pa2 = await ethers.getContractAt("DavosProvider", "0xD52ad5Fd7cCeB314676fA53F27339F5D3Ed43026");

    await pa1.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    // await pa2.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");

    // Fetching for Core
    console.log("Core");

    let interaction = await ethers.getContractAt("Vat", _interaction);
    let rewards = await ethers.getContractAt("Vat", _rewards);
    let vat = await ethers.getContractAt("Vat", _vat);
    let spot = await ethers.getContractAt("Vat", _spot);
    // let davos = await ethers.getContractAt("Vat", _davos);
    let davosJoin = await ethers.getContractAt("Vat", _davosJoin);
    let jug = await ethers.getContractAt("Vat", _jug);
    let vow = await ethers.getContractAt("Vat", _vow);
    let dog = await ethers.getContractAt("Vat", _dog);
    let abacus = await ethers.getContractAt("Vat", _abacus);
    // let jar = await ethers.getContractAt("Vat", _jar);

    await interaction.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    await rewards.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    await vat.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    await spot.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    // await davos.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("5");
    await davosJoin.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("6");
    await jug.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("7");
    await vow.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("8");
    await dog.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("9");
    await abacus.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("10");
    // await jar.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("11");

    console.log("Transfer Complete !!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});