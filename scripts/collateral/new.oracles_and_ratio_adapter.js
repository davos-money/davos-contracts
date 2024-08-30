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
    let { _ratioAdapter } = require(`./config_${hre.network.name}.json`);
    // let _ratioAdapter1 = require(`./addresses_${hre.network.name}.json`);
    let { _masterVault } = require(`../addresses_${hre.network.name}_collateral.json`);
    // let _masterVault1 = require(`../addresses_${hre.network.name}_collateral.json`);
    // let _masterVault2 = require(`../addresses_${hre.network.name}_collateral_mUSDT.json`);
    // let _masterVault3 = require(`../addresses_${hre.network.name}_collateral_ezETH.json`);
    // let _masterVault4 = require(`../addresses_${hre.network.name}_collateral_wstETH.json`);
    // let { _wcUSDC } = require(`../addresses_${hre.network.name}_asset.json`);

    // Fetching
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

    this.WstETHOracle = await hre.ethers.getContractFactory("WstETHOracle");
    this.AnkrETHOracle = await hre.ethers.getContractFactory("AnkrETHOracle");
    this.SwETHOracle = await hre.ethers.getContractFactory("SwETHOracle");
    this.WCUSDCOracle = await hre.ethers.getContractFactory("WCUSDCOracle");
    this.OsETHOracle = await hre.ethers.getContractFactory("OsETHOracle");
    this.OETHOracle = await hre.ethers.getContractFactory("WoETHOracle");
    this.ETHxOracle = await hre.ethers.getContractFactory("ETHxOracle");
    this.WeETHOracle = await hre.ethers.getContractFactory("WeETHOracle");
    this.EzETHOracle = await hre.ethers.getContractFactory("EzETHOracle");
    this.PriceFeed = await hre.ethers.getContractFactory("PriceFeed");

    this.TimeLock = await hre.ethers.getContractFactory("TimeLock");

    this.MUSDOracle = await hre.ethers.getContractFactory("MUSDOracle");

    this.USDPlusOracle = await hre.ethers.getContractFactory("USDPlusOracle");

    this.STONEOracle = await hre.ethers.getContractFactory("STONEOracle");
    this.StCOREORACLE = await hre.ethers.getContractFactory("StCOREOracle");

    // Deployment
    console.log("Deploying...");
    let oracle, timelock;
    let oracleImp;
    let rp;

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
        // oracle = await upgrades.deployProxy(this.OETHOracle, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", "0xDcEe70654261AF21C44c093C300eD3Bb97b78192", "0x7E6173fE3b426755B4B961c6a7686c13E3c82883", "0xd199260f2152fc65E35aC4950CC6a2D3D5f5412E"], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle.deployed();
        // oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        // console.log("OETHOracle        : " + oracle.address);
        // console.log("Imp               : " + oracleImp);
        oracle = await ethers.getContractAt(["function changeProxyAdmin(address,address) external"], "0x2770cB901e6d990B4F5C35E0732821eBf9d3acb7");
        await oracle.changeProxyAdmin("0x8428F7C1Dd8Ee21e11924A7D71221641d3f2c3fA", "0x2B42585E7930FaB52696f7b853e6097B1Df7ED4E");

    } else if (hre.network.name == "mode" || hre.network.name == "modeTestnet") {
        
        oracle = await upgrades.deployProxy(this.WeETHOracle, ["0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", "0x04c0599ae5a44757c0af6f9ec3b93da8976c150a", _masterVault1._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        console.log("MODEOracle        : " + oracle.address);
        console.log("Imp               : " + oracleImp);




        // oracle = await upgrades.deployProxy(this.EzETHOracle, ["0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", "0x2416092f143378750bb29b79eD961ab195CcEea5", _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle.deployed();
        // oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        // console.log("MODEOracle        : " + oracle.address);
        // console.log("Imp               : " + oracleImp);

    } else if (hre.network.name == "linea" || hre.network.name == "lineaTestnet") {

        // oracle = await this.TimeLock.deploy(7200, ["0x910a845C872a6Af873D1DEc1f0Cce03034c94893"], ["0x8F0E864AE6aD45d973BD5B3159D5a7079A83B774"], {nonce: _nonce}); _nonce += 1;
        // await oracle.deployed();
        // console.log("TimeLock        : " + oracle.address);
        // throw new Error("This is not an error. Execution FINISHED!");

        let rpF = await ethers.getContractFactory("RateProxy");
        rp = await rpF.deploy({nonce: _nonce}); _nonce += 1;
        await rp.deployed();
        console.log("RateProxy          : " + rp.address);

        oracle = await upgrades.deployProxy(this.STONEOracle, ["0x3c6Cd9Cc7c7a4c2Cf5a82734CD249D7D593354dA", "0x93F4d0ab6a8B4271f4a28Db399b5E30612D21116", _masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        console.log("LineaOracle        : " + oracle.address);

        // oracle1 = await upgrades.deployProxy(this.WeETHOracle, ["0x3c6Cd9Cc7c7a4c2Cf5a82734CD249D7D593354dA", "0x1Bf74C010E6320bab11e2e5A532b5AC15e0b8aA6", _masterVault1._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle1.deployed();
        // console.log("LineaOracle        : " + oracle1.address);

        // oracle1 = await upgrades.deployProxy(this.MUSDOracle, ["0xAADAa473C1bDF7317ec07c915680Af29DeBfdCb5", "0x333D8b480BDB25eA7Be4Dd87EEB359988CE1b30D", _masterVault1._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle1.deployed();
        // console.log("mUSDCOracle        : " + oracle1.address);

        // oracle2 = await upgrades.deployProxy(this.MUSDOracle, ["0xefCA2bbe0EdD0E22b2e0d2F8248E99F4bEf4A7dB", "0xf669C3C03D9fdF4339e19214A749E52616300E89", _masterVault2._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle2.deployed();
        // console.log("mUSDTOracle        : " + oracle2.address);

        // oracle3 = await upgrades.deployProxy(this.EzETHOracle, ["0x3c6Cd9Cc7c7a4c2Cf5a82734CD249D7D593354dA", "0x2416092f143378750bb29b79eD961ab195CcEea5", _masterVault3._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle3.deployed();
        // console.log("ezETHOracle        : " + oracle3.address);
        
        // oracle4 = await upgrades.deployProxy(this.WstETHOracle, ["0x3c6Cd9Cc7c7a4c2Cf5a82734CD249D7D593354dA", "0xB5beDd42000b71FddE22D3eE8a79Bd49A568fC8F", _masterVault4._masterVault, _ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        // await oracle4.deployed();
        // console.log("wstETHOracle       : " + oracle4.address);

    } else if (hre.network.name == "base" || hre.network.name == "baseTestnet") {
        oracle = await upgrades.deployProxy(this.USDPlusOracle, ["0x7e860098F58bBFC8648a4311b374B1D669a2bc6B", "0xd95ca61CE9aAF2143E81Ef5462C0c2325172E028", _masterVault1._masterVault, _ratioAdapter1._ratioAdapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        console.log("BASEOracle        : " + oracle.address);
        console.log("Imp               : " + oracleImp);

    } else if (hre.network.name == "scroll" || hre.network.name == "scrollTestnet") {
        oracle = await upgrades.deployProxy(this.WeETHOracle, ["0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", "0x01f0a31698C4d065659b9bdC21B3610292a1c506", _masterVault, "0xCdF972e0EC2aAe2cDbCaafb2D9d890990d7EB64F"], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        console.log("BASEOracle        : " + oracle.address);
        console.log("Imp               : " + oracleImp);

    } else if (hre.network.name == "coreDao" || hre.network.name == "coreDaoTestnet") {
        oracle = await upgrades.deployProxy(this.StCOREORACLE, ["0xDa4A02ADB8AA8495541238429536Fdcb0AB83654", _masterVault], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
        await oracle.deployed();
        oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
        console.log("Oracle        : " + oracle.address);
        console.log("Imp               : " + oracleImp);

    } else throw("NOT ALLOWED");

    // // Store Deployed Contracts
    // const addresses = {
    //     _oracle1         : oracle.address,
    //     // _rateProxy       : rp.address,
    //     // _oracle2         : oracle2.address,
    //     // _oracle3         : oracle3.address,
    //     // _oracle4         : oracle4.address,
    //     _initialNonce    : initialNonce
    // }

    // const json_addresses = JSON.stringify(addresses);
    // fs.writeFileSync(`./scripts/addresses_${hre.network.name}_oracle.json`, json_addresses);
    // console.log("Addresses Recorded to: " + `./scripts/addresses_${hre.network.name}_oracle.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});