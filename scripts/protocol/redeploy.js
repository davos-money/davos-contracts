let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const { deploy } = require("@openzeppelin/hardhat-upgrades/dist/utils");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
        
    // Deployment
    let _davosAddress = "0x819d1Daa794c1c46B841981b61cC978d95A17b8e";
    let _vatAddress = "0x84cd2E9E46FB44E9f775A5fd08EDCDaF2377c3C1";
    let _spotAddress = "0xf0BB4edF7c777EBA1a728403c92DF61f9AABf9c9";
    let _jugAddress = "0xbfD158A63D2f58F7F723939bD492dAF111d6Efb4";
    let _dogAddress = "0x41bBd9F4359752c2647dEcB0bb3c7a08a0c3083D";
    let _vowAddress = "0x24027Bf7268B7617837213D0baDbA4553D740393";
    let _rewardsAddress = "0x9eDC0ea75e6023b93bbB41c16818e314cfE59D2b";

    console.log("DavosJoin...");
    this.DavosJoin = await hre.ethers.getContractFactory("DavosJoin");
    let davosJoin = await upgrades.deployProxy(this.DavosJoin, [_vatAddress, _davosAddress], {initializer: "initialize"});
    await davosJoin.deployed();
    console.log("DavosJoin       :", davosJoin.address);

    console.log("Interaction...");
    this.AuctionProxy = await hre.ethers.getContractFactory("AuctionProxy");
    const auctionProxy = await this.AuctionProxy.deploy();
    this.Interaction = await hre.ethers.getContractFactory("Interaction", {
        unsafeAllow: ['external-library-linking'],
        libraries: {
            AuctionProxy: auctionProxy.address
        }
    });
    let interaction = await upgrades.deployProxy(this.Interaction, [_vatAddress, _spotAddress, _davosAddress, davosJoin.address, _jugAddress, _dogAddress, _rewardsAddress], {
            initializer: "initialize",
            unsafeAllowLinkedLibraries: true
        }
    );
    await interaction.deployed();
    console.log("interaction     : " + interaction.address);
    console.log("AuctionProxy    : " + auctionProxy.address);

    // Store Deployed Contracts
    const addresses = {
        _davosJoin      : davosJoin.address,
        _interaction    : interaction.address,
        _auctionProxy   : auctionProxy.address
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/protocol/addresses_${hre.network.name}_1b.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/protocol/addresses_${hre.network.name}_1b.json`);

    // // Attaching
    // let vat = await hre.ethers.getContractAt("Vat", _vatAddress);
    // let vow = await hre.ethers.getContractAt("Vow", _vowAddress);
    // let dog = await hre.ethers.getContractAt("Dog", _dogAddress);

    // let _oldInteraction = "0xbB3C4f6F468e033211E05c515E4a0B79F63A38e0";

    // console.log("Vat init...");
    // let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    // let _nonce = initialNonce
    // await vat.rely(davosJoin.address, {nonce: _nonce}); _nonce += 1;
    // await vat.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    // await vat.deny("0x6cFca08A8535A1029F906b1D7aCeb421372c240F", {nonce: _nonce}); _nonce += 1;
    // await vat.deny(_oldInteraction, {nonce: _nonce}); _nonce += 1;

    // console.log("Spot init...");
    // await spot.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    // await spot.deny(_oldInteraction, {nonce: _nonce}); _nonce += 1;

    // console.log("Rewards init...");
    // await rewards.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    // await rewards.deny(_oldInteraction, {nonce: _nonce}); _nonce += 1;

    // console.log("Dog init...");
    // await dog.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    // await dog.deny(_oldInteraction, {nonce: _nonce}); _nonce += 1;

    // console.log("Jug...");
    // await jug.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    // await jug.deny(_oldInteraction, {nonce: _nonce}); _nonce += 1;

    // console.log("Davos init...");
    // await davos.rely(davosJoin.address, {nonce: _nonce}); _nonce += 1;

    // console.log("Joins init...");
    // await davosJoin.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    // await davosJoin.rely(vow.address, {nonce: _nonce}); _nonce += 1;

    // console.log("Vow init...");
    // await vow["file(bytes32,address)"](ethers.utils.formatBytes32String("davos"), _davosAddress, {nonce: _nonce}); _nonce += 1;
    // await vow["file(bytes32,address)"](ethers.utils.formatBytes32String("davosjoin"), davosJoin.address, {nonce: _nonce}); _nonce += 1;

    // console.log("Davos Provider...");
    // let davosProvider = await hre.ethers.getContractAt("DavosProvider", "0x74e2B96507fBDebDF8190C880811E1dbB2b7FcD3");
    // await davosProvider.changeInteraction(interaction.address, {nonce: _nonce}); _nonce += 1;

    // console.log("Gemjoin init...");
    // let gemJoinAt = await hre.ethers.getContractAt("GemJoin", "0x8A274d2c30fdc3723e50497FD08ab5A0E2AE0B81");
    // await gemJoinAt.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    // await gemJoinAt.deny(_oldInteraction, {nonce: _nonce}); _nonce += 1;

    // console.log("Clip init...");
    // let clipAt = await hre.ethers.getContractAt("Clipper", "0x24318b8a0CBaCc61cAdE47e5457Eea7237EB2c0E");
    // await clipAt.rely(interaction.address, {nonce: _nonce}); _nonce += 1; console.log("1")
    // await clipAt.deny(_oldInteraction, {nonce: _nonce}); _nonce += 1; console.log("1")

    // let _mat = "1515151515151515151515151515";
    // let _masterVault = "0x93402F1908dD009C857962b45278E71C7F63647f";

    // console.log("Interaction init...");
    // await interaction.setDavosProvider(_masterVault, davosProvider.address, {nonce: _nonce}); _nonce += 1; console.log("1")
    // await interaction.setCollateralType(_masterVault, gemJoinAt.address, "0x4d56545f657a4554480000000000000000000000000000000000000000000000", clipAt.address, _mat, {nonce: _nonce}); _nonce += 1; console.log("2")
    // await interaction.poke(_masterVault, {nonce: _nonce, gasLimit: 3000000}); _nonce += 1; console.log("3")
    // await interaction.drip(_masterVault, {nonce: _nonce, gasLimit: 2000000}); _nonce += 1; console.log("4")
    // await interaction.setCollateralDuty(_masterVault, "1000000001622535724756171270", {nonce: _nonce, gasLimit: 25000000}); _nonce += 1; console.log("5")

    // console.log("Protocol Ready !!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});