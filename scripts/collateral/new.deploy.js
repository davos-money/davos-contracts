let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000", // 45 Decimals
    ONE = 10 ** 27;

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();

    // Config
    let { _underlying, _interaction, _vat, _spot, _dog, _ilk} = require(`./config_${hre.network.name}.json`);
    
    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
    this.DMatic = await hre.ethers.getContractFactory("dCOL");
    this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
    this.Clip = await hre.ethers.getContractFactory("Clipper");
    // this.WstETHOracle = await hre.ethers.getContractFactory("WstETHOracle");

    // Deployment
    console.log("Deploying...");

    let masterVault = await upgrades.deployProxy(this.MasterVault, ["MasterVault Token", "MVT", 0, _underlying], {initializer: "initialize"});
    await masterVault.deployed();
    let masterVaultImp = await upgrades.erc1967.getImplementationAddress(masterVault.address);
    console.log("MasterVault      : " + masterVault.address);
    console.log("Imp              : " + masterVaultImp);

    let dMatic = await upgrades.deployProxy(this.DMatic, [], {initializer: "initialize"});
    await dMatic.deployed();
    let dMaticImp = await upgrades.erc1967.getImplementationAddress(dMatic.address);
    console.log("dMatic           : " + dMatic.address);
    console.log("imp              : " + dMaticImp);

    let davosProvider = await upgrades.deployProxy(this.DavosProvider, [_underlying, dMatic.address, masterVault.address, _interaction, false], {initializer: "initialize"});
    await davosProvider.deployed();
    let davosProviderImp = await upgrades.erc1967.getImplementationAddress(davosProvider.address);
    console.log("DavosProvider    : " + davosProvider.address);
    console.log("imp              : " + davosProviderImp);

    let gemJoin = await upgrades.deployProxy(this.GemJoin, [_vat, _ilk, masterVault.address], {initializer: "initialize"});
    await gemJoin.deployed();
    gemJoinImp = await upgrades.erc1967.getImplementationAddress(gemJoin.address);
    console.log("GemJoin          :", gemJoin.address);
    console.log("Imp              :", gemJoinImp);

    let clip = await upgrades.deployProxy(this.Clip, [_vat, _spot, _dog, _ilk], {initializer: "initialize"});
    await clip.deployed();
    clipImp = await upgrades.erc1967.getImplementationAddress(clip.address);
    console.log("Clip             :", clip.address);
    console.log("Imp              :", clipImp);

    // let oracle = await this.WstETHOracle.deploy();
    // await oracle.deployed();
    // console.log("Oracle           :", oracle.address);

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
        // _oracle          : oracle.address
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/collateral/addresses_${network.name}.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/collateral/addresses_${network.name}.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});