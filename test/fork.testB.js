const ether = require('@openzeppelin/test-helpers/src/ether');
const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { joinSignature } = require('ethers/lib/utils');
const { ethers, network } = require('hardhat');
const Web3 = require('web3');

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000", // 45 Decimals
    ONE = 10 ** 27;

// let { _dog_hole, _dog_chop, _clip_buf, _clip_tail, _clip_cusp, _clip_chip, _clip_tip, _clip_stopped, _vat_line, _vat_dust, _jug_duty, _mat} = require(`../scripts/collateral/config_bsc.json`);

let interaction;
let vat;
let dog;
let spot;
let vow;
let ra;

let wcUSDC, masterVault, dMatic, davosProvider, gemJoin, clip;

let oracle;

let ilk;

let cusdc;
let usdc;

let cusdcOwner;
let usdcOwner;

describe('===FORK===', function () {
    let signer, signer2, signer3, deployer, civilian, receiver, bscOwner;
    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
    const MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

        await network.provider.request({
            method: "hardhat_reset",
            params: [
            {
                forking: {
                jsonRpcUrl: "https://rpc.ankr.com/bsc",
                blockNumber: 37099898
                },
            },
            ],
        });

        console.log("Initializing...");

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xE68Ee8A12c611fd043fB05d65E1548dC1383f2b9"],
        });
        usdcOwner = await ethers.getSigner("0xE68Ee8A12c611fd043fB05d65E1548dC1383f2b9")
        await network.provider.send("hardhat_setBalance", [
            "0xE68Ee8A12c611fd043fB05d65E1548dC1383f2b9",
            "0x10000000000000000000",
        ]);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x7D569Dd7053E169d026a137491628130064934cD"],
        });
        civilian = await ethers.getSigner("0x7D569Dd7053E169d026a137491628130064934cD")
        await network.provider.send("hardhat_setBalance", [
            "0x7D569Dd7053E169d026a137491628130064934cD",
            "0x10000000000000000000",
        ]);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x2850C2929B33BCE33b8aa81B0A9D1d3632118896"],
        });
        signer = await ethers.getSigner("0x2850C2929B33BCE33b8aa81B0A9D1d3632118896")
        await network.provider.send("hardhat_setBalance", [
            "0x2850C2929B33BCE33b8aa81B0A9D1d3632118896",
            "0x10000000000000000000",
        ]);
        
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x9126BC45A20076Eb9f65dE83C18bd3d618759Fc4"],
        });
        signer2 = await ethers.getSigner("0x9126BC45A20076Eb9f65dE83C18bd3d618759Fc4")
        await network.provider.send("hardhat_setBalance", [
            "0x9126BC45A20076Eb9f65dE83C18bd3d618759Fc4",
            "0x10000000000000000000",
        ]);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x6c5BEf6E55a8663f41a05BB1Bc66ABEC24e892D0"],
        });
        signer3 = await ethers.getSigner("0x6c5BEf6E55a8663f41a05BB1Bc66ABEC24e892D0")
        await network.provider.send("hardhat_setBalance", [
            "0x6c5BEf6E55a8663f41a05BB1Bc66ABEC24e892D0",
            "0x10000000000000000000",
        ]);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x42bA6167ac1e5a37bA2B773EC3b7e4761cBC821C"],
        });
        deployer = await ethers.getSigner("0x42bA6167ac1e5a37bA2B773EC3b7e4761cBC821C")
        await network.provider.send("hardhat_setBalance", [
            "0x42bA6167ac1e5a37bA2B773EC3b7e4761cBC821C",
            "0x10000000000000000000",
        ]);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x73CF7cC1778a60d43Ca2833F419B77a76177156A"],
        });
        receiver = await ethers.getSigner("0x73CF7cC1778a60d43Ca2833F419B77a76177156A")
        await network.provider.send("hardhat_setBalance", [
            "0x73CF7cC1778a60d43Ca2833F419B77a76177156A",
            "0x10000000000000000000",
        ]);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x0567E328D0E23be8B8cB8c3004bEAc39fbD11082"],
        });
        bscOwner = await ethers.getSigner("0x0567E328D0E23be8B8cB8c3004bEAc39fbD11082")
        await network.provider.send("hardhat_setBalance", [
            "0x0567E328D0E23be8B8cB8c3004bEAc39fbD11082",
            "0x10000000000000000000",
        ]);
    });

    describe('-', function () {
        beforeEach(async function () {

        });
        it('tests', async function () {
            this.timeout(150000000);

            let mvNEW = await (await ethers.getContractFactory("MasterVault_V2_R")).deploy();
            await mvNEW.deployed();

            let proxyAdmin = await ethers.getContractAt(["function upgrade(address,address) external"], "0xa88b54e6b76fb97cdb8ecae868f1458e18a953f4");
            let mvVUSDT = await ethers.getContractAt("MasterVault_V2_R", "0xb44A251d1C31dd32700E5F2584B4282716C43EB3");
            let mvVUSDC = await ethers.getContractAt("MasterVault_V2_R", "0x87ad5Ab05d7C1E1F904e029783810A2a95702563");

            await proxyAdmin.connect(bscOwner).upgrade(mvVUSDT.address, mvNEW.address);
            await proxyAdmin.connect(bscOwner).upgrade(mvVUSDC.address, mvNEW.address);

            await mvVUSDT.connect(bscOwner).changeUnitroller("0xfD36E2c2a6789Db23113685031d7F16329158384");
            await mvVUSDT.connect(bscOwner).changeXVS("0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63");
            await mvVUSDC.connect(bscOwner).changeUnitroller("0xfD36E2c2a6789Db23113685031d7F16329158384");
            await mvVUSDC.connect(bscOwner).changeXVS("0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63");

            let xvs = await ethers.getContractAt("Davos", "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63");
            let yieldHeritor = await mvVUSDT.yieldHeritor();

            console.log("BALANCES");
            console.log(await xvs.balanceOf(yieldHeritor));

            console.log("ACCRUED")
            let c = await ethers.getContractAt(["function venusAccrued(address) external view returns(uint256)"], "0xfD36E2c2a6789Db23113685031d7F16329158384");
            console.log(await c.venusAccrued(mvVUSDT.address));
            c = await ethers.getContractAt(["function venusAccrued(address) external view returns(uint256)"], "0xfD36E2c2a6789Db23113685031d7F16329158384");
            console.log(await c.venusAccrued(mvVUSDC.address));

            console.log("Yield HERITOR")
            c = await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63");
            console.log(await c.balanceOf(yieldHeritor));

            console.log("CLAIMED !!!!!!!!!")
            await mvVUSDT.claimX();
            // c = await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63");
            console.log(await xvs.balanceOf(yieldHeritor));
            await mvVUSDC.claimX();
            // c = await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63");
            console.log(await xvs.balanceOf(yieldHeritor));
            // c = await ethers.getContractAt(["function claimVenus(address) external"], "0xfD36E2c2a6789Db23113685031d7F16329158384");
            // await c.claimVenus("0xb44A251d1C31dd32700E5F2584B4282716C43EB3")

            c = await ethers.getContractAt(["function venusAccrued(address) external view returns(uint256)"], "0xfD36E2c2a6789Db23113685031d7F16329158384");
            console.log(await c.venusAccrued(mvVUSDT.address));
            c = await ethers.getContractAt(["function venusAccrued(address) external view returns(uint256)"], "0xfD36E2c2a6789Db23113685031d7F16329158384");
            console.log(await c.venusAccrued(mvVUSDC.address));

            // c = await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63");
            // console.log(await c.balanceOf("0xb44A251d1C31dd32700E5F2584B4282716C43EB3"));
        });
    });
});