let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const {BN, ether} = require("@openzeppelin/test-helpers");
const { deploy } = require("@openzeppelin/hardhat-upgrades/dist/utils");

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000", // 45 Decimals
    ONE = 10 ** 27;

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    let { _vat_Line, _spot_par, _dog_Hole, _abacus_tau } = require(`./config_${hre.network.name}.json`);

    // Addresses
    let { _vat, _spot, _davos, _davosJoin, _jug, _vow, _dog, _abacus } = require(`./addresses_${hre.network.name}_1.json`);
    let { _rewards, _interaction } = require(`./addresses_${hre.network.name}_2.json`);

    // Attaching
    let vat = await hre.ethers.getContractAt("Vat", _vat);
    let spot = await hre.ethers.getContractAt("Spotter", _spot);
    let davos = await hre.ethers.getContractAt("Davos", _davos);
    let davosJoin = await hre.ethers.getContractAt("DavosJoin", _davosJoin);
    let jug = await hre.ethers.getContractAt("Jug", _jug);
    let vow = await hre.ethers.getContractAt("Vow", _vow);
    let dog = await hre.ethers.getContractAt("Dog", _dog);
    let abacus = await hre.ethers.getContractAt("LinearDecrease", _abacus);
 
    let rewards = await hre.ethers.getContractAt("DGTRewards", _rewards);
    let interaction = await hre.ethers.getContractAt("Interaction", _interaction);

    console.log("Vat init...");
    await vat.rely(spot.address, {nonce: _nonce}); _nonce += 1;
    await vat.rely(davosJoin.address, {nonce: _nonce}); _nonce += 1;
    await vat.rely(jug.address, {nonce: _nonce}); _nonce += 1;
    await vat.rely(dog.address, {nonce: _nonce}); _nonce += 1;
    await vat.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    await vat["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Line"), _vat_Line + rad, {nonce: _nonce}); _nonce += 1;
    
    console.log("Davos init...");
    await davos.rely(davosJoin.address, {nonce: _nonce}); _nonce += 1;
    await davos.setSupplyCap("5000000" + wad, {nonce: _nonce}); _nonce += 1;

    console.log("Spot init...");
    await spot.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    await spot["file(bytes32,uint256)"](ethers.utils.formatBytes32String("par"), _spot_par + ray, {nonce: _nonce}); _nonce += 1; // It means pegged to 1$

    console.log("Rewards init...");
    await rewards.rely(interaction.address, {nonce: _nonce}); _nonce += 1;

    console.log("Joins init...");
    await davosJoin.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    await davosJoin.rely(vow.address, {nonce: _nonce}); _nonce += 1;

    console.log("Dog init...");
    await dog.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    await dog["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address, {nonce: _nonce}); _nonce += 1;
    await dog["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Hole"), _dog_Hole + rad, {nonce: _nonce}); _nonce += 1;

    console.log("Jug...");
    // Initialize Rates Module
    // IMPORTANT: Base and Duty are added together first, thus will compound together.
    //            It is adviced to set a constant base first then duty for all ilks.
    //            Otherwise, a change in base rate will require a change in all ilks rate.
    //            Due to addition of both rates, the ratio should be adjusted by factoring.
    //            rate(Base) + rate(Duty) != rate(Base + Duty)
    // Duty by default set to 1 Ray which is 0%, but added to Base that makes its effect compound
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
    // ***We don't set base rate here. We set only duty rate via interaction***
    // await jug["file(bytes32,uint256)"](ethers.utils.formatBytes32String("base"), "1000000000627937192491029810"); - [Avoid this]
    await jug.rely(interaction.address, {nonce: _nonce}); _nonce += 1;
    await jug["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address, {nonce: _nonce}); _nonce += 1;

    console.log("Vow init...");
    await vow.rely(dog.address, {nonce: _nonce}); _nonce += 1;
    await vow["file(bytes32,address)"](ethers.utils.formatBytes32String("davos"), davos.address, {nonce: _nonce}); _nonce += 1;
    
    console.log("Abaci init...");
    await abacus.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tau"), _abacus_tau, {nonce: _nonce}); _nonce += 1; // Price will reach 0 after this time

    console.log("Protocol Ready !!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});