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
    // let { _masterVault } = require(`../addresses_${hre.network.name}_collateral.json`);
    let _masterVault1 = require(`../addresses_${hre.network.name}_collateral_mUSDC.json`);
    let _masterVault2 = require(`../addresses_${hre.network.name}_collateral_mUSDT.json`);
    let _masterVault3 = require(`../addresses_${hre.network.name}_collateral_ezETH.json`);
    let _masterVault4 = require(`../addresses_${hre.network.name}_collateral_wstETH.json`);
    // let { _wcUSDC } = require(`../addresses_${hre.network.name}_asset.json`);

    // Fetching
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

    this.WstETHOracle = await hre.ethers.getContractFactory("WstETHOracle");
    this.AnkrETHOracle = await hre.ethers.getContractFactory("AnkrETHOracle");
    this.SwETHOracle = await hre.ethers.getContractFactory("SwETHOracle");
    this.WCUSDCOracle = await hre.ethers.getContractFactory("WCUSDCOracle");
    this.OsETHOracle = await hre.ethers.getContractFactory("OsETHOracle");
    this.OETHOracle = await hre.ethers.getContractFactory("OETHOracle");
    this.ETHxOracle = await hre.ethers.getContractFactory("ETHxOracle");
    this.WeETHOracle = await hre.ethers.getContractFactory("WeETHOracle");
    this.EzETHOracle = await hre.ethers.getContractFactory("EzETHOracle");
    this.PriceFeed = await hre.ethers.getContractFactory("PriceFeed");

    this.MUSDOracle = await hre.ethers.getContractFactory("MUSDOracle");

    // Deployment
    console.log("Deploying...");
    let oracle;
    let oracleImp;

    let oracle1, oracle2, oracle3, oracle4;

    if (hre.network.name == "optimism") {
        // oracle = await upgrades.deployProxy(this.WstETHOracle, ["0xb7B9A39CC63f856b90B364911CC324dC46aC1770", _underlying, _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle.deployed();
        // oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        // console.log("WstETHOracle     : " + oracle.address);
        // console.log("Imp              : " + oracleImp);
    } else if (hre.network.name == "arbitrum" || hre.network.name == "arbitrumTestnet") {
        // oracle = await upgrades.deployProxy(this.EzETHOracle, ["0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612", _underlying, _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle.deployed();
        // oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        // console.log("EzETHOracle       : " + oracle.address);
        // console.log("Imp               : " + oracleImp);
    } else if (hre.network.name == "ethereum" || hre.network.name == "ethereumTestnet") {
        // oracle = await upgrades.deployProxy(this.ETHxOracle, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", _underlying, _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle.deployed();
        // oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        // console.log("OETHOracle        : " + oracle.address);
        // console.log("Imp               : " + oracleImp);

    } else if (hre.network.name == "mode" || hre.network.name == "modeTestnet") {
        oracle = await upgrades.deployProxy(this.EzETHOracle, ["0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", "0x2416092f143378750bb29b79eD961ab195CcEea5", _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        console.log("MODEOracle        : " + oracle.address);
        console.log("Imp               : " + oracleImp);

    } else if (hre.network.name == "linea" || hre.network.name == "lineaTestnet") {

        oracle1 = await upgrades.deployProxy(this.MUSDOracle, ["0xAADAa473C1bDF7317ec07c915680Af29DeBfdCb5", "0x333D8b480BDB25eA7Be4Dd87EEB359988CE1b30D", _masterVault1._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle1.deployed();
        console.log("mUSDCOracle        : " + oracle1.address);

        oracle2 = await upgrades.deployProxy(this.MUSDOracle, ["0xefCA2bbe0EdD0E22b2e0d2F8248E99F4bEf4A7dB", "0xf669C3C03D9fdF4339e19214A749E52616300E89", _masterVault2._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle2.deployed();
        console.log("mUSDTOracle        : " + oracle2.address);

        oracle3 = await upgrades.deployProxy(this.EzETHOracle, ["0x3c6Cd9Cc7c7a4c2Cf5a82734CD249D7D593354dA", "0x2416092f143378750bb29b79eD961ab195CcEea5", _masterVault3._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle3.deployed();
        console.log("ezETHOracle        : " + oracle3.address);
        
        // oracle4 = await upgrades.deployProxy(this.WstETHOracle, ["0x3c6Cd9Cc7c7a4c2Cf5a82734CD249D7D593354dA", "0xB5beDd42000b71FddE22D3eE8a79Bd49A568fC8F", _masterVault4._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle4.deployed();
        // console.log("wstETHOracle       : " + oracle4.address);

    } else throw("NOT ALLOWED");

    // Store Deployed Contracts
    const addresses = {
        _oracle1         : oracle1.address,
        _oracle2         : oracle2.address,
        _oracle3         : oracle3.address,
        // _oracle4         : oracle4.address,
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