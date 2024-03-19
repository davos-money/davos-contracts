let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();

    // Fetching
    this.WcUSDC = await hre.ethers.getContractFactory("WcUSDCv3_2");
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2_R");

    // Deployment
    console.log("Deploying...");

    if (hre.network.name == "arbitrum" || hre.network.name == "arbitrumTestnet") {
        console.log("ARBITRUM");
        let c = await this.WcUSDC.deploy();
        await c.deployed();
        console.log(c.address);
    } else if (hre.network.name == "bsc" || hre.network.name == "bscTestnet") { 
        console.log("BSC");
        let c = await this.MasterVault.deploy();
        await c.deployed();
        console.log(c.address);
    } else throw("ERR:> Network Unsupported !");

    console.log("DONE !!")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});