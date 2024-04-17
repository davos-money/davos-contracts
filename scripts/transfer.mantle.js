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
    let _multisig = "0x943a51815d19A4B1ff1BedF6aC41e1F2Daa5930e";

    // let _bridge = "0xA88B54E6b76Fb97CdB8eCAE868f1458e18a953F4"; 

    // let _davosProvider1 = "0x17a902FDc6860734751E315F0799673673096c9B"; 
    // let _masterVault1 = "0xbD38B722480e2e3D540CaFC44A113d92E1015faa";
    // let _gemJoin1 = "0xdd0BdF5749e300f946cdb1dDFE1ffa828eC0dB72";
    // let _clip1 = "0x92AFc5c40d03155151b2cd76Fa0F0C7C6e31Ee03";
    // let _dCol1 = "0x54809f204999a886839AC46b2FD796282e727158";

    // let _davosProvider2 = "0xA637fC730758A454A1567fE21EF4059a84c61cf2";
    // let _masterVault2 = "0xafCA20A243e4e4936fAF76e8893128A231678677";
    // let _gemJoin2 = "0x6AD9b86A1Aba4D7ea682270936B923049bDBF973";
    // let _clip2 = "0xB2E306386A514806Bc937DAc66d1236799D2316E";
    // let _dCol2 = "0xaeC57b40C771B3d2cE0A57a84ce94E3FaF55b86e";

    // let _davosProvider3 = "0xafF49343e7915532D7121dd2F31e8EB15f4bE084";
    // let _masterVault3 = "0xFdC5033b6Ef5DEDc6b5225B3Fbe3704C3F9638eE";
    // let _gemJoin3 = "0xdFba4fC2c710F3C5601C9E0Db97Ff61FCf84a5FD";
    // let _clip3 = "0x20E089f2d5A2eb9A06429CF21B506aD1A5163231";
    // let _dCol3 = "0x5449d4358CB87a80a655f5B398677b89230CC2CE";

    // let _interaction = "0x7e426F367C40Fc6e1ec919E0a7E51fcb9a564B0F";
    // let _rewards = "0x0837253AF481db0a9B5eA17F9F983E7606051995";
    // let _vat = "0x08ABFd7DEd42CC33900d3457118eAB7fC40b71c8";
    // let _spot = "0x8D575d202B7653fb2E076Be451B006626Cc31858";
    // let _davos = "0x819d1Daa794c1c46B841981b61cC978d95A17b8e";
    // let _davosJoin = "0x77F4C841cb87fDFa43aB909cf56f7710Af648a8e";
    // let _jug = "0x02C7420407A6439d49E9816399A5d5b03187363B";
    // let _vow = "0x29Ded4C99690968562f2D067968aA72b7d46A65D";
    // let _dog = "0xE309C0FE37D3696Cf8c13A629Dc43eAEfC077418";
    // let _abacus = "0x72112dEEb7F68B5A2629AdfB7b5830D8C06Dc8A1";
    // let _ratioAdapter = "0x046B71694B3b659F491247167EDa42E0556123cf";
    // let _jar = "0xF97680e99Be42daCCEA9fe6f9F9aa385ccf97a62";

    console.log("Transfering Ownerships");

    // // Fetching for Set1
    // console.log("SET 1");
    // let davosProvider = await ethers.getContractAt("DavosProvider", _davosProvider1);
    // let masterVault = await ethers.getContractAt("MasterVault", _masterVault1)
    // let gemJoin = await ethers.getContractAt("GemJoin", _gemJoin1);
    // let clip = await ethers.getContractAt("Clipper", _clip1)
    // let dCol = await ethers.getContractAt("dCol", _dCol1);

    // await davosProvider.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    // await masterVault.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    // await gemJoin.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    // await clip.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    // await dCol.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("5");

    // // Fetching for Set2
    // console.log("SET 2");
    // davosProvider = await ethers.getContractAt("DavosProvider", _davosProvider2);
    // masterVault = await ethers.getContractAt("MasterVault", _masterVault2)
    // gemJoin = await ethers.getContractAt("GemJoin", _gemJoin2);
    // clip = await ethers.getContractAt("Clipper", _clip2)
    // dCol = await ethers.getContractAt("dCol", _dCol2);

    // await davosProvider.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    // await masterVault.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    // await gemJoin.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    // await clip.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    // await dCol.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("5");

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

    // // Fetching for RatioAdapter
    // console.log("Set 4");
    // let ratioAdapter = await ethers.getContractAt("RatioAdapter", _ratioAdapter);
    // await ratioAdapter.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1")

    // Fetching for Bridge
    console.log("Set 5");
    let bridge = await ethers.getContractAt("RatioAdapter", "0xA88B54E6b76Fb97CdB8eCAE868f1458e18a953F4")
    await bridge.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");

    // Fetching for ProxyAdmins
    console.log("Set 6");
    let pa1 = await ethers.getContractAt("DavosProvider", "0xD1e45eb93195cC72ddFd510CDfdBDc2A92b7bBD7");
    let pa2 = await ethers.getContractAt("DavosProvider", "0xD52ad5Fd7cCeB314676fA53F27339F5D3Ed43026");

    await pa1.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    await pa2.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");

    // // Fetching for Core
    // console.log("Core");

    // let interaction = await ethers.getContractAt("Vat", _interaction);
    // let rewards = await ethers.getContractAt("Vat", _rewards);
    // let vat = await ethers.getContractAt("Vat", _vat);
    // let spot = await ethers.getContractAt("Vat", _spot);
    let davos = await ethers.getContractAt("Vat", "0x62A509BA95c75Cabc7190469025E5aBeE4eDdb2a");
    // let davosJoin = await ethers.getContractAt("Vat", _davosJoin);
    // let jug = await ethers.getContractAt("Vat", _jug);
    // let vow = await ethers.getContractAt("Vat", _vow);
    // let dog = await ethers.getContractAt("Vat", _dog);
    // let abacus = await ethers.getContractAt("Vat", _abacus);
    // let jar = await ethers.getContractAt("Vat", _jar);

    // await interaction.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    // await rewards.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    // await vat.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    // await spot.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    await davos.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("5");
    // await davosJoin.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("6");
    // await jug.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("7");
    // await vow.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("8");
    // await dog.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("9");
    // await abacus.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("10");
    // await jar.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("11");

    console.log("Transfer Complete !!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});