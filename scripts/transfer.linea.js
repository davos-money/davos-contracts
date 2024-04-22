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
    let _multisig = "0x8F0E864AE6aD45d973BD5B3159D5a7079A83B774";

    let _davosProvider1 = "0xd6E9D415c62A046cfC3bDf5bc3E9B5f769a8f700"; 
    let _masterVault1 = "0x7CDb0b6217A568947D3A2585F0E8AF135017d608";
    let _gemJoin1 = "0x21a517F987B388979f8C1E09E122fBa185AF15F3";
    let _clip1 = "0xbac16a2f52bfd14abB561aB702AEBcf906F41A9A";
    let _dCol1 = "0x6d5d70c0b85FC424C8608E6cB44311617c77981e";

    let _davosProvider2 = "0x6f44E8fD1C8663C29e4d162Ca7BeC577490e1Bbf";
    let _masterVault2 = "0xd9BE9956C822000cc0078C16C66B7dd83E6E07C4";
    let _gemJoin2 = "0x8d7afbe930f36519DF580aAF45C31cAa470731F4";
    let _clip2 = "0xCdF972e0EC2aAe2cDbCaafb2D9d890990d7EB64F";
    let _dCol2 = "0xF41f47eeB7379837D87Af0C32DB76E5925b8555e";

    let _davosProvider3 = "0xCEC1919D5f5a84cE5977222bB4bc89C1992F7190";
    let _masterVault3 = "0x2770cB901e6d990B4F5C35E0732821eBf9d3acb7";
    let _gemJoin3 = "0x780195A907dC6A4f943cD9CFea9Ba95907C28068";
    let _clip3 = "0x6082FaA820A6CBF3350A794E02F485fB0C78E6F5";
    let _dCol3 = "0x8428F7C1Dd8Ee21e11924A7D71221641d3f2c3fA";

    let _interaction = "0x738F9Ed74a64a01DA9FA3561230eBFa0F309cdC3";
    let _rewards = "0x5E7A00d850CD5E523002F25fA358a07C028ddC93";
    let _vat = "0x9032bDa78d8fCe219fB0E95b69E54047921BB816";
    let _spot = "0xfC9Bf9d3fB67422F89c816f698339a8916a3050f";
    let _davosJoin = "0x8ed3b45662e885aABbEBd89EBe8850aD9c3C96Aa";
    let _jug = "0xd678b48DC9b92626b5C406C3f07a153FB9f23687";
    let _vow = "0x7B0E879f4860767d5e2455591Ba025978ab3461F";
    let _dog = "0xc9069E47C72C0c54F473Ca44691cF64e5C95a823";
    let _abacus = "0x5bF6C2a5dF522FeD9FaA17AA280510b4F78163E6";
    let _ratioAdapter = "0x4D369feb9A2579e9D36BbEeDD94595446B3e977b";

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

    // Fetching for Set2
    console.log("SET 2");
    davosProvider = await ethers.getContractAt("DavosProvider", _davosProvider2);
    masterVault = await ethers.getContractAt("MasterVault", _masterVault2)
    gemJoin = await ethers.getContractAt("GemJoin", _gemJoin2);
    clip = await ethers.getContractAt("Clipper", _clip2)
    dCol = await ethers.getContractAt("dCol", _dCol2);

    await davosProvider.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    await masterVault.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    await gemJoin.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    await clip.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    await dCol.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("5");

    // Fetching for Set3
    console.log("SET 3");
    davosProvider = await ethers.getContractAt("DavosProvider", _davosProvider3);
    masterVault = await ethers.getContractAt("MasterVault", _masterVault3)
    gemJoin = await ethers.getContractAt("GemJoin", _gemJoin3);
    clip = await ethers.getContractAt("Clipper", _clip3)
    dCol = await ethers.getContractAt("dCol", _dCol3);

    await davosProvider.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    await masterVault.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    await gemJoin.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    await clip.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    await dCol.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("5");

    // Fetching for RatioAdapter
    console.log("Set 4");
    let ratioAdapter = await ethers.getContractAt("RatioAdapter", _ratioAdapter);
    await ratioAdapter.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1")

    // // Fetching for Bridge
    // console.log("Set 5");
    // let bridge = await ethers.getContractAt("RatioAdapter", _bridge)
    // await bridge.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");

    // Fetching for ProxyAdmins
    console.log("Set 6");
    let pa1 = await ethers.getContractAt("DavosProvider", "0x901810Bc0393f6a8fdd93a50Ff57A3A0e5cCad30");
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