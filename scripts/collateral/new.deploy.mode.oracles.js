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
    let _ratioAdapter = "0x046B71694B3b659F491247167EDa42E0556123cf";

    // Fetching
    this.IonUSDOracle = await hre.ethers.getContractFactory("IonUSDOracle");

    // Deployment
    console.log("Deploying...");
    let oracleUSDC, oracleUSDT;

    let ionUSDC = require(`../addresses_${hre.network.name}_collateral_ionUSDC.json`);
    let ionUSDT = require(`../addresses_${hre.network.name}_collateral_ionUSDT.json`);

    oracleUSDC = await upgrades.deployProxy(this.IonUSDOracle, ["0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a", "0x2BE717340023C9e14C1Bb12cb3ecBcfd3c3fB038", ionUSDC._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracleUSDC.deployed();
    console.log("ionUSDCOracle        : " + oracleUSDC.address);

    oracleUSDT = await upgrades.deployProxy(this.IonUSDOracle, ["0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b", "0x94812F2eEa03A49869f95e1b5868C6f3206ee3D3", ionUSDT._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracleUSDT.deployed();
    console.log("ionUSDTOracle        : " + oracleUSDT.address);


    // Store Deployed Contracts
    const addresses = {
        _oracleUSDC      : oracleUSDC.address,
        _oracleUSDT      : oracleUSDT.address,
        _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${hre.network.name}_oracle_ion.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${hre.network.name}_oracle_ion.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});