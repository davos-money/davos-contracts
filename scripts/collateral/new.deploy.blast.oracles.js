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
    let { _ratioAdapter } = require(`./addresses_${hre.network.name}.json`);

    // Fetching
    this.NrTokenOracle = await hre.ethers.getContractFactory("NrTokenOracle");

    // Deployment
    console.log("Deploying...");
    let oracleETH, oracleUSDB;

    let nrETH = require(`../addresses_${hre.network.name}_collateral1.json`);
    let nrUSDB = require(`../addresses_${hre.network.name}_collateral2.json`);

    oracleETH = await upgrades.deployProxy(this.NrTokenOracle, ["0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", "0x9D020B1697035d9d54f115194c9e04a1e4Eb9aF7", nrETH._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracleETH.deployed();
    console.log("ETHOracle        : " + oracleETH.address);

    oracleUSDB = await upgrades.deployProxy(this.NrTokenOracle, ["0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", "0x41283d3f78ccb459a24e5f1f1b9f5a72a415a26ff9ce0391a6878f4cda6b477b", "0x96F6b70f8786646E0FF55813621eF4c03823139C", nrUSDB._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracleUSDB.deployed();
    console.log("USDBOracle        : " + oracleUSDB.address);


    // Store Deployed Contracts
    const addresses = {
        _oracleETH       : oracleETH.address,
        _oracleUSDB      : oracleUSDB.address,
        _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${hre.network.name}_oracle_nr.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${hre.network.name}_oracle_nr.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});