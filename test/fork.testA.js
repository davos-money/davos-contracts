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
    let signer, signer2, signer3, deployer, civilian, receiver, arbitrumOwner;
    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
    const MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

        await network.provider.request({
            method: "hardhat_reset",
            params: [
            {
                forking: {
                jsonRpcUrl: "https://rpc.ankr.com/arbitrum",
                blockNumber: 191915216
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
            params: ["0x39355FFAfC47E54E7d7e786b1Df0fa0e222FBd06"],
        });
        arbitrumOwner = await ethers.getSigner("0x39355FFAfC47E54E7d7e786b1Df0fa0e222FBd06")
        await network.provider.send("hardhat_setBalance", [
            "0x39355FFAfC47E54E7d7e786b1Df0fa0e222FBd06",
            "0x10000000000000000000",
        ]);
    });

    describe('-', function () {
        beforeEach(async function () {

        });
        it('tests', async function () {
            this.timeout(150000000);

            let wcusdcNew = await (await ethers.getContractFactory("WcUSDCv3_2")).deploy();
            await wcusdcNew.deployed();

            let wcusdc = await ethers.getContractAt("WcUSDCv3_2", "0xe148C9fC6Cb7E968BfF86Ec9A6a881662d8ED9bb");
            let proxyAdmin = await ethers.getContractAt(["function upgrade(address,address) external"], "0xa88b54e6b76fb97cdb8ecae868f1458e18a953f4")
            await proxyAdmin.connect(arbitrumOwner).upgrade(wcusdc.address, wcusdcNew.address);

            await wcusdc.connect(arbitrumOwner)["file(bytes32,address)"](ethers.utils.formatBytes32String("multisig"), deployer.address);
            await wcusdc.connect(arbitrumOwner)["file(bytes32,address)"](ethers.utils.formatBytes32String("rewards"), "0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae");
            await wcusdc.connect(arbitrumOwner)["file(bytes32,address)"](ethers.utils.formatBytes32String("comp"), "0x354A6dA3fcde098F8389cad84b0182725c6C91dE");

            let comet;
            comet = await ethers.getContractAt(["function baseTrackingAccrued(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
            console.log(await comet.baseTrackingAccrued("0xe148C9fC6Cb7E968BfF86Ec9A6a881662d8ED9bb"));

            comet = await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
            await comet.accrueAccount("0xe148C9fC6Cb7E968BfF86Ec9A6a881662d8ED9bb");

            comet = await ethers.getContractAt(["function baseTrackingAccrued(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
            console.log(await comet.baseTrackingAccrued("0xe148C9fC6Cb7E968BfF86Ec9A6a881662d8ED9bb"));

            console.log("CLAIMED");
            comet = await ethers.getContractAt(["function rewardsClaimed(address,address) external view returns(uint256)"], "0x88730d254a2f7e6ac8388c3198afd694ba9f7fae");
            console.log(await comet.rewardsClaimed("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "0xe148C9fC6Cb7E968BfF86Ec9A6a881662d8ED9bb"))

            await wcusdc.claimX();
            // comet = await ethers.getContractAt(["function claim(address,address,bool) external"], "0x88730d254a2f7e6ac8388c3198afd694ba9f7fae");
            // await comet.claim("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "0xe148C9fC6Cb7E968BfF86Ec9A6a881662d8ED9bb", true)

            console.log("CLAIMED");
            comet = await ethers.getContractAt(["function rewardsClaimed(address,address) external view returns(uint256)"], "0x88730d254a2f7e6ac8388c3198afd694ba9f7fae");
            console.log(await comet.rewardsClaimed("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "0xe148C9fC6Cb7E968BfF86Ec9A6a881662d8ED9bb"))

            let h = await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x354A6dA3fcde098F8389cad84b0182725c6C91dE")
            console.log(await h.balanceOf(deployer.address))

            comet = await ethers.getContractAt(["function baseTrackingAccrued(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
            console.log(await comet.baseTrackingAccrued("0xe148C9fC6Cb7E968BfF86Ec9A6a881662d8ED9bb"));
        });
    });
});