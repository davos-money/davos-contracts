let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");
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
    let _vat = "0x08ABFd7DEd42CC33900d3457118eAB7fC40b71c8", 
        _spot = "0x8D575d202B7653fb2E076Be451B006626Cc31858", 
        _dog = "0xE309C0FE37D3696Cf8c13A629Dc43eAEfC077418", 
        _vow = "0x29Ded4C99690968562f2D067968aA72b7d46A65D", 
        _abacus = "0x72112dEEb7F68B5A2629AdfB7b5830D8C06Dc8A1";
    let _interaction = "0x7e426F367C40Fc6e1ec919E0a7E51fcb9a564B0F", 
        _auctionProxy = "0x67423E8a06F1a35556E56B8214cDa9A248c0fe09";
    let _yieldInheritor = deployer.address;
    let { _dog_hole, _clip_buf, _clip_tail, _clip_cusp, _clip_chip, _clip_tip, _clip_stopped, _vat_line, _jug_duty } = require(`./config_${hre.network.name}.json`);

    let _vat_dust = "100000000000000000000000000000000000000000000000";
    let _dog_chop = "1020000000000000000";
    let _mat = "1075268817204301100000000000";

    let _ratioAdapter = "0x046B71694B3b659F491247167EDa42E0556123cf";
    let { _oracleUSDT } = require(`../addresses_${hre.network.name}_oracle_ion.json`);

    let _ilk = "0x4d56545f696f6e55534454000000000000000000000000000000000000000000";

    let { _masterVault, _davosProvider, _dMatic, _clip, _gemJoin } = require(`../addresses_${hre.network.name}_collateral_ionUSDT.json`);

    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
    this.DMatic = await hre.ethers.getContractFactory("dCol");
    this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
    this.Clip = await hre.ethers.getContractFactory("Clipper");

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
    let dMaticAt = await ethers.getContractAt("dCol", _dMatic);
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
    // await oracleAt.initialize(aggregatorAddress, _underlying, _masterVault, {nonce: _nonce});

    console.log("MasterVault_V2 init...");
    await masterVaultAt.changeProvider(_davosProvider, {nonce: _nonce}); _nonce += 1; console.log("1");
    await masterVaultAt.changeYieldHeritor(_yieldInheritor, {nonce: _nonce}); _nonce += 1; console.log("2");
    await masterVaultAt.changeAdapter(_ratioAdapter, {nonce: _nonce}); _nonce += 1;

    console.log("DMatic init...");
    await dMaticAt.changeMinter(_davosProvider, {nonce: _nonce}); _nonce += 1;

    console.log("Vat init...");
    await vatAt.rely(gemJoinAt.address, {nonce: _nonce}); _nonce += 1; console.log("1")
    await vatAt.rely(_clip, {nonce: _nonce}); _nonce += 1; console.log("2")
    await vatAt["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("line"), _vat_line + rad, {nonce: _nonce}); _nonce += 1; console.log("3")
    await vatAt["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("dust"), _vat_dust, {nonce: _nonce}); _nonce += 1; console.log("4")
    
    console.log("Spot init...");
    await spotAt["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("pip"), _oracleUSDT, {nonce: _nonce}); _nonce += 1;

    console.log("Gemjoin init...");
    await gemJoinAt.rely(_interaction, {nonce: _nonce}); _nonce += 1;

    console.log("Dog init...");
    await dogAt.rely(_clip, {nonce: _nonce}); _nonce += 1; console.log("1")
    await dogAt["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("hole"), _dog_hole + rad, {nonce: _nonce}); _nonce += 1; console.log("2")
    await dogAt["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("chop"), _dog_chop, {nonce: _nonce}); _nonce += 1; console.log("3")
    await dogAt["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("clip"), _clip, {nonce: _nonce}); _nonce += 1; console.log("4")

    console.log("Clip init...");
    await clipAt.rely(_interaction, {nonce: _nonce}); _nonce += 1; console.log("1")
    await clipAt.rely(dogAt.address, {nonce: _nonce}); _nonce += 1; console.log("2")
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("buf"), _clip_buf, {nonce: _nonce}); _nonce += 1; console.log("3")// 10%
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tail"), _clip_tail, {nonce: _nonce}); _nonce += 1; console.log("4")// 3H reset time
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("cusp"), _clip_cusp, {nonce: _nonce}); _nonce += 1; console.log("5")// 60% reset ratio
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("chip"), _clip_chip, {nonce: _nonce}); _nonce += 1; console.log("6")// 0.01% vow incentive
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tip"), _clip_tip + rad, {nonce: _nonce}); _nonce += 1; console.log("7")// 10$ flat incentive
    await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("stopped"), _clip_stopped, {nonce: _nonce}); _nonce += 1; console.log("8")
    await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("spotter"), _spot, {nonce: _nonce}); _nonce += 1; console.log("9")
    await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("dog"), dogAt.address, {nonce: _nonce}); _nonce += 1; console.log("10")
    await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), _vow, {nonce: _nonce}); _nonce += 1; console.log("11")
    await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("calc"), _abacus, {nonce: _nonce}); _nonce += 1; console.log("12")

    console.log("Interaction init...");
    await interactionAttached.setDavosProvider(_masterVault, _davosProvider, {nonce: _nonce}); _nonce += 1; console.log("1")
    await interactionAttached.setCollateralType(_masterVault, _gemJoin, _ilk, _clip, _mat, {nonce: _nonce}); _nonce += 1; console.log("2")
    await interactionAttached.poke(_masterVault, {nonce: _nonce, gasLimit: 3000000}); _nonce += 1; console.log("3")
    await interactionAttached.drip(_masterVault, {nonce: _nonce, gasLimit: 2000000}); _nonce += 1; console.log("4")
    await interactionAttached.setCollateralDuty(_masterVault, _jug_duty, {nonce: _nonce, gasLimit: 25000000}); _nonce += 1; console.log("5")
}

main() 
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});