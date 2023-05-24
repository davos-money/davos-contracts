let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");

///////////////////////
// 1_ceros.deploy.js //
///////////////////////

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce
        
    // Fetching
    this.Davos = await hre.ethers.getContractFactory("Davos");

    // Deploy
    let davos = await this.Davos.deploy({nonce: _nonce});
    await davos.deployed();
    console.log("Davos: " + davos.address)

    // Store
    const addresses = {
        davos : davos.address,
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/deployment/addresses_${network.name}_1.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/deployment/addresses_${network.name}_1.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});