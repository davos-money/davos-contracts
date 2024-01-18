let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();

    // Fetching
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");

    // Deployment
    console.log("Deploying...");

    let dp = await this.DavosProvider.deploy();
    await dp.deployed();
    console.log("DavosProvider    : " + dp.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});