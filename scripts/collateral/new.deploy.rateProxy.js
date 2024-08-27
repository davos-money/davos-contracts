let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");



async function main() {

    // Signer
    [deployer] = await ethers.getSigners();

    // Fetching
    this.RateProxy = await hre.ethers.getContractFactory("RateProxy");

    let rp;

    // Deployment
    console.log("Deploying...");
    rp = await this.RateProxy.deploy();
    console.log("RateProxy: " + rp.address);

    // Store Deployed Contracts
    const addresses = {
        _rp    : rp.address
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/collateral/addresses_rateProxy_${hre.network.name}.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/collateral/addresses_rateProxy_${hre.network.name}.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});