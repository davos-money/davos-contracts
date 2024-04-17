const { balance } = require('@openzeppelin/test-helpers');
const ether = require('@openzeppelin/test-helpers/src/ether');
const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { joinSignature } = require('ethers/lib/utils');
const { ethers, network } = require('hardhat');
const Web3 = require('web3');

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000", // 45 Decimals
    ONE = 10 ** 27,
    NULL_ADDRESS = '0x0000000000000000000000000000000000000000',
    MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

describe('===FORK===', function () {

    // GLOBAL
    let signer1, signer2, signer3, deployer, civilian, receiver;

    beforeEach(async function () {

        // FORKING
        await network.provider.request({
            method: "hardhat_reset",
            params: [
            {
                forking: {
                jsonRpcUrl: "https://mainnet.mode.network/",
                blockNumber: 6587542
                },
            },
            ],
        });

        // ACCOUNTS
        [deployer] = await ethers.getSigners();

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xA8979dF21B6Dc13935A17F9C13ec6C82942eB9f5"],
        });
        await network.provider.send("hardhat_setBalance", [
            "0xA8979dF21B6Dc13935A17F9C13ec6C82942eB9f5",
            "0x10000000000000000000",
        ]);
        signer1 = await ethers.getSigner("0xA8979dF21B6Dc13935A17F9C13ec6C82942eB9f5")

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x044a9c43e95AA9FD28EEa25131A62b602D304F1f"],
        });
        await network.provider.send("hardhat_setBalance", [
            "0x044a9c43e95AA9FD28EEa25131A62b602D304F1f",
            "0x10000000000000000000",
        ]);
        signer2 = await ethers.getSigner("0x044a9c43e95AA9FD28EEa25131A62b602D304F1f")

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x2850C2929B33BCE33b8aa81B0A9D1d3632118896"],
        });
        await network.provider.send("hardhat_setBalance", [
            "0x2850C2929B33BCE33b8aa81B0A9D1d3632118896",
            "0x10000000000000000000",
        ]);
        signer3 = await ethers.getSigner("0x2850C2929B33BCE33b8aa81B0A9D1d3632118896")
    });

    describe('-', function () {

        it('MAIN', async function () {
            this.timeout(150000000);

            // Fetching
            this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
            this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
            this.DMatic = await hre.ethers.getContractFactory("dCol");
            this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
            this.Clip = await hre.ethers.getContractFactory("Clipper");

            // Deployment
            console.log("Deploying...");

            let _underlying = "0x2BE717340023C9e14C1Bb12cb3ecBcfd3c3fB038";
            let _vat = "0x08ABFd7DEd42CC33900d3457118eAB7fC40b71c8";
            let _spot = "0x8D575d202B7653fb2E076Be451B006626Cc31858";
            let _dog = "0xE309C0FE37D3696Cf8c13A629Dc43eAEfC077418";
            let _interaction = "0x7e426F367C40Fc6e1ec919E0a7E51fcb9a564B0F";
            let _auctionProxy = "0x67423E8a06F1a35556E56B8214cDa9A248c0fe09";
            let _ratioAdapter = "0x046B71694B3b659F491247167EDa42E0556123cf";
            let _ilk = "0x4d56545f696f6e55534443000000000000000000000000000000000000000000" // MVT_ionUSDC

            // let masterVault = await upgrades.deployProxy(this.MasterVault, ["MasterVault Token", "MVT", 0, _underlying], {initializer: "initialize"});
            // await masterVault.deployed();

            // let dMatic = await upgrades.deployProxy(this.DMatic, [], {initializer: "initialize"});
            // await dMatic.deployed();

            // let davosProvider = await upgrades.deployProxy(this.DavosProvider, [_underlying, dMatic.address, masterVault.address, _interaction, false], {initializer: "initialize"});
            // await davosProvider.deployed();

            // let gemJoin = await upgrades.deployProxy(this.GemJoin, [_vat, _ilk, masterVault.address], {initializer: "initialize"});
            // await gemJoin.deployed();

            // let clip = await upgrades.deployProxy(this.Clip, [_vat, _spot, _dog, _ilk], {initializer: "initialize"});
            // await clip.deployed();

            // this.Interaction = await hre.ethers.getContractFactory("Interaction", {
            //     unsafeAllow: ['external-library-linking'],
            //     libraries: {
            //         AuctionProxy: _auctionProxy
            //     }
            // });
            // let interactionAttached = await this.Interaction.attach(_interaction);

            // let masterVaultAt = await ethers.getContractAt("MasterVault_V2", masterVault.address);
            // let dMaticAt = await ethers.getContractAt("dCol", dMatic.address);
            // let clipAt = await ethers.getContractAt("Clipper", clip.address);
            // let gemJoinAt = await ethers.getContractAt("GemJoin", gemJoin.address);
            // let vatAt = await ethers.getContractAt("Vat", _vat);
            // let dogAt = await ethers.getContractAt("Dog", _dog);
            // let spotAt = await ethers.getContractAt("Spotter", _spot);

            // console.log("MasterVault_V2 init...");
            // await masterVaultAt.changeProvider(davosProvider.address);; console.log("1");
            // await masterVaultAt.changeYieldHeritor(signer1.address);; console.log("2");
            // await masterVaultAt.changeAdapter(_ratioAdapter);;

            // console.log("DMatic init...");
            // await dMaticAt.changeMinter(davosProvider.address);;

            // console.log("Vat init...");
            // await vatAt.connect(signer1).rely(gemJoinAt.address);; console.log("1")
            // await vatAt.connect(signer1).rely(clip.address);; console.log("2")
            // await vatAt.connect(signer1)["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("line"), "5000000" + rad);; console.log("3")
            // await vatAt.connect(signer1)["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("dust"), "100000000000000000000000000000000000000000000000");; console.log("4")
            
            // // console.log("Spot init...");
            // // await spotAt["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("pip"), _oracle);;

            // console.log("Gemjoin init...");
            // await gemJoinAt.rely(_interaction);;

            // console.log("Dog init...");
            // await dogAt.connect(signer1).rely(clip.address);; console.log("1")
            // await dogAt.connect(signer1)["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("hole"), "50000000" + rad);; console.log("2")
            // await dogAt.connect(signer1)["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("chop"), "1100000000000000000");; console.log("3")
            // await dogAt.connect(signer1)["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("clip"), clip.address);; console.log("4")

            // console.log("Clip init...");
            // await clipAt.rely(_interaction);; console.log("1")
            // await clipAt.rely(dogAt.address);; console.log("2")
            // await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("buf"), "1100000000000000000000000000");; console.log("3")// 10%
            // await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tail"), "10800");; console.log("4")// 3H reset time
            // await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("cusp"), "600000000000000000000000000");; console.log("5")// 60% reset ratio
            // await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("chip"), "100000000000000");; console.log("6")// 0.01% vow incentive
            // await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tip"), "10" + rad);; console.log("7")// 10$ flat incentive
            // await clipAt["file(bytes32,uint256)"](ethers.utils.formatBytes32String("stopped"), "0");; console.log("8")
            // await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("spotter"), _spot);; console.log("9")
            // await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("dog"), dogAt.address);; console.log("10")
            // await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), "0x29Ded4C99690968562f2D067968aA72b7d46A65D");; console.log("11")
            // await clipAt["file(bytes32,address)"](ethers.utils.formatBytes32String("calc"), "0x72112dEEb7F68B5A2629AdfB7b5830D8C06Dc8A1");; console.log("12")

            // console.log("Interaction init...");
            // await interactionAttached.connect(signer1).setDavosProvider(masterVault.address, davosProvider.address);; console.log("1")
            // await interactionAttached.connect(signer1).setCollateralType(masterVault.address, gemJoin.address, _ilk, clip.address, "1515151515151515151515151515");; console.log("2")
            // // await interactionAttached.connect(signer1).poke(masterVault.address, {gasLimit: 3000000});; console.log("3")
            // await interactionAttached.connect(signer1).drip(masterVault.address, {gasLimit: 2000000});; console.log("4")
            // await interactionAttached.connect(signer1).setCollateralDuty(masterVault.address, "1000000001622535724756171270", {gasLimit: 25000000});; console.log("5")

            console.log("MAIN====");
            let ionUSDC = await ethers.getContractAt("Davos", "0x94812F2eEa03A49869f95e1b5868C6f3206ee3D3");

            await ionUSDC.connect(signer2).approve("0xafF49343e7915532D7121dd2F31e8EB15f4bE084", "1000000");

            let davosProvider = await ethers.getContractAt("DavosProvider", "0xafF49343e7915532D7121dd2F31e8EB15f4bE084");
            let dMatic = await ethers.getContractAt("Davos", "0x5449d4358CB87a80a655f5B398677b89230CC2CE");

            await davosProvider.connect(signer2).provide("1000000");

            console.log(await ionUSDC.balanceOf("0xFdC5033b6Ef5DEDc6b5225B3Fbe3704C3F9638eE"));
            console.log(await dMatic.balanceOf(signer2.address));

            await davosProvider.connect(signer2).release(signer1.address, "1000000000000000000");

            console.log(await ionUSDC.balanceOf("0xFdC5033b6Ef5DEDc6b5225B3Fbe3704C3F9638eE"));
            console.log(await dMatic.balanceOf(signer2.address));
            // let ra = await ethers.getContractAt("RatioAdapter", _ratioAdapter)
            // await ra.connect(signer1).setToken(_underlying, '', '', 'exchangeRateCurrent()', true);
            
            console.log("HERE")
            // console.log(await ra.toValue(_underlying, "1000000000000000000"));
            // console.log(await ra.toValue(_underlying, "1000000"));
            // console.log(await ra.fromValue(_underlying, "1000000"))
            // console.log(await ra.fromValue(_underlying, "1000000"));

            // console.log("GGGGG")
            // let oracle = await upgrades.deployProxy(await ethers.getContractFactory("ionUSDCOracle"), ["0xA2aa501b19aff244D90cc15a4Cf739D2725B5729", ionUSDC.address, masterVault.address, _ratioAdapter], {initializer: "initialize"});
            // await oracle.deployed();

            // console.log(await oracle.peek())

            // console.log(await masterVault.previewRedeem("1000000000000000000"))
            // console.log(await masterVault.previewDeposit("1000000"))
        
            
        });
    });
});