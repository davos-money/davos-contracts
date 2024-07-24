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
                jsonRpcUrl: "https://blast.drpc.org",
                blockNumber: 6196142
                },
            },
            ],
        });

        // ACCOUNTS
        [deployer] = await ethers.getSigners();

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x9DA9270DE0Fa48c2626EcB57154b3D72d45BC298"],
        });
        await network.provider.send("hardhat_setBalance", [
            "0x9DA9270DE0Fa48c2626EcB57154b3D72d45BC298",
            "0x10000000000000000000",
        ]);
        signer1 = await ethers.getSigner("0x9DA9270DE0Fa48c2626EcB57154b3D72d45BC298")

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x559e44572145aABf6Fdbc7E49dB92bB6e6079C66"],
        });
        await network.provider.send("hardhat_setBalance", [
            "0x559e44572145aABf6Fdbc7E49dB92bB6e6079C66",
            "0x10000000000000000000",
        ]);
        signer2 = await ethers.getSigner("0x559e44572145aABf6Fdbc7E49dB92bB6e6079C66")

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

            let _underlying = "0x333D8b480BDB25eA7Be4Dd87EEB359988CE1b30D";
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

            // let ora = await ethers.getContractFactory("WoETHOracle");
            // let oraD = await upgrades.deployProxy(ora, ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", "0xDcEe70654261AF21C44c093C300eD3Bb97b78192", "0x7E6173fE3b426755B4B961c6a7686c13E3c82883", "0xd199260f2152fc65E35aC4950CC6a2D3D5f5412E"], {initializer: "initialize"});
            // await oraD.deployed();

            // let ra = await ethers.getContractAt("RatioAdapter", "0xd199260f2152fc65E35aC4950CC6a2D3D5f5412E")
            // await ra.connect(signer1).setToken("0xDcEe70654261AF21C44c093C300eD3Bb97b78192", "convertToAssets(uint256)", "convertToShares(uint256)", "", false);

            // console.log(await ra.toValue("0xDcEe70654261AF21C44c093C300eD3Bb97b78192", "1000000000000000000"))
            // // console.log(await ra.fromValue("0x93F4d0ab6a8B4271f4a28Db399b5E30612D21116", "1017275619456958000"))
            
            // console.log(await oraD.peek())



            // console.log("MAIN====");
            // let ionUSDC = await ethers.getContractAt("Davos", "0x04c0599ae5a44757c0af6f9ec3b93da8976c150a");


            // UPGRADE
            // let factory = await ethers.getContractFactory("DavosProvider")
            // let newDp = await factory.deploy();
            // await newDp.deployed();

            let dp = await ethers.getContractAt("DavosProvider", "0x2770cB901e6d990B4F5C35E0732821eBf9d3acb7");

            // let pa = await ethers.getContractAt(["function upgrade(address,address) external"], "0x7b0e879f4860767d5e2455591ba025978ab3461f")
            // await pa.connect(signer1).upgrade(dp.address, newDp.address);

            await dp.connect(signer1).changeRToken("0x4300000000000000000000000000000000000004")

            // Test
            let rToken = await ethers.getContractAt("Davos", "0x4300000000000000000000000000000000000004");
            let nrToken = await ethers.getContractAt("Davos", "0x9D020B1697035d9d54f115194c9e04a1e4Eb9aF7");

            await rToken.connect(signer2).transfer(signer3.address, "100000000000000000000");
            await rToken.connect(signer3).approve(dp.address, "100000000000000000000");

            console.log("Provide");
            // console.log(await rToken.balanceOf(signer3.address));
            await dp.connect(signer3).wrapAndProvide("100000000000000000000"); // fuzz this amount
            // console.log(await rToken.balanceOf(signer3.address));

            let dcol = await ethers.getContractAt("dCol", "0x8d7afbe930f36519DF580aAF45C31cAa470731F4")
            let mv = await ethers.getContractAt("MasterVault_V2", "0xF41f47eeB7379837D87Af0C32DB76E5925b8555e")
            console.log(await nrToken.balanceOf(mv.address)) 
            console.log(await dcol.balanceOf(signer3.address))
            console.log(await rToken.balanceOf(signer3.address));
            console.log(await nrToken.balanceOf(signer3.address));

            console.log("Release")
            await dp.connect(signer3).releaseAndUnwrap(signer3.address, "98769280637000000000")
            console.log(await nrToken.balanceOf(mv.address))
            console.log(await dcol.balanceOf(signer3.address))
            console.log(await rToken.balanceOf(signer3.address));
            console.log(await nrToken.balanceOf(signer3.address));
            console.log(await nrToken.balanceOf(dp.address));
            console.log(await rToken.balanceOf(dp.address));








            // let weth = await ethers.getContractAt(["function approve(address,uint256) external"], "0x4300000000000000000000000000000000000003")
            // let nrETH = await ethers.getContractAt(["function approve(address,uint256) external", "function wrap(uint256) external"], "0x96F6b70f8786646E0FF55813621eF4c03823139C")


            // await weth.connect(signer1).approve(nrETH.address, "2000000000000000000");
            // await nrETH.connect(signer1).wrap("1500000000000000000");

            // // nrETH = await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x96F6b70f8786646E0FF55813621eF4c03823139C")

            // // console.log(await nrETH.balanceOf(signer1.address))

            // await nrETH.connect(signer1).approve("0x9059e7bf0D97a0572b0C92aB9a788c14ACa2245C", "2000000000")

            // let dp = await ethers.getContractAt("DavosProvider", "0x9059e7bf0D97a0572b0C92aB9a788c14ACa2245C")

            // await dp.connect(signer1).provide("1000000000")

            // nrETH = await ethers.getContractAt(["function balanceOf(address) external view returns(uint256)"], "0x96F6b70f8786646E0FF55813621eF4c03823139C")
            // console.log(await nrETH.balanceOf(signer1.address))

            // let mv = await ethers.getContractAt("MasterVault_V2", "0xC09D8C9a780E79Df8b8aCFB5Ec1b9e66fA3B5724")
            // console.log(await mv.balanceOf(signer1.address))
            
            // let mv1 = await ethers.getContractAt("MasterVault_V2", "0xF41f47eeB7379837D87Af0C32DB76E5925b8555e")
            // let mv2 = await ethers.getContractAt("MasterVault_V2", "0x614D9f79ee339f696AE9303f2fF6c40300364249")

            // await mv1.connect(signer1).changeAdapter("0xbac16a2f52bfd14abB561aB702AEBcf906F41A9A")
            // await mv2.connect(signer1).changeAdapter("0xbac16a2f52bfd14abB561aB702AEBcf906F41A9A")

            // let ra = await ethers.getContractAt("RatioAdapter", "0xbac16a2f52bfd14abB561aB702AEBcf906F41A9A")

            // await ra.connect(signer1).setToken("0x9D020B1697035d9d54f115194c9e04a1e4Eb9aF7", "getStERC20ByNrERC20(uint256)", "getNrERC20ByStERC20(uint256)", "", false)
            // await ra.connect(signer1).setToken("0x96F6b70f8786646E0FF55813621eF4c03823139C", "getStERC20ByNrERC20(uint256)", "getNrERC20ByStERC20(uint256)", "", false)

            // let  o1 = await ethers.getContractAt("Oracle", "0x5A33ec018D86aFc97328B8007c3c7fA88D64356E")
            // let  o2 = await ethers.getContractAt("Oracle", "0xEF72987B4A9Af2783b7a282294F7087937faf576")

            // console.log(await ra.toValue("0x9D020B1697035d9d54f115194c9e04a1e4Eb9aF7", "1000000000"))
            // // console.log(await ra.fromValue("0x9D020B1697035d9d54f115194c9e04a1e4Eb9aF7", ""))

            // console.log(await ra.toValue("0x96F6b70f8786646E0FF55813621eF4c03823139C", "1000000000"))
            // console.log(await ra.fromValue("0x96F6b70f8786646E0FF55813621eF4c03823139C", ""))
            // await ionUSDC.connect(signer2).approve("0x3210dCdaC1DCf2619Efd6423be83Cc7B815425f2", "1000000000000000000");

            // let davosProvider = await ethers.getContractAt("DavosProvider", "0x3210dCdaC1DCf2619Efd6423be83Cc7B815425f2");
            // let dMatic = await ethers.getContractAt("Davos", "0x451A1d5f0bE601811d9e84e034C8B8D74cA242a4");

            // await davosProvider.connect(signer2).provide("1000000000000000000");

            // console.log(await ionUSDC.balanceOf("0xbfE8c19642929Ea9FfD1754e8DdAb880F05022f1"));
            // console.log(await dMatic.balanceOf(signer2.address));

            // await davosProvider.connect(signer2).release(signer1.address, "1000000000000000000");

            // console.log(await ionUSDC.balanceOf("0xbfE8c19642929Ea9FfD1754e8DdAb880F05022f1"));
            // console.log(await dMatic.balanceOf(signer2.address));
            // // let ra = await ethers.getContractAt("RatioAdapter", _ratioAdapter)
            // // await ra.connect(signer1).setToken(_underlying, '', '', 'exchangeRateCurrent()', true);
            
            // console.log("HERE")

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