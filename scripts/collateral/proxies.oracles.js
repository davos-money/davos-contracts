let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    const ezethConfig = require(`./proxies.config.ezeth_${hre.network.name}.json`);
    const rsConfig = require(`./proxies.config.rseth_${hre.network.name}.json`);
    let ezeth = require(`../addresses_${hre.network.name}_collateral_ezeth.json`);
    let rseth = require(`../addresses_${hre.network.name}_collateral_rseth.json`);

    // Fetching
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

    this.EzETHOracle = await hre.ethers.getContractFactory("EzETHOracle");
    this.RsETHOracle = await hre.ethers.getContractFactory("RsETHOracle");

    // Deployment
    console.log("Deploying...");
    let oracleEzeth;
    let oracleRseth;

    oracleEzeth = await upgrades.deployProxy(this.EzETHOracle, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", ezethConfig._underlying, ezeth._masterVault, ezethConfig._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracleEzeth.deployed();
    oracleRseth = await upgrades.deployProxy(this.RsETHOracle, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", rsConfig._underlying, rseth._masterVault, rsConfig._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracleRseth.deployed();

    // Store Deployed Contracts
    const addresses = {
        _oracleEzeth    : oracleEzeth.address,
        _oracleRseth    : oracleRseth.address,
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${hre.network.name}_oracles.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${hre.network.name}_oracles.json`);

    console.log("COMPLETED !");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});