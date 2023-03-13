let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");

/////////////////////////////
// 2_masterVault.deploy.js //
/////////////////////////////

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce
        
    // Config
    let { _maticToken, _maxDepositFee, _maxWithdrawalFee, _maxStrategies, _waitingPoolCap } = require(`./config_${hre.network.name}.json`);

    // Addresses
    let { _cerosRouter } = require(`./addresses_${hre.network.name}_1.json`);
   
    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault");
    this.WaitingPool = await hre.ethers.getContractFactory("WaitingPool");
    this.CerosYieldConverterStrategy = await hre.ethers.getContractFactory("CerosYieldConverterStrategy");

    // Deployment
    console.log("MasterVault...");

    let masterVault = await upgrades.deployProxy(this.MasterVault, [_maticToken, "CEROS MATIC Vault Token", "ceMATIC", _maxDepositFee, _maxWithdrawalFee, _maxStrategies], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await masterVault.deployed();
    masterVaultImp = await upgrades.erc1967.getImplementationAddress(masterVault.address);
    console.log("masterVault     : " + masterVault.address);
    console.log("imp             : " + masterVaultImp);

    let waitingPool = await upgrades.deployProxy(this.WaitingPool, [masterVault.address, _maticToken, _waitingPoolCap], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await waitingPool.deployed();
    waitingPoolImp = await upgrades.erc1967.getImplementationAddress(waitingPool.address);
    console.log("waitingPool     : " + waitingPool.address);
    console.log("imp             : " + waitingPoolImp);

    let cerosYieldConverterStrategy = await upgrades.deployProxy(this.CerosYieldConverterStrategy, [_cerosRouter, deployer.address, _maticToken, masterVault.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await cerosYieldConverterStrategy.deployed();
    cerosYieldConverterStrategyImp = await upgrades.erc1967.getImplementationAddress(cerosYieldConverterStrategy.address);
    console.log("cerosStrategy   : " + cerosYieldConverterStrategy.address);
    console.log("imp             : " + cerosYieldConverterStrategyImp);

    // Store Deployed Contracts
    const addresses = {
        _masterVault    : masterVault.address,
        _masterVaultImp : masterVaultImp,
        _waitingPool    : waitingPool.address,
        _waitingPoolImp : waitingPoolImp,
        _cerosYieldConverterStrategy  : cerosYieldConverterStrategy.address,
        _cerosYieldConverterStrategyImp  : cerosYieldConverterStrategyImp,
        _initialNonce   : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/deployment/addresses_${network.name}_2.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/deployment/addresses_${network.name}_2.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});