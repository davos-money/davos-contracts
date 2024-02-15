let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    const weethConfig = require(`./proxies.config.weeth_${hre.network.name}.json`);
    const pufConfig = require(`./proxies.config.pufeth_${hre.network.name}.json`);
    let weeth = require(`../addresses_${hre.network.name}_collateral_weeth.json`);
    let pufeth = require(`../addresses_${hre.network.name}_collateral_pufeth.json`);

    // Fetching
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

    this.WeETHOracle = await hre.ethers.getContractFactory("WeETHOracle");
    this.PufETHOracle = await hre.ethers.getContractFactory("PufETHOracle");

    // Deployment
    console.log("Deploying...");
    let oracleWeeth;
    let oraclePufeth;

    oracleWeeth = await upgrades.deployProxy(this.WeETHOracle, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", weethConfig._underlying, weeth._masterVault, weethConfig._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracleWeeth.deployed();
    oraclePufeth = await upgrades.deployProxy(this.PufETHOracle, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", pufConfig._underlying, pufeth._masterVault, pufConfig._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oraclePufeth.deployed();

    // Store Deployed Contracts
    const addresses = {
        _oracleWeeth     : oracleWeeth.address,
        _oraclePufeth    : oraclePufeth.address,
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