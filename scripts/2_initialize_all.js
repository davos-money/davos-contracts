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

    // Load contract addresses
    const {
        _ceaMATICc,
        _ceVault,       
        _dMatic,        
        _cerosRouter,   
        _masterVault,   
        _waitingPool,   
        _cerosYieldStr, 
        _abacus,        
        _oracle,        
        _vat,           
        _spot,          
        _davos,         
        _davosJoin,     
        _gemJoin,       
        _jug,           
        _vow,           
        _dog,           
        _clip,          
        _rewards,       
        _interaction,   
        _auctionLib,    
        _davosProvider, 
        _priceGetter   
    } = require(`./${hre.network.name}_addresses.json`);
        
    // External Addresses
    let { _aMATICc, _aMATICb, _maticToken, _dex, _dexPairFee, _chainId, _maxDepositFee, 
    _maxWithdrawalFee, _maxStrategies, _cerosStrategyAllocatoin, _waitingPoolCap, _mat, 
    _dgtRewardsPoolLimitInEth, _dgtTokenRewardsSupplyinEth, _dgtOracleInitialPriceInWei, 
    _rewardsRate, _vat_Line, _vat_line, _vat_dust, _spot_par, _jug_base, _dog_Hole, _dog_hole,
    _dog_chop, _abacus_tau, _clip_buf, _clip_tail, _clip_cusp, _clip_chip, _clip_tip, _clip_stopped, _whitelistOperator, _multisig, _polygonPool} = require(`./${hre.network.name}_config.json`);

    let _ilkCeMatic = ethers.utils.formatBytes32String("ceMATIC");

    // Contracts Fetching
    let ceaMATICc = await hre.ethers.getContractAt("CeToken", _ceaMATICc);
    let ceVault = await hre.ethers.getContractAt("CeVault", _ceVault);
    let dMatic = await hre.ethers.getContractAt("dMATIC", _dMatic);
    let cerosRouter = await hre.ethers.getContractAt("CerosRouter", _cerosRouter);
    let davosProvider = await hre.ethers.getContractAt("DavosProvider", _davosProvider);

    let vat = await hre.ethers.getContractAt("Vat", _vat);
    let spot = await hre.ethers.getContractAt("Spotter", _spot);
    let davos = await hre.ethers.getContractAt("Davos", _davos);
    let gemJoin = await hre.ethers.getContractAt("GemJoin", _gemJoin);
    let davosJoin = await hre.ethers.getContractAt("DavosJoin", _davosJoin);
    // this.Oracle = await hre.ethers.getContractAt("MaticOracle", ""); 
    let oracle = await hre.ethers.getContractAt("Oracle", _oracle); // Manual Price Set
    let jug = await hre.ethers.getContractAt("Jug", _jug);
    let vow = await hre.ethers.getContractAt("Vow", _vow);
    let dog = await hre.ethers.getContractAt("Dog", _dog);
    let clip = await hre.ethers.getContractAt("Clipper", _clip);
    let abacus = await hre.ethers.getContractAt("LinearDecrease", _abacus);
 
    // this.DgtToken = await hre.ethers.getContractAt("DGTToken", "");
    let rewards = await hre.ethers.getContractAt("DGTRewards", _rewards);
    // this.DgtOracle = await hre.ethers.getContractAt("DGTOracle", ""); 
    
    let auctionProxy = await hre.ethers.getContractAt("AuctionProxy", _auctionLib);
 
    let interaction = await hre.ethers.getContractAt("Interaction", _interaction);
 
    let masterVault = await hre.ethers.getContractAt("MasterVault", _masterVault);
    let waitingPool = await hre.ethers.getContractAt("WaitingPool", _waitingPool);
    let cerosYieldConverterStrategy = await hre.ethers.getContractAt("CerosYieldConverterStrategy", _cerosYieldStr);

    let priceGetter = await hre.ethers.getContractAt("PriceGetter", _priceGetter);

    // Initialization
    console.log("Ceros init...");
    await(await ceaMATICc.changeVault(ceVault.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await ceVault.changeRouter(cerosRouter.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await dMatic.changeMinter(davosProvider.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await cerosRouter.changeStrategy(cerosYieldConverterStrategy.address, {nonce: _nonce})).wait(); _nonce += 1;

    console.log("MasterVault init...");
    await(await masterVault.setWaitingPool(waitingPool.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await masterVault.setStrategy(cerosYieldConverterStrategy.address, _cerosStrategyAllocatoin, {nonce: _nonce})).wait(); _nonce += 1;
    await(await masterVault.changeProvider(davosProvider.address, {nonce: _nonce})).wait(); _nonce += 1;

    console.log("Oracle init...") // Fixed Version
    await(await oracle.setPrice("1160000000000000000")).wait(); _nonce += 1;

    console.log("Vat init...");
    await(await vat.rely(gemJoin.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await vat.rely(spot.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await vat.rely(davosJoin.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await vat.rely(jug.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await vat.rely(dog.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await vat.rely(clip.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await vat.rely(interaction.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await vat["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Line"), _vat_Line + rad, {nonce: _nonce})).wait(); _nonce += 1;
    await(await vat["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("line"), _vat_line + rad, {nonce: _nonce})).wait(); _nonce += 1;
    await(await vat["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("dust"), _vat_dust + rad, {nonce: _nonce})).wait(); _nonce += 1;
    
    console.log("Davos init...");
    await(await davos.rely(davosJoin.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await davos.setSupplyCap("5000000" + wad, {nonce: _nonce})).wait(); _nonce += 1;

    console.log("Spot init...");
    await(await spot.rely(interaction.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await spot["file(bytes32,bytes32,address)"](_ilkCeMatic, ethers.utils.formatBytes32String("pip"), oracle.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await spot["file(bytes32,uint256)"](ethers.utils.formatBytes32String("par"), _spot_par + ray, {nonce: _nonce})).wait(); _nonce += 1; // It means pegged to 1$

    console.log("Rewards init...");
    await(await rewards.rely(interaction.address, {nonce: _nonce})).wait(); _nonce += 1;

    console.log("Joins init...");
    await(await gemJoin.rely(interaction.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await davosJoin.rely(interaction.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await davosJoin.rely(vow.address, {nonce: _nonce})).wait(); _nonce += 1;

    console.log("Dog init...");
    await(await dog.rely(interaction.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await dog.rely(clip.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await dog["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await dog["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Hole"), _dog_Hole + rad, {nonce: _nonce})).wait(); _nonce += 1;
    await(await dog["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("hole"), _dog_hole + rad, {nonce: _nonce})).wait(); _nonce += 1;
    await(await dog["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("chop"), _dog_chop, {nonce: _nonce})).wait(); _nonce += 1;
    await(await dog["file(bytes32,bytes32,address)"](_ilkCeMatic, ethers.utils.formatBytes32String("clip"), clip.address, {nonce: _nonce})).wait(); _nonce += 1;

    console.log("Clip init...");
    await(await clip.rely(interaction.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await clip.rely(dog.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("buf"), _clip_buf, {nonce: _nonce})).wait(); _nonce += 1; // 10%
    await(await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tail"), _clip_tail, {nonce: _nonce})).wait(); _nonce += 1; // 3H reset time
    await(await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("cusp"), _clip_cusp, {nonce: _nonce})).wait(); _nonce += 1; // 60% reset ratio
    await(await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("chip"), _clip_chip, {nonce: _nonce})).wait(); _nonce += 1; // 0.01% vow incentive
    await(await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tip"), _clip_tip + rad, {nonce: _nonce})).wait(); _nonce += 1; // 10$ flat incentive
    await(await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("stopped"), _clip_stopped, {nonce: _nonce})).wait(); _nonce += 1;
    await(await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("spotter"), spot.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("dog"), dog.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("calc"), abacus.address, {nonce: _nonce})).wait(); _nonce += 1;

    console.log("Jug...");
    await(await jug.rely(interaction.address, {nonce: _nonce})).wait(); _nonce += 1;
    // Initialize Rates Module
    // IMPORTANT: Base and Duty are added together first, thus will compound together.
    //            It is adviced to set a constant base first then duty for all ilks.
    //            Otherwise, a change in base rate will require a change in all ilks rate.
    //            Due to addition of both rates, the ratio should be adjusted by factoring.
    //            rate(Base) + rate(Duty) != rate(Base + Duty)

    // Calculating Base Rate (1% Yearly)
    // ==> principal*(rate**seconds)-principal = 0.01 (1%)
    // ==> 1 * (BR ** 31536000 seconds) - 1 = 0.01
    // ==> 1*(BR**31536000) = 1.01
    // ==> BR**31536000 = 1.01
    // ==> BR = 1.01**(1/31536000)
    // ==> BR = 1.000000000315529215730000000 [ray]
    // Factoring out Ilk Duty Rate (1% Yearly)
    // ((1 * (BR + 0.000000000312410000000000000 DR)^31536000)-1) * 100 = 0.000000000312410000000000000 = 2% (BR + DR Yearly)
    
    // 1000000000315522921573372069 1% Borrow Rate
    // 1000000000627937192491029810 2% Borrow Rate
    // 1000000000937303470807876290 3% Borrow Rate
    // 1000000003022266000000000000 10% Borrow Rate
    // ***We don't set base rate. We set only duty rate via interaction***
    // await(await jug["file(bytes32,uint256)"](ethers.utils.formatBytes32String("base"), "1000000000627937192491029810")).wait();
    await(await jug["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address, {nonce: _nonce})).wait(); _nonce += 1;

    console.log("Vow init...");
    await(await vow.rely(dog.address, {nonce: _nonce})).wait(); _nonce += 1;
    await(await vow["file(bytes32,address)"](ethers.utils.formatBytes32String("davos"), davos.address, {nonce: _nonce})).wait(); _nonce += 1;

    console.log("Interaction init...");
    await(await interaction.setDavosProvider(masterVault.address, davosProvider.address, {nonce: _nonce})).wait(); _nonce += 1;
    tx = await interaction.setCollateralType(masterVault.address, gemJoin.address, _ilkCeMatic, clip.address, _mat, {nonce: _nonce}); _nonce += 1;
    await ethers.provider.waitForTransaction(tx.hash, 1, 60000);
    tx = await interaction.poke(masterVault.address, {nonce: _nonce}); _nonce += 1;
    await ethers.provider.waitForTransaction(tx.hash, 1, 60000);
    tx = await interaction.drip(masterVault.address, {nonce: _nonce, gasLimit: 200000}); _nonce += 1;
    await ethers.provider.waitForTransaction(tx.hash, 1, 60000);
    await(await interaction.enableWhitelist({nonce: _nonce})).wait();  _nonce += 1; // Deposits are limited to whitelist
    await(await interaction.setWhitelistOperator(_whitelistOperator, {nonce: _nonce})).wait();  _nonce += 1; // Whitelist manager
    tx = await interaction.setCollateralDuty(masterVault.address, "1000000000627937192491029810", {nonce: _nonce, gasLimit: 250000}); _nonce += 1;
    await ethers.provider.waitForTransaction(tx.hash, 1, 60000);

    console.log("Abaci init...");
    await(await abacus.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tau"), _abacus_tau, {nonce: _nonce})).wait(); _nonce += 1; // Price will reach 0 after this time
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});