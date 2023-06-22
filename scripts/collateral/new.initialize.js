let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000", // 45 Decimals
    ONE = 10 ** 27;

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();

    // Config
    let {_underlying, _interaction, _auctionProxy, _vat, _spot, _dog, _vow, _abacus, _ilk} = require(`./config_${hre.network.name}.json`);
    let { _yieldInheritor, _dog_hole, _dog_chop, _clip_buf, _clip_tail, _clip_cusp, _clip_chip, _clip_tip, _clip_stopped, _vat_line, _vat_dust, _jug_duty, _mat} = require(`./config_${hre.network.name}.json`);

    let { _masterVault, _davosProvider, _dMatic, _clip, _gemJoin} = require(`./addresses_${hre.network.name}.json`);

    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
    this.DMatic = await hre.ethers.getContractFactory("dCOL");
    this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
    this.Clip = await hre.ethers.getContractFactory("Clipper");
    // this.WstETHOracle = await hre.ethers.getContractFactory("WstETHOracle");

    // Initialize
    console.log("Initializing...");

    this.Interaction = await hre.ethers.getContractFactory("Interaction", {
        unsafeAllow: ['external-library-linking'],
        libraries: {
            AuctionProxy: _auctionProxy
        }
    });
    let interactionAttached = await this.Interaction.attach(_interaction);

    let masterVaultAt = await ethers.getContractAt("MasterVault_V2", _masterVault);
    let dMaticAt = await ethers.getContractAt("dCOL", _dMatic);
    let clipAt = await ethers.getContractAt("Clipper", _clip);
    let gemJoinAt = await ethers.getContractAt("GemJoin", _gemJoin);
    let vatAt = await ethers.getContractAt("Vat", _vat);
    let dogAt = await ethers.getContractAt("Dog", _dog);
    let spotAt = await ethers.getContractAt("Spotter", _spot);
    // let oracleAt = await ethers.getContractAt("WstETHOracle", _oracle);

    // let aggregatorAddress;
    // if (hre.network.name == "ethereum") {
    //     aggregatorAddress = "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8";
    // } else aggregatorAddress = "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8"; // Dummy

    // console.log("Oracle init...");
    // await oracleAt.initialize(aggregatorAddress, _underlying, _masterVault);

    console.log("MasterVault_V2 init...");
    await masterVaultAt.changeProvider(_davosProvider); console.log("1");
    await masterVaultAt.changeYieldHeritor(_yieldInheritor); console.log("2");
    // await masterVaultAt.changeAdapter(,);

    console.log("DMatic init...");
    await dMaticAt.changeMinter(_davosProvider);

    // console.log("Vat init...");
    // await vatAt.rely(gemJoinAt.address); console.log("1")
    // await vatAt.rely(_clip); console.log("2")
    // await vatAt["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("line"), _vat_line + rad); console.log("3")
    // await vatAt["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("dust"), _vat_dust + rad); console.log("4")
    
    // console.log("Spot init...");
    // await spotAt["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("pip"), "0x1e9D5CD972B67D13BB5bfC1Cdd5d6C50F1aFa0df");

    console.log("Gemjoin init...");
    await gemJoinAt.rely(_interaction);

    // console.log("Dog init...");
    // await dogAt.rely(_clip); console.log("1")
    // await dogAt["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("hole"), _dog_hole + rad); console.log("2")
    // await dogAt["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("chop"), _dog_chop); console.log("3")
    // await dogAt["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("clip"), _clip); console.log("4")

    console.log("Clip init...");
    await clipAt.rely(_interaction); console.log("1")
    await clipAt.rely(dogAt.address); console.log("2")
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("buf"), _clip_buf); console.log("3")// 10%
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tail"), _clip_tail); console.log("4")// 3H reset time
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("cusp"), _clip_cusp); console.log("5")// 60% reset ratio
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("chip"), _clip_chip); console.log("6")// 0.01% vow incentive
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tip"), _clip_tip + rad); console.log("7")// 10$ flat incentive
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("stopped"), _clip_stopped); console.log("8")
    await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("spotter"), _spot); console.log("9")
    await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("dog"), dogAt.address); console.log("10")
    await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), _vow); console.log("11")
    await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("calc"), _abacus); console.log("12")

    // console.log("Interaction init...");
    // await interactionAttached.setDavosProvider(_masterVault, _davosProvider); console.log("1")
    // await interactionAttached.setCollateralType(_masterVault, _gemJoin, _ilk, _clip, _mat); console.log("2")
    // await interactionAttached.poke(_masterVault, {gasLimit: 300000}); console.log("3")
    // await interactionAttached.drip(_masterVault, {gasLimit: 200000}); console.log("4")
    // await interactionAttached.setCollateralDuty(_masterVault, _jug_duty, {gasLimit: 250000}); console.log("5")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});