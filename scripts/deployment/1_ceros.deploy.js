let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");

///////////////////////
// 1_ceros.deploy.js //
///////////////////////

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce
        
    // External
    let { _aMATICc, _aMATICb, _maticToken, _dex, _dexFactory, _dexPairFee, _polygonPool } = require(`./config_${hre.network.name}.json`);

    // Fetching
    this.CeaMATICc = await hre.ethers.getContractFactory("CeToken");
    this.CeVault = await hre.ethers.getContractFactory("CeVault");
    this.DMatic = await hre.ethers.getContractFactory("dMATIC");
    this.CerosRouter = await hre.ethers.getContractFactory("CerosRouter");
    this.PriceGetter = await hre.ethers.getContractFactory("PriceGetter");

    // Deployment
    console.log("Ceros...");

    let priceGetter = await this.PriceGetter.deploy(_dexFactory, {nonce: _nonce}); _nonce += 1;
    await priceGetter.deployed();
    console.log("PriceGetter     : " + priceGetter.address);

    let ceaMATICc = await upgrades.deployProxy(this.CeaMATICc, ["CEROS aMATICc Vault Token", "ceaMATICc"], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await ceaMATICc.deployed();
    let ceaMATICcImp = await upgrades.erc1967.getImplementationAddress(ceaMATICc.address);
    console.log("ceaMATICc       : " + ceaMATICc.address);
    console.log("imp             : " + ceaMATICcImp);

    let ceVault = await upgrades.deployProxy(this.CeVault, ["CEROS aMATICc Vault", ceaMATICc.address, _aMATICc], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await ceVault.deployed();
    let ceVaultImp = await upgrades.erc1967.getImplementationAddress(ceVault.address);
    console.log("ceVault         : " + ceVault.address);
    console.log("imp             : " + ceVaultImp);

    let dMatic = await upgrades.deployProxy(this.DMatic, [], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await dMatic.deployed();
    let dMaticImp = await upgrades.erc1967.getImplementationAddress(dMatic.address);
    console.log("dMatic          : " + dMatic.address);
    console.log("imp             : " + dMaticImp);

    let cerosRouter = await upgrades.deployProxy(this.CerosRouter, [_aMATICc, _maticToken, _aMATICb, ceVault.address, _dex, _dexPairFee, _polygonPool, priceGetter.address], {initializer: "initialize", gasLimit: 2000000, nonce: _nonce}); _nonce += 1;
    await cerosRouter.deployed();
    let cerosRouterImp = await upgrades.erc1967.getImplementationAddress(cerosRouter.address);
    console.log("cerosRouter     : " + cerosRouter.address);
    console.log("imp             : " + cerosRouterImp);

    // Store
    const addresses = {
        _priceGetter    : priceGetter.address,
        _ceaMATICc      : ceaMATICc.address,
        _ceaMATICcImp   : ceaMATICcImp,
        _ceVault        : ceVault.address,
        _ceVaultImp     : ceVaultImp,
        _dMatic         : dMatic.address,
        _dMaticImp      : dMaticImp,
        _cerosRouter    : cerosRouter.address,
        _cerosRouterImp : cerosRouterImp,
        _initialNonce   : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/deployment/addresses_${network.name}_1.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/deployment/addresses_${network.name}_1.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});