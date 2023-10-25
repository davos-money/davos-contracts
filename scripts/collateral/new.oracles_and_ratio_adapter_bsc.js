let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

const vUSDT = require("../addresses_bsc_collateral1.json");
const vUSDC = require("../addresses_bsc_collateral2.json");
const c = require("./config_bsc.json");


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

    // Fetching
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");
    this.WstETHOracle = await hre.ethers.getContractFactory("WstETHOracle");
    this.AnkrETHOracle = await hre.ethers.getContractFactory("AnkrETHOracle");
    this.SwETHOracle = await hre.ethers.getContractFactory("SwETHOracle");
    this.VTokenOracle = await hre.ethers.getContractFactory("VTokenOracle");

    // Deployment
    console.log("Deploying...");

    let oracle1 = await upgrades.deployProxy(this.VTokenOracle, ["0xB97Ad0E74fa7d920791E90258A6E2085088b4320", c._underlying1, vUSDT._masterVault, c._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracle1.deployed();
    let oracleImp1 = await upgrades.erc1967.getImplementationAddress(oracle1.address);
    console.log("Oracle1    : " + oracle1.address);
    console.log("Imp        : " + oracleImp1);

    let oracle2 = await upgrades.deployProxy(this.VTokenOracle, ["0x51597f405303C4377E36123cBc172b13269EA163", c._underlying2, vUSDC._masterVault, c._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracle2.deployed();
    let oracleImp2 = await upgrades.erc1967.getImplementationAddress(oracle2.address);
    console.log("Oracle2    : " + oracle2.address);
    console.log("Imp        : " + oracleImp2);

    // Store Deployed Contracts
    const addresses = {
        _oracle1          : oracle1.address,
        _oracleImp1       : oracleImp1,
        _oracle2          : oracle2.address,
        _oracleImp2       : oracleImp2,
        _initialNonce     : initialNonce
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