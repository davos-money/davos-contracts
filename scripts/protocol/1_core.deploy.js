let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");

//////////////////////
// 3_core.deploy.js //
//////////////////////

let wad = "000000000000000000"; // 18 Decimals

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce
        
    // Config 
    let { _chainId, _multisig} = require(`./config_${hre.network.name}.json`);

    // Fetching
    this.Vat = await hre.ethers.getContractFactory("Vat");
    this.Spot = await hre.ethers.getContractFactory("Spotter");
    this.Davos = await hre.ethers.getContractFactory("Davos");
    this.DavosJoin = await hre.ethers.getContractFactory("DavosJoin");
    this.Jug = await hre.ethers.getContractFactory("Jug");
    this.Vow = await hre.ethers.getContractFactory("Vow");
    this.Dog = await hre.ethers.getContractFactory("Dog");
    this.Abacus = await hre.ethers.getContractFactory("LinearDecrease");

    // Deployment
    console.log("Core...");

    let vat = await upgrades.deployProxy(this.Vat, [], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await vat.deployed();
    vatImp = await upgrades.erc1967.getImplementationAddress(vat.address);
    console.log("Vat             :", vat.address);
    console.log("VatImp          :", vatImp);

    let spot = await upgrades.deployProxy(this.Spot, [vat.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await spot.deployed();
    spotImp = await upgrades.erc1967.getImplementationAddress(spot.address);
    console.log("Spot            :", spot.address);
    console.log("SpotImp         :", spotImp)

    let davos = await upgrades.deployProxy(this.Davos, [_chainId, "DUSD", "5000000" + wad], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await davos.deployed();
    davosImp = await upgrades.erc1967.getImplementationAddress(davos.address);
    console.log("davos           :", davos.address);
    console.log("davosImp        :", davosImp);

    let davosJoin = await upgrades.deployProxy(this.DavosJoin, [vat.address, davos.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await davosJoin.deployed();
    davosJoinImp = await upgrades.erc1967.getImplementationAddress(davosJoin.address);
    console.log("DavosJoin       :", davosJoin.address);
    console.log("DavosJoinImp    :", davosJoinImp)

    let jug = await upgrades.deployProxy(this.Jug, [vat.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await jug.deployed();
    jugImp = await upgrades.erc1967.getImplementationAddress(jug.address);
    console.log("Jug             :", jug.address);
    console.log("JugImp          :", jugImp);

    let vow = await upgrades.deployProxy(this.Vow, [vat.address, davosJoin.address, _multisig], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await vow.deployed();
    vowImp = await upgrades.erc1967.getImplementationAddress(vow.address);
    console.log("Vow             :", vow.address);
    console.log("VowImp          :", vowImp);

    let dog = await upgrades.deployProxy(this.Dog, [vat.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await dog.deployed();
    dogImpl = await upgrades.erc1967.getImplementationAddress(dog.address);
    console.log("Dog             :", dog.address);
    console.log("DogImp          :", dogImpl);

    let abacus = await upgrades.deployProxy(this.Abacus, [], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await abacus.deployed();
    abacusImp = await upgrades.erc1967.getImplementationAddress(abacus.address);
    console.log("Abacus          :", abacus.address);
    console.log("AbacusImp       :", abacusImp);

    // Store Deployed Contracts
    const addresses = {
        _vat            : vat.address,
        _vatImp         : vatImp,
        _spot           : spot.address,
        _spotImp        : spotImp,
        _davos          : davos.address,
        _davosImp       : davosImp,
        _davosJoin      : davosJoin.address,
        _davosJoinImp   : davosJoinImp,
        _jug            : jug.address,
        _jugImp         : jugImp,
        _vow            : vow.address,
        _vowImp         : vowImp,
        _dog            : dog.address,
        _dogImp         : dogImpl,
        _abacus         : abacus.address,
        _abacusImp      : abacusImp,
        _initialNonce   : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/protocol/addresses_${hre.network.name}_1.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/protocol/addresses_${hre.network.name}_1.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});