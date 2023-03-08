let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const {BN, ether} = require("@openzeppelin/test-helpers");
const fs = require("fs");
const { poll } = require("ethers/lib/utils");

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000", // 45 Decimals
    ONE = 10 ** 27;

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce
        
    // External Addresses
    let { _aMATICc, _aMATICb, _maticToken, _dex, _dexPairFee, _chainId, _maxDepositFee, 
    _maxWithdrawalFee, _maxStrategies, _cerosStrategyAllocatoin, _waitingPoolCap, _mat, 
    _dgtRewardsPoolLimitInEth, _dgtTokenRewardsSupplyinEth, _dgtOracleInitialPriceInWei, 
    _rewardsRate, _vat_Line, _vat_line, _vat_dust, _spot_par, _jug_base, _dog_Hole, _dog_hole,
    _dog_chop, _abacus_tau, _clip_buf, _clip_tail, _clip_cusp, _clip_chip, _clip_tip, _clip_stopped, _whitelistOperator, _multisig, _polygonPool} = require(`./${hre.network.name}_config.json`);

    let _ilkCeMatic = ethers.utils.formatBytes32String("ceMATIC");
    let ceaMATICc, ceVault, dMatic, cerosRouter;

    // Contracts Fetching
    this.CeaMATICc = await hre.ethers.getContractFactory("CeToken");
    this.CeVault = await hre.ethers.getContractFactory("CeVault");
    this.DMatic = await hre.ethers.getContractFactory("dMATIC");
    this.CerosRouter = await hre.ethers.getContractFactory("CerosRouter");
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");

    this.Vat = await hre.ethers.getContractFactory("Vat");
    this.Spot = await hre.ethers.getContractFactory("Spotter");
    this.Davos = await hre.ethers.getContractFactory("Davos");
    this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
    this.DavosJoin = await hre.ethers.getContractFactory("DavosJoin");
    // this.Oracle = await hre.ethers.getContractFactory("MaticOracle"); 
    this.Oracle = await hre.ethers.getContractFactory("Oracle"); // Manual Price Set
    this.Jug = await hre.ethers.getContractFactory("Jug");
    this.Vow = await hre.ethers.getContractFactory("Vow");
    this.Dog = await hre.ethers.getContractFactory("Dog");
    this.Clip = await hre.ethers.getContractFactory("Clipper");
    this.Abacus = await hre.ethers.getContractFactory("LinearDecrease");

    this.DgtToken = await hre.ethers.getContractFactory("DGTToken");
    this.DgtRewards = await hre.ethers.getContractFactory("DGTRewards");
    this.DgtOracle = await hre.ethers.getContractFactory("DGTOracle"); 
    
    this.AuctionProxy = await hre.ethers.getContractFactory("AuctionProxy");

    const auctionProxy = await this.AuctionProxy.deploy({nonce: _nonce}); _nonce += 1;
    await auctionProxy.deployed();
    this.Interaction = await hre.ethers.getContractFactory("Interaction", {
        unsafeAllow: ['external-library-linking'],
        libraries: {
            AuctionProxy: auctionProxy.address
        }
    });

    this.MasterVault = await hre.ethers.getContractFactory("MasterVault");
    this.WaitingPool = await hre.ethers.getContractFactory("WaitingPool");
    this.CerosYieldConverterStrategy = await hre.ethers.getContractFactory("CerosYieldConverterStrategy");

    this.PriceGetter = await hre.ethers.getContractFactory("PriceGetter");

    // PriceGetter Deployment
    console.log("PriceGetter...")
    
    let { _dexFactory } = require(`./${hre.network.name}_config.json`);    
    let priceGetter = await this.PriceGetter.deploy(_dexFactory, {nonce: _nonce}); _nonce += 1;
    await priceGetter.deployed();
    console.log("PriceGetter     : " + priceGetter.address);

    // Ceros Deployment
    console.log("Ceros...");

    ceaMATICc = await upgrades.deployProxy(this.CeaMATICc, ["CEROS aMATICc Vault Token", "ceaMATICc"], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await ceaMATICc.deployed();
    ceaMATICcImp = await upgrades.erc1967.getImplementationAddress(ceaMATICc.address);
    console.log("ceaMATICc       : " + ceaMATICc.address);
    console.log("imp             : " + ceaMATICcImp);

    ceVault = await upgrades.deployProxy(this.CeVault, ["CEROS aMATICc Vault", ceaMATICc.address, _aMATICc], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await ceVault.deployed();
    ceVaultImp = await upgrades.erc1967.getImplementationAddress(ceVault.address);
    console.log("ceVault         : " + ceVault.address);
    console.log("imp             : " + ceVaultImp);

    dMatic = await upgrades.deployProxy(this.DMatic, [], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await dMatic.deployed();
    dMaticImp = await upgrades.erc1967.getImplementationAddress(dMatic.address);
    console.log("dMatic          : " + dMatic.address);
    console.log("imp             : " + dMaticImp);

    cerosRouter = await upgrades.deployProxy(this.CerosRouter, [_aMATICc, _maticToken, _aMATICb, ceVault.address, _dex, _dexPairFee, _polygonPool, priceGetter.address], {initializer: "initialize", gasLimit: 2000000, nonce: _nonce}); _nonce += 1;
    await cerosRouter.deployed();
    cerosRouterImp = await upgrades.erc1967.getImplementationAddress(cerosRouter.address);
    console.log("cerosRouter     : " + cerosRouter.address);
    console.log("imp             : " + cerosRouterImp);

    // MasterVault Deployment
    console.log("MasterVault...");

    masterVault = await upgrades.deployProxy(this.MasterVault, [_maticToken, "CEROS MATIC Vault Token", "ceMATIC", _maxDepositFee, _maxWithdrawalFee, _maxStrategies], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await masterVault.deployed();
    masterVaultImp = await upgrades.erc1967.getImplementationAddress(masterVault.address);
    console.log("masterVault     : " + masterVault.address);
    console.log("imp             : " + masterVaultImp);

    waitingPool = await upgrades.deployProxy(this.WaitingPool, [masterVault.address, _maticToken, _waitingPoolCap], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await waitingPool.deployed();
    waitingPoolImp = await upgrades.erc1967.getImplementationAddress(waitingPool.address);
    console.log("waitingPool     : " + waitingPool.address);
    console.log("imp             : " + waitingPoolImp);

    cerosYieldConverterStrategy = await upgrades.deployProxy(this.CerosYieldConverterStrategy, [cerosRouter.address, deployer.address, _maticToken, masterVault.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await cerosYieldConverterStrategy.deployed();
    cerosYieldConverterStrategyImp = await upgrades.erc1967.getImplementationAddress(cerosYieldConverterStrategy.address);
    console.log("cerosStrategy   : " + cerosYieldConverterStrategy.address);
    console.log("imp             : " + cerosYieldConverterStrategyImp);

    // Contracts deployment
    console.log("Core...");

    let abacus = await upgrades.deployProxy(this.Abacus, [], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await abacus.deployed();
    abacusImp = await upgrades.erc1967.getImplementationAddress(abacus.address);
    console.log("Abacus          :", abacus.address);
    console.log("AbacusImp       :", abacusImp);

    if (hre.network.name == "ethereum") {
        aggregatorAddress = "0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676";
    }

    // let oracle = await upgrades.deployProxy(this.Oracle, [aggregatorAddress], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await oracle.deployed();
    // let oracleImplementation = await upgrades.erc1967.getImplementationAddress(oracle.address);
    // console.log("Deployed: oracle: " + oracle.address);
    // console.log("Imp             : " + oracleImplementation);

    let oracle = await this.Oracle.deploy({nonce: _nonce}); _nonce += 1; // Fixed Version
    await oracle.deployed();
    console.log("Deployed: oracle: " + oracle.address);

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

    let davos = await upgrades.deployProxy(this.Davos, [_chainId, "DAVOS", "5000000" + wad], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await davos.deployed();
    davosImp = await upgrades.erc1967.getImplementationAddress(davos.address);
    console.log("davos           :", davos.address);
    console.log("davosImp        :", davosImp);

    let davosJoin = await upgrades.deployProxy(this.DavosJoin, [vat.address, davos.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await davosJoin.deployed();
    davosJoinImp = await upgrades.erc1967.getImplementationAddress(davosJoin.address);
    console.log("DavosJoin       :", davosJoin.address);
    console.log("DavosJoinImp    :", davosJoinImp)

    let gemJoin = await upgrades.deployProxy(this.GemJoin, [vat.address, _ilkCeMatic, masterVault.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await gemJoin.deployed();
    gemJoinImp = await upgrades.erc1967.getImplementationAddress(gemJoin.address);
    console.log("GemJoin         :", gemJoin.address);
    console.log("GemJoinImp      :", gemJoinImp);

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

    let clip = await upgrades.deployProxy(this.Clip, [vat.address, spot.address, dog.address, _ilkCeMatic], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await clip.deployed();
    clipImp = await upgrades.erc1967.getImplementationAddress(clip.address);
    console.log("Clip            :", clip.address);
    console.log("ClipImp         :", clipImp);

    let rewards = await upgrades.deployProxy(this.DgtRewards, [vat.address, ether(_dgtRewardsPoolLimitInEth).toString(), "5"], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await rewards.deployed();
    rewardsImp = await upgrades.erc1967.getImplementationAddress(rewards.address);
    console.log("Rewards         :", rewards.address);
    console.log("Imp             :", rewardsImp);

    // // No Dgt Token & Oracle at the moment
    // let dgtOracle = await upgrades.deployProxy(this.DgtOracle, [_dgtOracleInitialPriceInWei], {initializer: "initialize", nonce: _nonce}) _nonce += 1; // 0.1
    // await dgtOracle.deployed();
    // dgtOracleImplementation = await upgrades.erc1967.getImplementationAddress(dgtOracle.address);
    // console.log("dgtOracle   :", dgtOracle.address);
    // console.log("Imp          :", dgtOracleImplementation);

    // // initial dgt token supply for rewards spending
    // let dgtToken = await upgrades.deployProxy(this.DgtToken, [ether(_dgtTokenRewardsSupplyinEth).toString(), rewards.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await dgtToken.deployed();
    // dgtTokenImp = await upgrades.erc1967.getImplementationAddress(dgtToken.address);
    // console.log("dgtToken    :", dgtToken.address);
    // console.log("Imp          :", dgtTokenImp);
    
    // await dgtToken.rely(rewards.address, { nonce: _nonce}); _nonce += 1;
    // await rewards.setDgtToken(dgtToken.address, { nonce: _nonce}); _nonce += 1;
    // await rewards.setOracle(dgtOracle.address, { nonce: _nonce}); _nonce += 1;
    // await rewards.initPool(masterVault.address, _ilkCeMatic, _rewardsRate, { nonce: _nonce}) _nonce += 1; //6%

    let interaction = await upgrades.deployProxy(this.Interaction, [vat.address, spot.address, davos.address, davosJoin.address, jug.address, dog.address, rewards.address], 
        {
            initializer: "initialize",
            unsafeAllowLinkedLibraries: true,
            nonce: _nonce
        }
    ); _nonce += 1;
    await interaction.deployed();
    interactionImplAddress = await upgrades.erc1967.getImplementationAddress(interaction.address);
    console.log("interaction     : " + interaction.address);
    console.log("Imp             : " + interactionImplAddress);
    console.log("AuctionLib      : " + auctionProxy.address);

    let davosProvider = await upgrades.deployProxy(this.DavosProvider, [_maticToken, dMatic.address, masterVault.address, interaction.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await davosProvider.deployed();
    davosProviderImplementation = await upgrades.erc1967.getImplementationAddress(davosProvider.address);
    console.log("davosProvider   : " + davosProvider.address);
    console.log("imp             : " + davosProviderImplementation);

    // Store Deployed Contracts
    const addresses = {
        _ceaMATICc      : ceaMATICc.address,
        _ceaMATICcImp   : ceaMATICcImp,
        _ceVault        : ceVault.address,
        _ceVaultImp     : ceVaultImp,
        _dMatic         : dMatic.address,
        _dMaticImp      : dMaticImp,
        _cerosRouter    : cerosRouter.address,
        _cerosRouterImp : cerosRouterImp,
        _masterVault    : masterVault.address,
        _masterVaultImp : masterVaultImp,
        _waitingPool    : waitingPool.address,
        _waitingPoolImp : waitingPoolImp,
        _cerosYieldStr  : cerosYieldConverterStrategy.address,
        _cerosYieldConverterStrategyImp  : cerosYieldConverterStrategyImp,
        _abacus         : abacus.address,
        _abacusImp      : abacusImp,
        _oracle         : oracle.address,
        _oracleImp      : oracleImplementation,
        _vat            : vat.address,
        _vatImp         : vatImp,
        _spot           : spot.address,
        _spotImp        : spotImp,
        _davos          : davos.address,
        _davosImp       : davosImp,
        _davosJoin      : davosJoin.address,
        _davosJoinImp   : davosJoinImp,
        _gemJoin        : gemJoin.address,
        _gemJoinImp     : gemJoinImp,
        _jug            : jug.address,
        _jugImp         : jugImp,
        _vow            : vow.address,
        _vowImp         : vowImp,
        _dog            : dog.address,
        _dogImp         : dogImpl,
        _clip           : clip.address,
        _clipImp        : clipImp,
        _rewards        : rewards.address,
        _rewardsImp     : rewardsImp,
        _interaction    : interaction.address,
        _interactionImp : interactionImplAddress,
        _auctionLib     : auctionProxy.address,
        _davosProvider  : davosProvider.address,
        _davosProviderImp: davosProviderImplementation,
        _priceGetter    : priceGetter.address,
        // _dgtToken    : dgtToken.address,
        // _dgtTokenImp : dgtTokenImp,
        // _dgtOracle   : dgtOracle.address,
        // _dgtOracleImp: dgtOracleImp,
        _ilk             : _ilkCeMatic,
        _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/${network.name}_addresses.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/${network.name}_addresses.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});