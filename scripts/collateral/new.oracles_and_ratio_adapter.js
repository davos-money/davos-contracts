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
    
    // Fetching
    // this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

    this.StEUROracle = await hre.ethers.getContractFactory("StEUROracle");
    this.SDAIOracle = await hre.ethers.getContractFactory("SDAIOracle");

    // Deployment
    console.log("Deploying...");
    let oracle;
    let oracleImp;

    if (hre.network.name == "ethereum") {
        oracle = await upgrades.deployProxy(this.SDAIOracle, ["0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9", _underlying, _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        console.log("sDAIOracle       : " + oracle.address);
        console.log("Imp              : " + oracleImp);
    } else if (hre.network.name == "arbitrum") {
        oracle = await upgrades.deployProxy(this.StEUROracle, ["0xA14d53bC1F1c0F31B4aA3BD109344E5009051a84", _underlying, _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        console.log("stEUROracle       : " + oracle.address);
        console.log("Imp               : " + oracleImp);
    // } else if (hre.network.name == "ethereum") {
    //     oracle = await upgrades.deployProxy(this.SwETHOracle, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", _underlying, _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    //     await oracle.deployed();
    //     oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
    //     console.log("SwETHOracle     : " + oracle.address);
    //     console.log("Imp               : " + oracleImp);

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