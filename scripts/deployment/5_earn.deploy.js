let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");

/////////////////////////////
// 4_interaction.deploy.js //
/////////////////////////////

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Addresses
    let { _davos } = require(`./addresses_${hre.network.name}_3_1.json`);

    let exitDelay = "0"; // 0 Days
    let spread = "604800"; // 7 Days
    let flashLoanDelay = "5"; // 5 Seconds

    // Fetching
    this.Jar = await hre.ethers.getContractFactory("Jar");

    // Deployment
    console.log("Jar...") 

    let jar = await upgrades.deployProxy(this.Jar, ["StakedDavos", "sDAVOS", _davos, spread, exitDelay, flashLoanDelay], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await jar.deployed();
    let jarImplementation = await upgrades.erc1967.getImplementationAddress(jar.address);
    console.log("Deployed: jar        : " + jar.address);
    console.log("Imp                  : " + jarImplementation);

    // Store
    const addresses = {
        _jar             : jar.address,
        _jarImp          : jarImplementation,
        _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/deployment/addresses_${hre.network.name}_5.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/deployment/addresses_${hre.network.name}_5.json`);
}
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});