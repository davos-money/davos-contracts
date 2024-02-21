let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    let { _masterVault, _davosProvider, _dMatic, _clip, _gemJoin } = require(`../addresses_${hre.network.name}_collateral_rseth.json`);
    let { _multisig } = require(`./proxies.config.rseth_${hre.network.name}.json`);

    // Initialize
    console.log("Initializing...");

    let masterVaultAt = await ethers.getContractAt("MasterVault_V2", _masterVault);
    let davosProviderAt = await ethers.getContractAt("DavosProvider", _davosProvider);
    let dMaticAt = await ethers.getContractAt("dCol", _dMatic);
    let gemJoinAt = await ethers.getContractAt("GemJoin", _gemJoin);
    let clipAt = await ethers.getContractAt("Clipper", _clip);

    console.log("Transfering...");
    await masterVaultAt.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    await davosProviderAt.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    await dMaticAt.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    await gemJoinAt.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    await clipAt.rely(_multisig, {nonce: _nonce}); _nonce += 1;
    console.log("Transfer Complete !!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});