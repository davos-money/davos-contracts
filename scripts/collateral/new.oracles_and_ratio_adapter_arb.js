let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

const vUSDT = require("../addresses_bsc_collateral.json");
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
    this.CTokenOracle = await hre.ethers.getContractFactory("WCUSDCOracle");

    // Deployment
    console.log("Deploying...");

    let oracle = await upgrades.deployProxy(this.VTokenOracle, ["WCUSDCOracle", c._underlying1, vUSDT._masterVault, c._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracle.deployed();
    let oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
    console.log("Oracle    : " + oracle.address);
    console.log("Imp       : " + oracleImp);

    // Store Deployed Contracts
    const addresses = {
        _oracle           : oracle.address,
        _oracleImp        : oracleImp,
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