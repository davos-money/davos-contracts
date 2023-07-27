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
    // let _ilkCeMatic = ethers.utils.formatBytes32String("ceMATIC");

    // Addresses
    // let { _masterVault } = require(`./addresses_${hre.network.name}_2.json`);

    // Fetching
    this.Vat = await hre.ethers.getContractFactory("Vat");
    this.Spot = await hre.ethers.getContractFactory("Spotter");
    this.Davos = await hre.ethers.getContractFactory("Davos");
    this.DavosJoin = await hre.ethers.getContractFactory("DavosJoin");
    this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
    this.Jug = await hre.ethers.getContractFactory("Jug");
    this.Vow = await hre.ethers.getContractFactory("Vow");
    this.Dog = await hre.ethers.getContractFactory("Dog");
    this.Clip = await hre.ethers.getContractFactory("Clipper");
    this.Abacus = await hre.ethers.getContractFactory("LinearDecrease");

    // this.Oracle = await hre.ethers.getContractFactory("MaticOracle"); // Price Feed
    this.Oracle = await hre.ethers.getContractFactory("Oracle"); // Set Price

    this.DgtRewards = await hre.ethers.getContractFactory("DGTRewards");
    this.DgtToken = await hre.ethers.getContractFactory("DGTToken");
    this.DgtOracle = await hre.ethers.getContractFactory("DGTOracle"); 

    this.AuctionProxy = await hre.ethers.getContractFactory("AuctionProxy");
    const auctionProxy = await this.AuctionProxy.deploy({nonce: _nonce}); _nonce += 1;
    this.Interaction = await hre.ethers.getContractFactory("Interaction", {
        unsafeAllow: ['external-library-linking'],
        libraries: {
            AuctionProxy: auctionProxy.address
        }
    });
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");

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

    // let davos = await upgrades.deployProxy(this.Davos, [_chainId, "DUSD", "5000000" + wad], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await davos.deployed();
    // davosImp = await upgrades.erc1967.getImplementationAddress(davos.address);
    // console.log("davos           :", davos.address);
    // console.log("davosImp        :", davosImp);

    let davosJoin = await upgrades.deployProxy(this.DavosJoin, [vat.address, "0xB155f3E06AA210A33EAFB76087A8b58C388286B8"], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await davosJoin.deployed();
    davosJoinImp = await upgrades.erc1967.getImplementationAddress(davosJoin.address);
    console.log("DavosJoin       :", davosJoin.address);
    console.log("DavosJoinImp    :", davosJoinImp)

    // let gemJoin = await upgrades.deployProxy(this.GemJoin, [vat.address, _ilkCeMatic, _masterVault], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await gemJoin.deployed();
    // gemJoinImp = await upgrades.erc1967.getImplementationAddress(gemJoin.address);
    // console.log("GemJoin         :", gemJoin.address);
    // console.log("GemJoinImp      :", gemJoinImp);

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

    // let clip = await upgrades.deployProxy(this.Clip, [vat.address, spot.address, dog.address, _ilkCeMatic], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await clip.deployed();
    // clipImp = await upgrades.erc1967.getImplementationAddress(clip.address);
    // console.log("Clip            :", clip.address);
    // console.log("ClipImp         :", clipImp);

    let abacus = await upgrades.deployProxy(this.Abacus, [], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await abacus.deployed();
    abacusImp = await upgrades.erc1967.getImplementationAddress(abacus.address);
    console.log("Abacus          :", abacus.address);
    console.log("AbacusImp       :", abacusImp);

    // if (hre.network.name == "ethereum") {
    //     aggregatorAddress = "0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676";
    // }
    // let oracle = await upgrades.deployProxy(this.Oracle, [aggregatorAddress], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await oracle.deployed();
    // let oracleImplementation = await upgrades.erc1967.getImplementationAddress(oracle.address);
    // console.log("Deployed: oracle: " + oracle.address);
    // console.log("Imp             : " + oracleImplementation);

    // let oracle = await this.Oracle.deploy({nonce: _nonce}); _nonce += 1;
    // await oracle.deployed();
    // console.log("Deployed: oracle: " + oracle.address);

    // Store Deployed Contracts
    const addresses = {
        _vat            : vat.address,
        _vatImp         : vatImp,
        _spot           : spot.address,
        _spotImp        : spotImp,
        _davos          : "0xB155f3E06AA210A33EAFB76087A8b58C388286B8",
        _davosImp       : davosImp,
        _davosJoin      : davosJoin.address,
        _davosJoinImp   : davosJoinImp,
        // _gemJoin        : gemJoin.address,
        // _gemJoinImp     : gemJoinImp,
        _jug            : jug.address,
        _jugImp         : jugImp,
        _vow            : vow.address,
        _vowImp         : vowImp,
        _dog            : dog.address,
        _dogImp         : dogImpl,
        // _clip           : clip.address,
        // _clipImp        : clipImp,
        _abacus         : abacus.address,
        _abacusImp      : abacusImp,
        // _oracle         : oracle.address,
        // _oracleImp      : oracleImplementation,
        // _ilk            : _ilkCeMatic,
        _initialNonce   : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/deployment/addresses_${hre.network.name}_3.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/deployment/addresses_${hre.network.name}_3.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});