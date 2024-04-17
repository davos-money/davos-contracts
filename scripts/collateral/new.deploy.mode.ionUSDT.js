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
    let _vat = "0x08ABFd7DEd42CC33900d3457118eAB7fC40b71c8";
    let _spot = "0x8D575d202B7653fb2E076Be451B006626Cc31858"; 
    let _dog = "0xE309C0FE37D3696Cf8c13A629Dc43eAEfC077418";
    let _interaction = "0x7e426F367C40Fc6e1ec919E0a7E51fcb9a564B0F";
    let _underlying = "0x94812F2eEa03A49869f95e1b5868C6f3206ee3D3";
    let _ilk = "0x4d56545f696f6e55534454000000000000000000000000000000000000000000";
    
    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
    this.DMatic = await hre.ethers.getContractFactory("dCol");
    this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
    this.Clip = await hre.ethers.getContractFactory("Clipper");

    // Deployment
    console.log("Deploying...");

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
        _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${network.name}_collateral_ionUSDT.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${network.name}_collateral_ionUSDT.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});