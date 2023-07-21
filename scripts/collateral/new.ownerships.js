let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000", // 45 Decimals
    ONE = 10 ** 27;

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    let { _masterVault, _davosProvider, _dMatic, _clip, _gemJoin} = require(`./addresses_${hre.network.name}.json`);
    let { _multisig} = require(`./config_${hre.network.name}.json`);

    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
    this.DMatic = await hre.ethers.getContractFactory("dCol");
    this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
    this.Clip = await hre.ethers.getContractFactory("Clipper");
    this.Interaction = await hre.ethers.getContractFactory("Interaction", {
        unsafeAllow: ['external-library-linking'],
        libraries: {
            AuctionProxy: "0x1A80B0512580791dDA042FeF0083e6Ce7cbd5d88"
        }
    });
    let newInt = await this.Interaction.deploy({nonce: _nonce}); _nonce += 1;
    await newInt.deployed();
    console.log("Interaction: ", newInt.address);

    // Initialize
    console.log("Initializing...");

    let masterVaultAt = await ethers.getContractAt("MasterVault_V2", _masterVault);
    let davosProviderAt = await ethers.getContractAt("DavosProvider", _davosProvider);
    let dMaticAt = await ethers.getContractAt("dCol", _dMatic);
    let gemJoinAt = await ethers.getContractAt("GemJoin", _gemJoin);
    let clipAt = await ethers.getContractAt("Clipper", _clip);

    console.log("Transfering...");
    await masterVaultAt.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    await davosProviderAt.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    await dMaticAt.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    await gemJoinAt.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    await clipAt.rely(_multisig, {nonce: _nonce}); _nonce += 1;
    console.log("Transfer Complete !!!");

    
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});