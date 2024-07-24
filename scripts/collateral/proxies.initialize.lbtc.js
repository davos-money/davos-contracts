let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    let {_underlying, _interaction, _vat, _spot, _dog, _ilk} = require(`./proxies.config.lbtc_${hre.network.name}.json`);
    let { _masterVault, _davosProvider, _dMatic, _clip, _gemJoin} = require(`../addresses_${hre.network.name}_collateral_lbtc.json`);

    // Fetching
    let masterVaultAt = await ethers.getContractAt("MasterVault_V2", _masterVault);
    let davosProviderAt = await ethers.getContractAt("DavosProvider", _davosProvider);
    let dMaticAt = await ethers.getContractAt("dCol", _dMatic);
    let gemJoinAt = await ethers.getContractAt("GemJoin", _gemJoin);
    let clipAt = await ethers.getContractAt("Clipper", _clip);

    // Initialize
    await masterVaultAt.initialize("MasterVault Token", "MVT", 0, _underlying, {nonce: _nonce}); _nonce += 1; console.log("1");
    await davosProviderAt.initialize(_underlying, dMaticAt.address, masterVaultAt.address, _interaction, false, {nonce: _nonce}); _nonce += 1; console.log("2");
    await dMaticAt.initialize({nonce: _nonce}); _nonce += 1; console.log("3");
    await gemJoinAt.initialize(_vat, _ilk, masterVaultAt.address, {nonce: _nonce}); _nonce += 1; console.log("4");
    await clipAt.initialize(_vat, _spot, _dog, _ilk, {nonce: _nonce}); _nonce += 1; console.log("5");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});