let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    let { _interaction, _vat, _spot, _dog, _ilk} = require(`./config_${hre.network.name}.json`);
    // let {  _wcUSDC} = require(`../addresses_${hre.network.name}_asset.json`);

    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
    this.DMatic = await hre.ethers.getContractFactory("dCol");
    this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
    this.Clip = await hre.ethers.getContractFactory("Clipper");
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");
    this.WAToken = await hre.ethers.getContractFactory("WAToken")
    this.Oracle = await hre.ethers.getContractFactory("WWBTCOracle");

    // Deployment
    console.log("Deploying...");

    let ra = await upgrades.deployProxy(this.RatioAdapter, [], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await ra.deployed();
    let raImp = await upgrades.erc1967.getImplementationAddress(ra.address);
    console.log("Ra               :", ra.address);
    console.log("Imp              :", raImp);

    let watoken = await upgrades.deployProxy(this.WAToken, ["Wrapped Avalon wBTC", "waBitBTC", "0x79A34146f05D5a0314E32CfDb9310Bf2b3294b32"], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await watoken.deployed();
    let watokenImp = await upgrades.erc1967.getImplementationAddress(watoken.address);
    console.log("WAToken          :", watoken.address);
    console.log("Imp              :", watokenImp);

    let _underlying = watoken.address;

    let masterVault = await upgrades.deployProxy(this.MasterVault, ["MasterVault Token", "MVT", 0, _underlying], {initializer: "initialize", nonce: _nonce}); _nonce += 1
    await masterVault.deployed();
    let masterVaultImp = await upgrades.erc1967.getImplementationAddress(masterVault.address);
    console.log("MasterVault      : " + masterVault.address);
    console.log("Imp              : " + masterVaultImp);

    let dMatic = await upgrades.deployProxy(this.DMatic, [], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await dMatic.deployed();
    let dMaticImp = await upgrades.erc1967.getImplementationAddress(dMatic.address);
    console.log("dMatic           : " + dMatic.address);
    console.log("imp              : " + dMaticImp);

    let davosProvider = await upgrades.deployProxy(this.DavosProvider, [_underlying, dMatic.address, masterVault.address, _interaction, false], {initializer: "initialize", nonce: _nonce}); _nonce += 1
    await davosProvider.deployed();
    let davosProviderImp = await upgrades.erc1967.getImplementationAddress(davosProvider.address);
    console.log("DavosProvider    : " + davosProvider.address);
    console.log("imp              : " + davosProviderImp);

    let gemJoin = await upgrades.deployProxy(this.GemJoin, [_vat, _ilk, masterVault.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await gemJoin.deployed();
    let gemJoinImp = await upgrades.erc1967.getImplementationAddress(gemJoin.address);
    console.log("GemJoin          :", gemJoin.address);
    console.log("Imp              :", gemJoinImp);

    let clip = await upgrades.deployProxy(this.Clip, [_vat, _spot, _dog, _ilk], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await clip.deployed();
    let clipImp = await upgrades.erc1967.getImplementationAddress(clip.address);
    console.log("Clip             :", clip.address);
    console.log("Imp              :", clipImp);

    let oracle = await upgrades.deployProxy(this.Oracle, ["0x73AB44615772a0d31dB48A87d7F4F81a3601BceB", _underlying, masterVault.address, ra.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await oracle.deployed();
    let oracleImp = await upgrades.erc1967.getImplementationAddress(oracle.address);
    console.log("Oracle           : " + oracle.address);
    console.log("Imp              : " + oracleImp);

    // Store Deployed Contracts
    const addresses = {
        _masterVault     : masterVault.address,
        _masterVaultImp  : masterVaultImp,
        _dMatic          : dMatic.address,
        _dMaticImp       : dMaticImp,
        _davosProvider   : davosProvider.address,
        _davosProviderImp: davosProviderImp,
        _gemJoin         : gemJoin.address,
        _gemJoinImp      : gemJoinImp,
        _clip            : clip.address,
        _clipImp         : clipImp,
        _ra              : ra.address,
        _watoken         : watoken.address,
        _oracle          : oracle.address,
        _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${network.name}_collateral.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${network.name}_collateral.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});