let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

const admin_slot = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
const PROXY_ADMIN_ABI = ["function upgrade(address proxy, address implementation) public"]

function parseAddress(addressString){
    const buf = Buffer.from(addressString.replace(/^0x/, ''), 'hex');
    if (!buf.slice(0, 12).equals(Buffer.alloc(12, 0))) {
        return undefined;
    }
    const address = '0x' + buf.toString('hex', 12, 32); // grab the last 20 bytes
    return ethers.utils.getAddress(address);
}

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    let { _underlying, _ratioAdapter } = require(`./config_${hre.network.name}.json`);
    let { _masterVault } = require(`../addresses_${hre.network.name}_collateral.json`);
    let { _wcUSDC } = require(`../addresses_${hre.network.name}_asset.json`);

    // Fetching
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

    this.WstETHOracle = await hre.ethers.getContractFactory("WstETHOracle");
    this.AnkrETHOracle = await hre.ethers.getContractFactory("AnkrETHOracle");
    this.SwETHOracle = await hre.ethers.getContractFactory("SwETHOracle");
    this.WCUSDCOracle = await hre.ethers.getContractFactory("WCUSDCOracle");

    // Deployment
    console.log("Deploying...");
    let oracle;
    let oracleImp;

    if (hre.network.name == "optimism") {
        oracle = await upgrades.deployProxy(this.WstETHOracle, ["0xb7B9A39CC63f856b90B364911CC324dC46aC1770", _underlying, _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        console.log("WstETHOracle     : " + oracle.address);
        console.log("Imp              : " + oracleImp);
    } else if (hre.network.name == "arbitrum" || hre.network.name == "arbitrumTestnet") {
        oracle = await upgrades.deployProxy(this.WCUSDCOracle, ["0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3", _wcUSDC, _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        console.log("WCUSDCOracle      : " + oracle.address);
        console.log("Imp               : " + oracleImp);
    } else if (hre.network.name == "ethereum") {
        oracle = await upgrades.deployProxy(this.SwETHOracle, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", _underlying, _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        console.log("SwETHOracle     : " + oracle.address);
        console.log("Imp               : " + oracleImp);

    } else throw("NOT ALLOWED");

    // Store Deployed Contracts
    const addresses = {
        _oracle          : oracle.address,
        _oracleImp       : oracleImp,
        _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${hre.network.name}_oracle.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${hre.network.name}_oracle.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});