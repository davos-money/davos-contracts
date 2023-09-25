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
    // let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    // let _nonce = initialNonce

    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");
    this.RethOracle = await hre.ethers.getContractFactory("RethOracle");
    this.WstETHOracle = await hre.ethers.getContractFactory("WstETHOracle");
    this.AnkrETHOracle = await hre.ethers.getContractFactory("AnkrETHOracle");

    let { _spot } = require(`../protocol/addresses_${hre.network.name}_1.json`);
    let { _masterVaultR } = require(`./addressesRETH_${hre.network.name}.json`);
    let { _masterVaultW } = require(`./addressesWSTETH_${hre.network.name}.json`);
    let { _masterVaultA } = require(`./addressesANKRETH_${hre.network.name}.json`);

    let masterVaultRETH = await this.MasterVault.attach(_masterVaultR);
    let masterVaultWSTETH = await this.MasterVault.attach(_masterVaultW);
    let masterVaultANKRETH = await this.MasterVault.attach(_masterVaultA);

    let ethusd = "0x26690F9f17FdC26D419371315bc17950a0FC90eD";
    let retheth = "0x60b39BEC6AF8206d1E6E8DFC63ceA214A506D6c3";

    // Deployment
    console.log("Deploying...");

    let ratioAdapter = await upgrades.deployProxy(this.RatioAdapter, [], {initializer: "initialize"}); 
    await ratioAdapter.deployed();
    let ratioAdapterImp = await upgrades.erc1967.getImplementationAddress(ratioAdapter.address);
    console.log("RatioAdapter      : " + ratioAdapter.address);
    console.log("Imp              : " + ratioAdapterImp);

    let rethOracleArgs = [retheth, ethusd, _masterVaultR];
    let rethOracle = await upgrades.deployProxy(this.RethOracle, rethOracleArgs, {initializer: "initialize"});
    await rethOracle.deployed();
    let rethOracleImp = await upgrades.erc1967.getImplementationAddress(rethOracle.address);
    console.log("RethOracle      : " + rethOracle.address);
    console.log("Imp             : " + rethOracleImp);

    let wstEthOracle = await upgrades.deployProxy(this.WstETHOracle, [ethusd, "0x5D8cfF95D7A57c0BF50B30b43c7CC0D52825D4a9", _masterVaultW, ratioAdapter.address], {initializer: "initialize"}); 
    await wstEthOracle.deployed();
    let wstEthOracleImp = await upgrades.erc1967.getImplementationAddress(wstEthOracle.address);
    console.log("WstETHOracle     : " + wstEthOracle.address);
    console.log("Imp              : " + wstEthOracleImp);

    let ankrEthOracle = await upgrades.deployProxy(this.AnkrETHOracle, [ethusd, "0x12D8CE035c5DE3Ce39B1fDD4C1d5a745EAbA3b8C", _masterVaultA, ratioAdapter.address], {initializer: "initialize"});
    await ankrEthOracle.deployed();
    let ankrEthOracleImp = await upgrades.erc1967.getImplementationAddress(wstEthOracle.address);
    console.log("WstETHOracle     : " + ankrEthOracle.address);
    console.log("Imp              : " + ankrEthOracleImp);

    console.log("Setup contracts...");
    await ratioAdapter.setToken("0xb23C20EFcE6e24Acca0Cef9B7B7aA196b84EC942", '', '', 'getRate()', true); console.log("*"); // reth
    await ratioAdapter.setToken("0x5D8cfF95D7A57c0BF50B30b43c7CC0D52825D4a9", '', '', 'getRate()', true); console.log("*");// wsteth
    await ratioAdapter.setToken("0x12D8CE035c5DE3Ce39B1fDD4C1d5a745EAbA3b8C", '', '', 'ratio()', true); console.log("*");// ankreth

    console.log("Set masterVault's provider...");
    await masterVaultRETH.changeAdapter(ratioAdapter.address); console.log("*");
    await masterVaultWSTETH.changeAdapter(ratioAdapter.address); console.log("*");
    await masterVaultANKRETH.changeAdapter(ratioAdapter.address); console.log("*");

    console.log("File Oracle in Spotter...");
    let spot = await ethers.getContractAt("Spotter", _spot);
    await spot["file(bytes32,bytes32,address)"]("0x4d56545f72455448000000000000000000000000000000000000000000000000", ethers.utils.formatBytes32String("pip"), rethOracle.address); console.log("*");
    await spot["file(bytes32,bytes32,address)"]("0x4d56545f77737445544800000000000000000000000000000000000000000000", ethers.utils.formatBytes32String("pip"), wstEthOracle.address); console.log("*");
    await spot["file(bytes32,bytes32,address)"]("0x4d56545f616e6b72455448000000000000000000000000000000000000000000", ethers.utils.formatBytes32String("pip"), ankrEthOracle.address);  console.log("*");

    // await ratioAdapter.setToken("0xA63FDf4e5a748C980713Ec3e1Cfe2d0B1E037725", 'getRethValue(uint256)', 'getEthValue(uint256)', "", false);
    // await ratioAdapter.setToken("0xcE8B13C2d43121681724D17829FC8358d6a7971A", 'getStETHByWstETH(uint256)', 'getWstETHByStETH(uint256)', '', false);

    // Store Deployed Contracts
    const addresses = {
        _ratioAdapter    : ratioAdapter.address,
        _ratioAdapterImp : ratioAdapterImp,
        _rethOracle      : rethOracle.address,
        _rethOracleImp   : rethOracleImp,
        _wstEthOracle    : wstEthOracle.address,
        _wstEthOracleImp : wstEthOracleImp,
        _ankrEthOracle   : ankrEthOracle.address,
        _ankrEthOracleImp: ankrEthOracleImp
        // _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/collateral/addressesOralces_${hre.network.name}.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/collateral/addressesOralces_${hre.network.name}.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});