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
    let _ilk = ethers.utils.formatBytes32String("MVT_rETH");
    let { _vat, _spot, _dog} = require(`../deployment/addresses_${hre.network.name}_3.json`);
    let { _interaction, _auctionProxy } = require(`../deployment/addresses_${hre.network.name}_4.json`);
    let { _jug_duty, _mat} = require(`./config_${hre.network.name}.json`);

    let { _masterVault, _davosProvider, _dMatic, _clip, _gemJoin} = require(`./addresses_${hre.network.name}.json`);

    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
    this.DMatic = await hre.ethers.getContractFactory("dCol");
    this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
    this.Clip = await hre.ethers.getContractFactory("Clipper");
    // this.WstETHOracle = await hre.ethers.getContractFactory("WstETHOracle");

    // Initialize
    console.log("Initializing...");

    this.Interaction = await hre.ethers.getContractFactory("Interaction", {
        unsafeAllow: ['external-library-linking'],
        libraries: {
            AuctionProxy: _auctionProxy
        }
    });
    let interactionAttached = await this.Interaction.attach(_interaction);

    console.log("Interaction init...");
    await interactionAttached.setDavosProvider(_masterVault, _davosProvider, {nonce: _nonce}); _nonce += 1; console.log("1")
    await interactionAttached.setCollateralType(_masterVault, _gemJoin, _ilk, _clip, _mat, {nonce: _nonce}); _nonce += 1; console.log("2")
    await interactionAttached.poke(_masterVault, {nonce: _nonce, gasLimit: 3000000}); _nonce += 1; console.log("3")
    await interactionAttached.drip(_masterVault, {nonce: _nonce, gasLimit: 2000000}); _nonce += 1; console.log("4")
    await interactionAttached.setCollateralDuty(_masterVault, _jug_duty, {nonce: _nonce, gasLimit: 2500000}); _nonce += 1; console.log("5")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});