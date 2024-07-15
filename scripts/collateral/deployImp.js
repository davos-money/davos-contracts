let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");
const TUPABI = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

    // Fetching
    this.Imp = await hre.ethers.getContractFactory("DavosProvider");
    
    console.log((await (await this.Imp.deploy()).deployed()).address)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});