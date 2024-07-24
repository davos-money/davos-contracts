let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");

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
    // const ezethConfig = require(`./proxies.config.ezeth_${hre.network.name}.json`);
    // const rsConfig = require(`./proxies.config.rseth_${hre.network.name}.json`);
    const lbtcConfig = require(`./proxies.config.lbtc_${hre.network.name}.json`);
    // let ezeth = require(`../addresses_${hre.network.name}_collateral_ezeth.json`);
    // let rseth = require(`../addresses_${hre.network.name}_collateral_rseth.json`);
    let lbtc = require(`../addresses_${hre.network.name}_collateral_lbtc.json`);
    let { _multisig } = require(`./proxies.config.lbtc_${hre.network.name}.json`);

    // Fetching
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

    // this.EzETHOracle = await hre.ethers.getContractFactory("EzETHOracle");
    // this.RsETHOracle = await hre.ethers.getContractFactory("RsETHOracle");
    this.LBTCOracle = await hre.ethers.getContractFactory("LBTCOracle");

    // Deployment
    console.log("Deploying...");
    // let oracleEzeth;
    // let oracleRseth;
    let oracleLbtc;

    // oracleEzeth = await upgrades.deployProxy(this.EzETHOracle, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", ezethConfig._underlying, ezeth._masterVault, ezethConfig._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await oracleEzeth.deployed();
    // oracleRseth = await upgrades.deployProxy(this.RsETHOracle, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", rsConfig._underlying, rseth._masterVault, rsConfig._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await oracleRseth.deployed();
    oracleLbtc = await upgrades.deployProxy(this.LBTCOracle, ["0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c", lbtcConfig._underlying, lbtc._masterVault, lbtcConfig._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracleLbtc.deployed();
    console.log("ORACLE:" + oracleLbtc.address);

    // Store Deployed Contracts
    const addresses = {
        // _oracleEzeth    : oracleEzeth.address,
        // _oracleRseth    : oracleRseth.address,
        _oracleLbtc     : oracleLbtc.address
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${hre.network.name}_oracles.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${hre.network.name}_oracles.json`);

    console.log("=== Try proxyAdmin transfer...");
    const proxyAdminAddress = parseAddress(await ethers.provider.getStorageAt(oracleLbtc.address, admin_slot));

    let PROXY_ADMIN_ABI = ["function owner() public view returns (address)"];
    let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);

    let owner = await proxyAdmin.owner();
    console.log("Owner: ", owner);
    console.log("Multi: ", _multisig);

    if (owner != ethers.constants.AddressZero && owner != _multisig) {
        PROXY_ADMIN_ABI = ["function transferOwnership(address newOwner) public"];
        let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);
        await proxyAdmin.transferOwnership(_multisig);
        console.log("proxyAdmin transferred");
    } else {
        console.log("Already owner of proxyAdmin")
    }

    console.log("COMPLETED !");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});