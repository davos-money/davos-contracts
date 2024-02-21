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

let { _dog_hole, _dog_chop, _clip_buf, _clip_tail, _clip_cusp, _clip_chip, _clip_tip, _clip_stopped, _vat_line, _vat_dust, _jug_duty, _mat} = require(`../scripts/collateral/config_bsc.json`);

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
    let signer, signer2, signer3, deployer, civilian, receiver;
    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
    const MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

        await network.provider.request({
            method: "hardhat_reset",
            params: [
            {
                forking: {
                jsonRpcUrl: "https://rpc.ankr.com/eth",
                blockNumber: 19239176
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
    });

    describe('-', function () {
        beforeEach(async function () {

            // Init Base
            // this.Interaction = await hre.ethers.getContractFactory("Interaction", {
            //     unsafeAllow: ['external-library-linking'],
            //     libraries: {
            //         AuctionProxy: "0x1c539E755A1BdaBB168aA9ad60B31548991981F9"
            //     }
            // });
            // interaction = await this.Interaction.attach("0xa48F322F8b3edff967629Af79E027628b9Dd1298");

            // vat = await ethers.getContractAt("Vat", "0x2304CE6B42D505141A286B7382d4D515950b1890");
            // dog = await ethers.getContractAt("Dog", "0xa0CF627D429F35411820590D72eBaD183FD61C33");
            // spot = await ethers.getContractAt("Spotter", "0x819d1Daa794c1c46B841981b61cC978d95A17b8e");
            // vow = await ethers.getContractAt("Vow", "0xe84d3029feDd3CbE3d30c5245679CBD9B30118bC");
            

            // Deploy Collateral
            // this.WrappedWcUSDCv3 = await hre.ethers.getContractFactory("WcUSDCv3_2");
            // this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
            // this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
            // this.DMatic = await hre.ethers.getContractFactory("dCol");
            // this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
            // this.Clip = await hre.ethers.getContractFactory("Clipper");
            // this.Oracle = await hre.ethers.getContractFactory("ETHxOracle");

            // let x = await upgrades.deployProxy(this.MasterVault, ["MasterVault Token", "MVT", 0, "0xDcEe70654261AF21C44c093C300eD3Bb97b78192"], {initializer: "initialize"});
            // await x.deployed();

            // let o = await upgrades.deployProxy(this.Oracle, ["0x253c22c654D9252deFcfA1f677Cbd3aE91eD1aec", x.address], {initializer: "initialize"});
            // await o.deployed();

            // let o = await ethers.getContractAt("OETHOracle", "0x64287e53C86aca461bf894330c1Db4B60e8eB756")
            let dCol = await ethers.getContractAt("dCol", "0x456554374e5e9bF91a32E35d9dAA03d37357E41A");
            await dCol.initialize();

            // console.log(await o.peek())

        //     ilk = ethers.utils.formatBytes32String("MVT_wcUSDC");

        //     // wcUSDC = await upgrades.deployProxy(this.WrappedWcUSDCv3, ["Wrapped cUSDC v3", "wcUSDCv3", "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf"], {initializer: "initialize"});
        //     // await wcUSDC.deployed();
        //     wcUSDC = await ethers.getContractAt("WcUSDCv3_2", "0xe148C9fC6Cb7E968BfF86Ec9A6a881662d8ED9bb");
        //     // newImp1 = await (await this.WrappedWcUSDCv3.deploy()).deployed();
        //     // let proxyAdmin1 = await ethers.getContractAt(["function upgrade(address,address) external"], "0xa88b54e6b76fb97cdb8ecae868f1458e18a953f4");
        //     // await proxyAdmin1.connect(deployer).upgrade(wcUSDC.address, newImp1.address);

        //     // masterVault = await upgrades.deployProxy(this.MasterVault, ["MasterVault Token", "MVT", 0, wcUSDC.address], {initializer: "initialize"});
        //     // await masterVault.deployed();
            // masterVault = await ethers.getContractAt("MasterVault_V2", "0xC5A7bEB1E6c61B3Aa8dF5aD32a17eb5e9B974B98");

        //     // dMatic = await upgrades.deployProxy(this.DMatic, [], {initializer: "initialize"});
        //     // await dMatic.deployed();
        //     dMatic = await ethers.getContractAt("dCol", "0x624D6A1969CeF4ff7b880685E76019509f3c0b49");

        //     // davosProvider = await upgrades.deployProxy(this.DavosProvider, [wcUSDC.address, dMatic.address, masterVault.address, interaction.address, false], {initializer: "initialize"});
        //     // await davosProvider.deployed();
        //     davosProvider = await ethers.getContractAt("DavosProvider", "0x601ab2230C2f7B8E719A0111FebDfa94bB462c69");
        //     // newImp = await (await this.DavosProvider.deploy()).deployed();
        //     // let proxyAdmin = await ethers.getContractAt(["function upgrade(address,address) external"], "0xa88b54e6b76fb97cdb8ecae868f1458e18a953f4");
        //     // await proxyAdmin.connect(deployer).upgrade(davosProvider.address, newImp.address);
        //     // await davosProvider.connect(deployer).changeCusdc("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
            
        //     // gemJoin = await upgrades.deployProxy(this.GemJoin, [vat.address, ilk, masterVault.address], {initializer: "initialize"});
        //     // await gemJoin.deployed();
        //     gemJoin = await ethers.getContractAt("GemJoin", "0x87B3c773d6DD8Fc3a5b8FB96217031F226f0A5a9");

        //     // clip = await upgrades.deployProxy(this.Clip, [vat.address, spot.address, dog.address, ilk], {initializer: "initialize"});
        //     // await clip.deployed();
        //     clip = await ethers.getContractAt("Clipper", "0xc5a7344461EEc05e174aa8AC4e4030b24aA02EBD");

        //     // oracle = await upgrades.deployProxy(this.Oracle, ["0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3", wcUSDC.address, masterVault.address, ra.address], {initializer: "initialize"});
        //     // await oracle.deployed();
        //     oracle = await ethers.getContractAt("WCUSDCOracle", "0x122897d16b2Dd5a193EFCe19A1B4f34d1C540118");
        });
        it('tests', async function () {
            this.timeout(150000000);
            ra = await ethers.getContractAt("RatioAdapter", "0xd199260f2152fc65E35aC4950CC6a2D3D5f5412E");

            await ra.connect(deployer).setToken("0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38", "", "", "getRate()", true);
            await ra.connect(deployer).setProviderForToken("0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38", "0x8023518b2192FB5384DAdc596765B3dD1cdFe471");
            // console.log(await ra.toValue("0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38", "1000000000000000000"))

            // let x = await this.M

        //     // // Init Collateral
        //     // console.log("MasterVault_V2 init...");
        //     // await masterVault.connect(deployer).changeProvider(davosProvider.address);
        //     // await masterVault.connect(deployer).changeAdapter(ra.address);
        //     await masterVault.connect(deployer).changeYieldHeritor(receiver.address);
        //     await masterVault.connect(deployer).changeYieldMargin("10000"); // Uncomment to get 100% yield

        //     // console.log("Ratioadapter init...");
        //     // await ra.connect(deployer).setToken(wcUSDC.address, "convertToAssets(uint256)", "convertToShares(uint256)", "", false);

        //     // console.log("DMatic init...");
        //     // await dMatic.connect(deployer).changeMinter(davosProvider.address);

        //     // console.log("Vat init...");
        //     // await vat.connect(deployer).rely(gemJoin.address);
        //     // await vat.connect(deployer).rely(clip.address);
        //     // await vat.connect(deployer)["file(bytes32,bytes32,uint256)"](ilk, ethers.utils.formatBytes32String("line"), _vat_line + rad);
        //     // await vat.connect(deployer)["file(bytes32,bytes32,uint256)"](ilk, ethers.utils.formatBytes32String("dust"), _vat_dust + rad);
            
        //     // console.log("Gemjoin init...");
        //     // await gemJoin.connect(deployer).rely(interaction.address);

        //     // console.log("Dog init...");
        //     // await dog.connect(deployer).rely(clip.address);
        //     // await dog.connect(deployer)["file(bytes32,bytes32,uint256)"](ilk, ethers.utils.formatBytes32String("hole"), _dog_hole + rad);
        //     // await dog.connect(deployer)["file(bytes32,bytes32,uint256)"](ilk, ethers.utils.formatBytes32String("chop"), _dog_chop);
        //     // await dog.connect(deployer)["file(bytes32,bytes32,address)"](ilk, ethers.utils.formatBytes32String("clip"), clip.address);

        //     // console.log("Clip init...");
        //     // await clip.connect(deployer).rely(interaction.address);
        //     // await clip.connect(deployer).rely(dog.address);
        //     // await clip.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("buf"), _clip_buf);// 10%
        //     // await clip.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tail"), _clip_tail);// 3H reset time
        //     // await clip.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("cusp"), _clip_cusp);// 60% reset ratio
        //     // await clip.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("chip"), _clip_chip);// 0.01% vow incentive
        //     // await clip.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tip"), _clip_tip + rad);// 10$ flat incentive
        //     // await clip.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("stopped"), _clip_stopped);
        //     // await clip.connect(deployer)["file(bytes32,address)"](ethers.utils.formatBytes32String("spotter"), spot.address);
        //     // await clip.connect(deployer)["file(bytes32,address)"](ethers.utils.formatBytes32String("dog"), dog.address);
        //     // await clip.connect(deployer)["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address);
        //     // await clip.connect(deployer)["file(bytes32,address)"](ethers.utils.formatBytes32String("calc"), "0x74FB5adf4eBA704c42f5974B83E53BBDA46F0C96");

        //     // console.log("Spot init...");
        //     // // await spot.connect(deployer)["file(bytes32,bytes32,address)"](ilk, ethers.utils.formatBytes32String("pip"), oracle);

        //     // console.log("Interaction init...");
        //     // await interaction.connect(deployer).setDavosProvider(masterVault.address, davosProvider.address);
        //     // await interaction.connect(deployer).setCollateralType(masterVault.address, gemJoin.address, ilk, clip.address, _mat);
        //     // // await interaction.connect(deployer).poke(masterVault.address, {gasLimit: 300000});
        //     // await interaction.connect(deployer).drip(masterVault.address, {gasLimit: 200000});
        //     // await interaction.connect(deployer).setCollateralDuty(masterVault.address, _jug_duty, {gasLimit: 250000});
            
        //     // usdc: 

        //     let usdc = await ethers.getContractAt(["function transfer(address,uint256) external"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831");

        //     await usdc.connect(usdcOwner).transfer(signer.address, "1000000");
        //     await usdc.connect(usdcOwner).transfer(signer2.address, "1000000");
        //     await usdc.connect(usdcOwner).transfer(signer3.address, "1000000");
        //     await usdc.connect(usdcOwner).transfer(civilian.address, "300000000000");

        //     usdc = await ethers.getContractAt(["function approve(address,uint256) external"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831");

        //     await usdc.connect(signer).approve("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "1000000");
        //     await usdc.connect(signer2).approve("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "1000000");
        //     await usdc.connect(signer3).approve("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "1000000");
        //     await usdc.connect(civilian).approve("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "300000000000");

        //     // console.log("Signer USDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))

        //     cusdc = await ethers.getContractAt(["function supply(address,uint) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");

        //     console.log("_______BEFORE SUPPLY_____");
        //     let util = await(await ethers.getContractAt(["function getUtilization() external view returns (uint)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getUtilization();
        //     console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
        //     console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
        //     console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
        //     console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("ORACLE       : " + await oracle.peek());

        //     // console.log("Utilizatio: " + util);
        //     // console.log("SupplyRate: " + await (await ethers.getContractAt(["function getSupplyRate(uint) external view returns (uint64)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getSupplyRate(util));
        //     await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer.address);
        //     let x = await ethers.provider.getStorageAt("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", 0)
        //     console.log("BASESUPPLYINDEX: " + x)

        //     await cusdc.connect(signer).supply(usdc.address, "1000000");
        //     await cusdc.connect(signer2).supply(usdc.address, "1000000");
        //     await cusdc.connect(signer3).supply(usdc.address, "1000000");

        //     console.log("_______AFTER SUPPLY_____");
        //     util = await(await ethers.getContractAt(["function getUtilization() external view returns (uint)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getUtilization();
        //     console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
        //     console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
        //     console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
        //     console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("ORACLE       : " + await oracle.peek());
        //     // console.log("Utilizatio: " + util);
        //     // console.log("SupplyRate: " + await (await ethers.getContractAt(["function getSupplyRate(uint) external view returns (uint64)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getSupplyRate(util));
        //     // console.log("Total  cUSDC BAL: " + await (await ethers.getContractAt(["function totalSupply() external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).totalSupply())
        //     // console.log("Signer cUSDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer.address);
        //     x = await ethers.provider.getStorageAt("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", 0)
        //     console.log("BASESUPPLYINDEX: " + x)
            
        //     await network.provider.send("evm_increaseTime", [86400])
        //     await cusdc.connect(civilian).supply(usdc.address, "100000000000");

        //     console.log("_______CIVILIAN SUPPLY_____");
        //     console.log("Civilian cUSDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(civilian.address))
        //     await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer.address);
        //     util = await(await ethers.getContractAt(["function getUtilization() external view returns (uint)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getUtilization();
        //     console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
        //     console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
        //     console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
        //     console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("ORACLE       : " + await oracle.peek());
        //     // console.log("Utilizatio: " + util);
        //     // console.log("SupplyRate: " + await (await ethers.getContractAt(["function getSupplyRate(uint) external view returns (uint64)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getSupplyRate(util));
        //     // console.log("Signer USDC  BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], usdc.address)).balanceOf(signer.address))
        //     // console.log("Total  cUSDC BAL: " + await (await ethers.getContractAt(["function totalSupply() external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).totalSupply())
        //     // console.log("Signer cUSDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))

        //     x = await ethers.provider.getStorageAt("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", 0)
        //     console.log("BASESUPPLYINDEX: " + x)
            
        //     console.log("_______WRAPPED cUSDCv3_____")
        //     cusdc = await ethers.getContractAt(["function approve(address,uint256) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");

        //     await cusdc.connect(signer).approve(davosProvider.address, MAX);
        //     await cusdc.connect(signer2).approve(davosProvider.address, MAX);
        //     await cusdc.connect(signer3).approve(davosProvider.address, MAX);
            
        //     // await wcUSDC.connect(signer).deposit("1000366", signer.address);
        //     // await wcUSDC.connect(signer2).deposit("1000366", signer2.address);
        //     // await wcUSDC.connect(signer3).deposit("1000366", signer3.address);

        //     console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
        //     console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
        //     console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
        //     console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
        //     console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
        //     console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
        //     console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))
        //     console.log("----")
        //     console.log("ORACLE       : " + await oracle.peek());
            
        //     cusdc = await ethers.getContractAt(["function supply(address,uint) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
        //     await network.provider.send("evm_increaseTime", [86400])
        //     await cusdc.connect(civilian).supply(usdc.address, "100000000000");

        //     console.log("_______CIVILIAN SUPPLY X2_____");
        //     console.log("Civilian cUSDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(civilian.address))
        //     await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer.address);

        //     console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
        //     console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
        //     console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
        //     console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
        //     console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
        //     console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
        //     console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))
        //     console.log("----")
        //     console.log("ORACLE       : " + await oracle.peek());

        //     // Provide to davosProvider
        //     // await wcUSDC.connect(signer).approve(davosProvider.address, MAX);
        //     // await wcUSDC.connect(signer2).approve(davosProvider.address, MAX);
        //     // await wcUSDC.connect(signer3).approve(davosProvider.address, MAX);

        //     await davosProvider.connect(signer).wrapAndProvide("1000296");
        //     await davosProvider.connect(signer2).wrapAndProvide("1000296");
        //     await davosProvider.connect(signer3).wrapAndProvide("1000296");

        //     console.log("_________PROVIDE_________")
        //     console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
        //     console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
        //     console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
        //     console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
        //     console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
        //     console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer    Ink  : " + (await vat.urns(ilk, signer.address)).ink)
        //     console.log("Signer2   Ink  : " + (await vat.urns(ilk, signer2.address)).ink)
        //     console.log("Signer3   Ink  : " + (await vat.urns(ilk, signer3.address)).ink)
        //     console.log("----")
        //     console.log("ORACLE       : " + await oracle.peek());

        //     console.log("MasterVault  wcUSDC: " + await wcUSDC.balanceOf(masterVault.address))
        //     console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))

        //     await network.provider.send("evm_increaseTime", [86400])
        //     await cusdc.connect(civilian).supply(usdc.address, "100000000000");

        //     console.log("_______CIVILIAN SUPPLY X3_____");
        //     console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
        //     console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
        //     console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
        //     console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
        //     console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
        //     console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer    Ink  : " + (await vat.urns(ilk, signer.address)).ink)
        //     console.log("Signer2   Ink  : " + (await vat.urns(ilk, signer2.address)).ink)
        //     console.log("Signer3   Ink  : " + (await vat.urns(ilk, signer3.address)).ink)
        //     console.log("----")
        //     console.log("ORACLE       : " + await oracle.peek());

        //     console.log("MasterVault  wcUSDC: " + await wcUSDC.balanceOf(masterVault.address))
        //     console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))

        //     await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer.address);
        //     await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer2.address);
        //     await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer3.address);

        //     await davosProvider.connect(signer).releaseAndUnwrap(signer.address, "981345000000000000");
        //     await davosProvider.connect(signer2).releaseAndUnwrap(signer2.address, "981344000000000000");
        //     await davosProvider.connect(signer3).releaseAndUnwrap(signer3.address, "981344000000000000");

        //     console.log("_________RELEASE_________")
        //     console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
        //     console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
        //     console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
        //     console.log("YieldHeritor USDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(receiver.address))
        //     console.log("----")
        //     console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
        //     console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
        //     console.log("YieldHeritor cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(receiver.address))
        //     console.log("----")
        //     console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
        //     console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
        //     console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
        //     console.log("YieldHeritor wcUSDC: " + await wcUSDC.balanceOf(receiver.address))
        //     console.log("----")
        //     console.log("Signer    Ink  : " + (await vat.urns(ilk, signer.address)).ink)
        //     console.log("Signer2   Ink  : " + (await vat.urns(ilk, signer2.address)).ink)
        //     console.log("Signer3   Ink  : " + (await vat.urns(ilk, signer3.address)).ink)
        //     console.log("----")
        //     console.log("ORACLE       : " + await oracle.peek());

        //     console.log("MasterVault  wcUSDC: " + await wcUSDC.balanceOf(masterVault.address))
        //     console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))

        //     // await wcUSDC.connect(signer).redeem("983171", signer.address, signer.address);
        //     // await wcUSDC.connect(signer2).redeem("983170", signer2.address, signer2.address);
        //     // await wcUSDC.connect(signer3).redeem("983171", signer3.address, signer3.address);
        //     await wcUSDC.connect(receiver).redeem("369", receiver.address, receiver.address);

        //     console.log("_______UNWRAPPED cUSDCv3_____")
        //     console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
        //     console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
        //     console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
        //     console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
        //     console.log("YieldHeritor cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(receiver.address))
        //     console.log("----")
        //     console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
        //     console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
        //     console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer    Ink  : " + (await vat.urns(ilk, signer.address)).ink)
        //     console.log("Signer2   Ink  : " + (await vat.urns(ilk, signer2.address)).ink)
        //     console.log("Signer3   Ink  : " + (await vat.urns(ilk, signer3.address)).ink)
        //     console.log("----")
        //     console.log("ORACLE       : " + await oracle.peek());

        //     console.log("MasterVault  wcUSDC: " + await wcUSDC.balanceOf(masterVault.address))
        //     console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))

        //     cusdc = await ethers.getContractAt(["function withdraw(address,uint) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
        //     await cusdc.connect(signer).withdraw(usdc.address, "1000291")
        //     await cusdc.connect(signer2).withdraw(usdc.address, "1000291")
        //     await cusdc.connect(signer3).withdraw(usdc.address, "1000292")
        //     await cusdc.connect(receiver).withdraw(usdc.address, "374")

        //     console.log("_______GET USDC_____")
        //     console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
        //     console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
        //     console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
        //     console.log("YieldHeritor USDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(receiver.address))

        //     console.log("----")
        //     console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        //     console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
        //     console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
        //     console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
        //     console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
        //     console.log("----")
        //     console.log("Signer    Ink  : " + (await vat.urns(ilk, signer.address)).ink)
        //     console.log("Signer2   Ink  : " + (await vat.urns(ilk, signer2.address)).ink)
        //     console.log("Signer3   Ink  : " + (await vat.urns(ilk, signer3.address)).ink)
        //     console.log("----")
        //     console.log("ORACLE       : " + await oracle.peek());

        //     console.log("MasterVault  wcUSDC: " + await wcUSDC.balanceOf(masterVault.address))
        //     console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))


            // console.log(await ra.toValue(wcUSDC.address, "1000290000000000000"));
            // console.log(await ra.fromValue(wcUSDC.address, "1000000"));

            // function deposit(uint256 assets, address receiver)
            // function redeem(uint256 shares, address receiver, address owner)
            
            
            
            // cusdc = await ethers.getContractAt(["function withdraw(address,uint) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
            
            // await cusdc.connect(signer).withdraw(usdc.address, "1000290");

            // console.log("_______AFTER WITHDRAW_______");
            // util = await(await ethers.getContractAt(["function getUtilization() external view returns (uint)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getUtilization();
            // console.log("Utilizatio: " + util);
            // console.log("SupplyRate: " + await (await ethers.getContractAt(["function getSupplyRate(uint) external view returns (uint64)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getSupplyRate(util));
            // console.log("Signer USDC  BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], usdc.address)).balanceOf(signer.address))
            // console.log("Total  cUSDC BAL: " + await (await ethers.getContractAt(["function totalSupply() external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).totalSupply())
            // console.log("Signer cUSDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
        });
    });
});




















// const ether = require('@openzeppelin/test-helpers/src/ether');
// const { expect } = require('chai');
// const { BigNumber } = require('ethers');
// const { joinSignature } = require('ethers/lib/utils');
// const { ethers, network } = require('hardhat');
// const Web3 = require('web3');

// let wad = "000000000000000000", // 18 Decimals
//     ray = "000000000000000000000000000", // 27 Decimals
//     rad = "000000000000000000000000000000000000000000000", // 45 Decimals
//     ONE = 10 ** 27;

// let { _dog_hole, _dog_chop, _clip_buf, _clip_tail, _clip_cusp, _clip_chip, _clip_tip, _clip_stopped, _vat_line, _vat_dust, _jug_duty, _mat} = require(`../scripts/collateral/config_bsc.json`);

// let interaction;
// let vat;
// let dog;
// let spot;
// let vow;
// let ra;

// let wcUSDC, masterVault, dMatic, davosProvider, gemJoin, clip;

// let oracle;

// let ilk;

// let cusdc;
// let usdc;

// let cusdcOwner;
// let usdcOwner;

// describe('===FORK===', function () {
//     let signer, signer2, signer3, deployer, civilian, receiver;
//     const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
//     const MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

//     beforeEach(async function () {
//         [deployer] = await ethers.getSigners();

//         await network.provider.request({
//             method: "hardhat_reset",
//             params: [
//             {
//                 forking: {
//                 jsonRpcUrl: "https://rpc.ankr.com/arbitrum",
//                 blockNumber: 159688773
//                 },
//             },
//             ],
//         });

//         console.log("Initializing...");

//         await hre.network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: ["0xE68Ee8A12c611fd043fB05d65E1548dC1383f2b9"],
//         });
//         usdcOwner = await ethers.getSigner("0xE68Ee8A12c611fd043fB05d65E1548dC1383f2b9")
//         await network.provider.send("hardhat_setBalance", [
//             "0xE68Ee8A12c611fd043fB05d65E1548dC1383f2b9",
//             "0x10000000000000000000",
//         ]);

//         await hre.network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: ["0x7D569Dd7053E169d026a137491628130064934cD"],
//         });
//         civilian = await ethers.getSigner("0x7D569Dd7053E169d026a137491628130064934cD")
//         await network.provider.send("hardhat_setBalance", [
//             "0x7D569Dd7053E169d026a137491628130064934cD",
//             "0x10000000000000000000",
//         ]);

//         await hre.network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: ["0x2850C2929B33BCE33b8aa81B0A9D1d3632118896"],
//         });
//         signer = await ethers.getSigner("0x2850C2929B33BCE33b8aa81B0A9D1d3632118896")
//         await network.provider.send("hardhat_setBalance", [
//             "0x2850C2929B33BCE33b8aa81B0A9D1d3632118896",
//             "0x10000000000000000000",
//         ]);
        
//         await hre.network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: ["0x9126BC45A20076Eb9f65dE83C18bd3d618759Fc4"],
//         });
//         signer2 = await ethers.getSigner("0x9126BC45A20076Eb9f65dE83C18bd3d618759Fc4")
//         await network.provider.send("hardhat_setBalance", [
//             "0x9126BC45A20076Eb9f65dE83C18bd3d618759Fc4",
//             "0x10000000000000000000",
//         ]);

//         await hre.network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: ["0x6c5BEf6E55a8663f41a05BB1Bc66ABEC24e892D0"],
//         });
//         signer3 = await ethers.getSigner("0x6c5BEf6E55a8663f41a05BB1Bc66ABEC24e892D0")
//         await network.provider.send("hardhat_setBalance", [
//             "0x6c5BEf6E55a8663f41a05BB1Bc66ABEC24e892D0",
//             "0x10000000000000000000",
//         ]);

//         await hre.network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: ["0x39355FFAfC47E54E7d7e786b1Df0fa0e222FBd06"],
//         });
//         deployer = await ethers.getSigner("0x39355FFAfC47E54E7d7e786b1Df0fa0e222FBd06")
//         await network.provider.send("hardhat_setBalance", [
//             "0x39355FFAfC47E54E7d7e786b1Df0fa0e222FBd06",
//             "0x10000000000000000000",
//         ]);

//         await hre.network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: ["0x73CF7cC1778a60d43Ca2833F419B77a76177156A"],
//         });
//         receiver = await ethers.getSigner("0x73CF7cC1778a60d43Ca2833F419B77a76177156A")
//         await network.provider.send("hardhat_setBalance", [
//             "0x73CF7cC1778a60d43Ca2833F419B77a76177156A",
//             "0x10000000000000000000",
//         ]);
//     });

//     describe('-', function () {
//         beforeEach(async function () {

//             // Init Base
//             this.Interaction = await hre.ethers.getContractFactory("Interaction", {
//                 unsafeAllow: ['external-library-linking'],
//                 libraries: {
//                     AuctionProxy: "0x1c539E755A1BdaBB168aA9ad60B31548991981F9"
//                 }
//             });
//             interaction = await this.Interaction.attach("0xa48F322F8b3edff967629Af79E027628b9Dd1298");

//             vat = await ethers.getContractAt("Vat", "0x2304CE6B42D505141A286B7382d4D515950b1890");
//             dog = await ethers.getContractAt("Dog", "0xa0CF627D429F35411820590D72eBaD183FD61C33");
//             spot = await ethers.getContractAt("Spotter", "0x819d1Daa794c1c46B841981b61cC978d95A17b8e");
//             vow = await ethers.getContractAt("Vow", "0xe84d3029feDd3CbE3d30c5245679CBD9B30118bC");
//             ra = await ethers.getContractAt("RatioAdapter", "0x42459761f3e0f8a1Adca056Edfeab30f1Eb2Cd71");

//             // Deploy Collateral
//             this.WrappedWcUSDCv3 = await hre.ethers.getContractFactory("WcUSDCv3");
//             this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
//             this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
//             this.DMatic = await hre.ethers.getContractFactory("dCol");
//             this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
//             this.Clip = await hre.ethers.getContractFactory("Clipper");
//             this.Oracle = await hre.ethers.getContractFactory("CTokenOracle");

//             ilk = ethers.utils.formatBytes32String("MVT_cUSDC");

//             wcUSDC = await upgrades.deployProxy(this.WrappedWcUSDCv3, ["Wrapped cUSDC v3", "wcUSDCv3", "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf"], {initializer: "initialize"});
//             await wcUSDC.deployed();

//             masterVault = await upgrades.deployProxy(this.MasterVault, ["MasterVault Token", "MVT", 0, wcUSDC.address], {initializer: "initialize"});
//             await masterVault.deployed();

//             dMatic = await upgrades.deployProxy(this.DMatic, [], {initializer: "initialize"});
//             await dMatic.deployed();

//             davosProvider = await upgrades.deployProxy(this.DavosProvider, [wcUSDC.address, dMatic.address, masterVault.address, interaction.address, false], {initializer: "initialize"});
//             await davosProvider.deployed();

//             gemJoin = await upgrades.deployProxy(this.GemJoin, [vat.address, ilk, masterVault.address], {initializer: "initialize"});
//             await gemJoin.deployed();

//             clip = await upgrades.deployProxy(this.Clip, [vat.address, spot.address, dog.address, ilk], {initializer: "initialize"});
//             await clip.deployed();

//             let oracle = await upgrades.deployProxy(this.Oracle, [NULL_ADDRESS, NULL_ADDRESS, masterVault.address, ra.address], {initializer: "initialize"});
//             await oracle.deployed();
//         });
//         it('tests', async function () {
//             this.timeout(150000000);

//             // Init Collateral
//             console.log("MasterVault_V2 init...");
//             await masterVault.changeProvider(davosProvider.address);
//             await masterVault.changeAdapter(ra.address);
//             await masterVault.changeYieldHeritor(receiver.address);
//             // await masterVault.changeYieldMargin("10000"); // Uncomment to get 100% yield

//             console.log("Ratioadapter init...");
//             await ra.connect(deployer).setToken(wcUSDC.address, "convertToAssets(uint256)", "convertToShares(uint256)", "", false);

//             console.log("DMatic init...");
//             await dMatic.changeMinter(davosProvider.address);

//             console.log("Vat init...");
//             await vat.connect(deployer).rely(gemJoin.address);
//             await vat.connect(deployer).rely(clip.address);
//             await vat.connect(deployer)["file(bytes32,bytes32,uint256)"](ilk, ethers.utils.formatBytes32String("line"), _vat_line + rad);
//             await vat.connect(deployer)["file(bytes32,bytes32,uint256)"](ilk, ethers.utils.formatBytes32String("dust"), _vat_dust + rad);
            
//             console.log("Gemjoin init...");
//             await gemJoin.rely(interaction.address);

//             console.log("Dog init...");
//             await dog.connect(deployer).rely(clip.address);
//             await dog.connect(deployer)["file(bytes32,bytes32,uint256)"](ilk, ethers.utils.formatBytes32String("hole"), _dog_hole + rad);
//             await dog.connect(deployer)["file(bytes32,bytes32,uint256)"](ilk, ethers.utils.formatBytes32String("chop"), _dog_chop);
//             await dog.connect(deployer)["file(bytes32,bytes32,address)"](ilk, ethers.utils.formatBytes32String("clip"), clip.address);

//             console.log("Clip init...");
//             await clip.rely(interaction.address);
//             await clip.rely(dog.address);
//             await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("buf"), _clip_buf);// 10%
//             await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tail"), _clip_tail);// 3H reset time
//             await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("cusp"), _clip_cusp);// 60% reset ratio
//             await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("chip"), _clip_chip);// 0.01% vow incentive
//             await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tip"), _clip_tip + rad);// 10$ flat incentive
//             await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("stopped"), _clip_stopped);
//             await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("spotter"), spot.address);
//             await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("dog"), dog.address);
//             await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address);
//             await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("calc"), "0x74FB5adf4eBA704c42f5974B83E53BBDA46F0C96");

//             console.log("Spot init...");
//             // await spot.connect(deployer)["file(bytes32,bytes32,address)"](ilk, ethers.utils.formatBytes32String("pip"), oracle);

//             console.log("Interaction init...");
//             await interaction.connect(deployer).setDavosProvider(masterVault.address, davosProvider.address);
//             await interaction.connect(deployer).setCollateralType(masterVault.address, gemJoin.address, ilk, clip.address, _mat);
//             // await interaction.connect(deployer).poke(masterVault.address, {gasLimit: 300000});
//             await interaction.connect(deployer).drip(masterVault.address, {gasLimit: 200000});
//             await interaction.connect(deployer).setCollateralDuty(masterVault.address, _jug_duty, {gasLimit: 250000});
            
//             // usdc: 

//             let usdc = await ethers.getContractAt(["function transfer(address,uint256) external"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831");

//             await usdc.connect(usdcOwner).transfer(signer.address, "1000000");
//             await usdc.connect(usdcOwner).transfer(signer2.address, "1000000");
//             await usdc.connect(usdcOwner).transfer(signer3.address, "1000000");
//             await usdc.connect(usdcOwner).transfer(civilian.address, "300000000000");

//             usdc = await ethers.getContractAt(["function approve(address,uint256) external"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831");

//             await usdc.connect(signer).approve("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "1000000");
//             await usdc.connect(signer2).approve("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "1000000");
//             await usdc.connect(signer3).approve("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "1000000");
//             await usdc.connect(civilian).approve("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", "300000000000");

//             // console.log("Signer USDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))

//             cusdc = await ethers.getContractAt(["function supply(address,uint) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");

//             console.log("_______BEFORE SUPPLY_____");
//             let util = await(await ethers.getContractAt(["function getUtilization() external view returns (uint)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getUtilization();
//             console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
//             console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
//             console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
//             console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))

//             // console.log("Utilizatio: " + util);
//             // console.log("SupplyRate: " + await (await ethers.getContractAt(["function getSupplyRate(uint) external view returns (uint64)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getSupplyRate(util));
//             await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer.address);
//             let x = await ethers.provider.getStorageAt("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", 0)
//             console.log("BASESUPPLYINDEX: " + x)

//             await cusdc.connect(signer).supply(usdc.address, "1000000");
//             await cusdc.connect(signer2).supply(usdc.address, "1000000");
//             await cusdc.connect(signer3).supply(usdc.address, "1000000");

//             console.log("_______AFTER SUPPLY_____");
//             util = await(await ethers.getContractAt(["function getUtilization() external view returns (uint)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getUtilization();
//             console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
//             console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
//             console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
//             console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
//             // console.log("Utilizatio: " + util);
//             // console.log("SupplyRate: " + await (await ethers.getContractAt(["function getSupplyRate(uint) external view returns (uint64)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getSupplyRate(util));
//             // console.log("Total  cUSDC BAL: " + await (await ethers.getContractAt(["function totalSupply() external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).totalSupply())
//             // console.log("Signer cUSDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer.address);
//             x = await ethers.provider.getStorageAt("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", 0)
//             console.log("BASESUPPLYINDEX: " + x)
            
//             await network.provider.send("evm_increaseTime", [86400])
//             await cusdc.connect(civilian).supply(usdc.address, "100000000000");

//             console.log("_______CIVILIAN SUPPLY_____");
//             console.log("Civilian cUSDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(civilian.address))
//             await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer.address);
//             util = await(await ethers.getContractAt(["function getUtilization() external view returns (uint)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getUtilization();
//             console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
//             console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
//             console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
//             console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
//             // console.log("Utilizatio: " + util);
//             // console.log("SupplyRate: " + await (await ethers.getContractAt(["function getSupplyRate(uint) external view returns (uint64)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getSupplyRate(util));
//             // console.log("Signer USDC  BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], usdc.address)).balanceOf(signer.address))
//             // console.log("Total  cUSDC BAL: " + await (await ethers.getContractAt(["function totalSupply() external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).totalSupply())
//             // console.log("Signer cUSDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))

//             x = await ethers.provider.getStorageAt("0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf", 0)
//             console.log("BASESUPPLYINDEX: " + x)
            
//             console.log("_______WRAPPED cUSDCv3_____")
//             cusdc = await ethers.getContractAt(["function approve(address,uint256) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");

//             await cusdc.connect(signer).approve(wcUSDC.address, MAX);
//             await cusdc.connect(signer2).approve(wcUSDC.address, MAX);
//             await cusdc.connect(signer3).approve(wcUSDC.address, MAX);
            
//             await wcUSDC.connect(signer).deposit("1000290", signer.address);
//             await wcUSDC.connect(signer2).deposit("1000290", signer2.address);
//             await wcUSDC.connect(signer3).deposit("1000290", signer3.address);

//             console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
//             console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
//             console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
//             console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
//             console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
//             console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
//             console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))
            
//             cusdc = await ethers.getContractAt(["function supply(address,uint) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
//             await network.provider.send("evm_increaseTime", [86400])
//             await cusdc.connect(civilian).supply(usdc.address, "100000000000");

//             console.log("_______CIVILIAN SUPPLY X2_____");
//             console.log("Civilian cUSDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(civilian.address))
//             await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer.address);

//             console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
//             console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
//             console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
//             console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
//             console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
//             console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
//             console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))

//             // Provide to davosProvider
//             await wcUSDC.connect(signer).approve(davosProvider.address, MAX);
//             await wcUSDC.connect(signer2).approve(davosProvider.address, MAX);
//             await wcUSDC.connect(signer3).approve(davosProvider.address, MAX);

//             await davosProvider.connect(signer).provide("1000290000000000000");
//             await davosProvider.connect(signer2).provide("1000291000000999711");
//             await davosProvider.connect(signer3).provide("1000291500001999422");

//             console.log("_________PROVIDE_________")
//             console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
//             console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
//             console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
//             console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
//             console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
//             console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer    Ink  : " + (await vat.urns(ilk, signer.address)).ink)
//             console.log("Signer2   Ink  : " + (await vat.urns(ilk, signer2.address)).ink)
//             console.log("Signer3   Ink  : " + (await vat.urns(ilk, signer3.address)).ink)

//             console.log("MasterVault  wcUSDC: " + await wcUSDC.balanceOf(masterVault.address))
//             console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))

//             await network.provider.send("evm_increaseTime", [86400])
//             await cusdc.connect(civilian).supply(usdc.address, "100000000000");

//             console.log("_______CIVILIAN SUPPLY X3_____");
//             console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
//             console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
//             console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
//             console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
//             console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
//             console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer    Ink  : " + (await vat.urns(ilk, signer.address)).ink)
//             console.log("Signer2   Ink  : " + (await vat.urns(ilk, signer2.address)).ink)
//             console.log("Signer3   Ink  : " + (await vat.urns(ilk, signer3.address)).ink)

//             console.log("MasterVault  wcUSDC: " + await wcUSDC.balanceOf(masterVault.address))
//             console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))

//             await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer.address);
//             await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer2.address);
//             await(await ethers.getContractAt(["function accrueAccount(address) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).accrueAccount(signer3.address);

//             await davosProvider.connect(signer).release(signer.address, "1000290000000000000");
//             await davosProvider.connect(signer2).release(signer2.address, "1000291000000999711");
//             await davosProvider.connect(signer3).release(signer3.address, "1000291500001999422");

//             console.log("_________RELEASE_________")
//             console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
//             console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
//             console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
//             console.log("YieldHeritor USDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(receiver.address))
//             console.log("----")
//             console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
//             console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
//             console.log("YieldHeritor cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(receiver.address))
//             console.log("----")
//             console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
//             console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
//             console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer    Ink  : " + (await vat.urns(ilk, signer.address)).ink)
//             console.log("Signer2   Ink  : " + (await vat.urns(ilk, signer2.address)).ink)
//             console.log("Signer3   Ink  : " + (await vat.urns(ilk, signer3.address)).ink)

//             console.log("MasterVault  wcUSDC: " + await wcUSDC.balanceOf(masterVault.address))
//             console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))

//             await wcUSDC.connect(signer).redeem("1000010157878452509", signer.address, signer.address);
//             await wcUSDC.connect(signer2).redeem("1000011157599690949", signer2.address, signer2.address);
//             await wcUSDC.connect(signer3).redeem("1000011657460809886", signer3.address, signer3.address);

//             console.log("_______UNWRAPPED cUSDCv3_____")
//             console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
//             console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
//             console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
//             console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
//             console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
//             console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer    Ink  : " + (await vat.urns(ilk, signer.address)).ink)
//             console.log("Signer2   Ink  : " + (await vat.urns(ilk, signer2.address)).ink)
//             console.log("Signer3   Ink  : " + (await vat.urns(ilk, signer3.address)).ink)

//             console.log("MasterVault  wcUSDC: " + await wcUSDC.balanceOf(masterVault.address))
//             console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))

//             cusdc = await ethers.getContractAt(["function withdraw(address,uint) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
//             await cusdc.connect(signer).withdraw(usdc.address, "1000572")
//             await cusdc.connect(signer2).withdraw(usdc.address, "1000573")
//             await cusdc.connect(signer3).withdraw(usdc.address, "1000573")

//             console.log("_______GET USDC_____")
//             console.log("Signer  USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer.address))
//             console.log("Signer2 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer2.address))
//             console.log("Signer3 USDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0xaf88d065e77c8cC2239327C5EDb3A432268e5831")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer  cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//             console.log("Signer2 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer2.address))
//             console.log("Signer3 cUSDC: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer   wcUSDC: " + await wcUSDC.balanceOf(signer.address))
//             console.log("Signe2   wcUSDC: " + await wcUSDC.balanceOf(signer2.address))
//             console.log("Signer3  wcUSDC: " + await wcUSDC.balanceOf(signer3.address))
//             console.log("----")
//             console.log("Signer    Ink  : " + (await vat.urns(ilk, signer.address)).ink)
//             console.log("Signer2   Ink  : " + (await vat.urns(ilk, signer2.address)).ink)
//             console.log("Signer3   Ink  : " + (await vat.urns(ilk, signer3.address)).ink)

//             console.log("MasterVault  wcUSDC: " + await wcUSDC.balanceOf(masterVault.address))
//             console.log("Wrapper  cUSDC : " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(wcUSDC.address))









//             // console.log(await ra.toValue(wcUSDC.address, "1000290000000000000"));
//             // console.log(await ra.fromValue(wcUSDC.address, "1000000"));

//             // function deposit(uint256 assets, address receiver)
//             // function redeem(uint256 shares, address receiver, address owner)
            
            
            
//             // cusdc = await ethers.getContractAt(["function withdraw(address,uint) external"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf");
            
//             // await cusdc.connect(signer).withdraw(usdc.address, "1000290");

//             // console.log("_______AFTER WITHDRAW_______");
//             // util = await(await ethers.getContractAt(["function getUtilization() external view returns (uint)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getUtilization();
//             // console.log("Utilizatio: " + util);
//             // console.log("SupplyRate: " + await (await ethers.getContractAt(["function getSupplyRate(uint) external view returns (uint64)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).getSupplyRate(util));
//             // console.log("Signer USDC  BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], usdc.address)).balanceOf(signer.address))
//             // console.log("Total  cUSDC BAL: " + await (await ethers.getContractAt(["function totalSupply() external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).totalSupply())
//             // console.log("Signer cUSDC BAL: " + await (await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf")).balanceOf(signer.address))
//         });
//     });
// });