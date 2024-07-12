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
    let _multisig = "0x9DA9270DE0Fa48c2626EcB57154b3D72d45BC298";

    // let _bridge = "0xA88B54E6b76Fb97CdB8eCAE868f1458e18a953F4"; 

    let _davosProvider1 = "0x2770cB901e6d990B4F5C35E0732821eBf9d3acb7"; 
    let _masterVault1 = "0xF41f47eeB7379837D87Af0C32DB76E5925b8555e";
    let _gemJoin1 = "0xCEC1919D5f5a84cE5977222bB4bc89C1992F7190";
    let _clip1 = "0x6082FaA820A6CBF3350A794E02F485fB0C78E6F5";
    let _dCol1 = "0x8d7afbe930f36519DF580aAF45C31cAa470731F4";

    let _davosProvider2 = "0x9059e7bf0D97a0572b0C92aB9a788c14ACa2245C";
    let _masterVault2 = "0x614D9f79ee339f696AE9303f2fF6c40300364249";
    let _gemJoin2 = "0xf9F61Bb053B778cD3D686A9963813391f780687e";
    let _clip2 = "0x4D369feb9A2579e9D36BbEeDD94595446B3e977b";
    let _dCol2 = "0xC09D8C9a780E79Df8b8aCFB5Ec1b9e66fA3B5724";

    // let _davosProvider3 = "0xafF49343e7915532D7121dd2F31e8EB15f4bE084";
    // let _masterVault3 = "0xFdC5033b6Ef5DEDc6b5225B3Fbe3704C3F9638eE";
    // let _gemJoin3 = "0xdFba4fC2c710F3C5601C9E0Db97Ff61FCf84a5FD";
    // let _clip3 = "0x20E089f2d5A2eb9A06429CF21B506aD1A5163231";
    // let _dCol3 = "0x5449d4358CB87a80a655f5B398677b89230CC2CE";

    let _interaction = "0xC71428faD4469688c3B1f02C538f1e534730F429";
    let _rewards = "0x9eE76D3D5aF85e5A8FF7326c513B5f380Aa659a8";
    let _vat = "0x0B7c01D1a4ddFa9DdEFa5944eAc2E5c182393c05";
    let _spot = "0xbfE8c19642929Ea9FfD1754e8DdAb880F05022f1";
    // let _davos = "";
    let _davosJoin = "0x451A1d5f0bE601811d9e84e034C8B8D74cA242a4";
    let _jug = "0x3210dCdaC1DCf2619Efd6423be83Cc7B815425f2";
    let _vow = "0x925BEDd155c21B673bfD9F00e0eA23dd85d70186";
    let _dog = "0x68d0ff34196183e14F9C17DcE6566aFAc584a3C9";
    let _abacus = "0xD34176E8B4Efb3C846dC07A9938498067525F893";
    let _ratioAdapter = "0xbac16a2f52bfd14abB561aB702AEBcf906F41A9A";
    // let _jar = "";

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

    // // Fetching for Set3
    // console.log("SET 3");
    // davosProvider = await ethers.getContractAt("DavosProvider", _davosProvider3);
    // masterVault = await ethers.getContractAt("MasterVault", _masterVault3)
    // gemJoin = await ethers.getContractAt("GemJoin", _gemJoin3);
    // clip = await ethers.getContractAt("Clipper", _clip3)
    // dCol = await ethers.getContractAt("dCol", _dCol3);

    // await davosProvider.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    // await masterVault.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    // await gemJoin.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    // await clip.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    // await dCol.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("5");

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
    let pa1 = await ethers.getContractAt("DavosProvider", "0x7B0E879f4860767d5e2455591Ba025978ab3461F");
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