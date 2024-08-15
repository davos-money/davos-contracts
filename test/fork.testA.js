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
                jsonRpcUrl: "https://rpc.ankr.com/bitlayer",
                blockNumber: 3792212
                },
            },
            ],
        });

        // ACCOUNTS
        [deployer, civilian] = await ethers.getSigners();

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x772bBC002e6FF0905B9fB3B5E12Ff1d78d4aa215"],
        });
        await network.provider.send("hardhat_setBalance", [
            "0x772bBC002e6FF0905B9fB3B5E12Ff1d78d4aa215",
            "0x10000000000000000000",
        ]);
        signer1 = await ethers.getSigner("0x772bBC002e6FF0905B9fB3B5E12Ff1d78d4aa215")

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x30800c939725fe736f9d497c9d194dbe1f2a4e6c"],
        });
        await network.provider.send("hardhat_setBalance", [
            "0x30800c939725fe736f9d497c9d194dbe1f2a4e6c",
            "0x10000000000000000000",
        ]);
        signer2 = await ethers.getSigner("0x30800c939725fe736f9d497c9d194dbe1f2a4e6c")

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x359d4104302c250f49fa35c1da2ef26589669dfd"],
        });
        await network.provider.send("hardhat_setBalance", [
            "0x359d4104302c250f49fa35c1da2ef26589669dfd",
            "0x10000000000000000000",
        ]);
        signer3 = await ethers.getSigner("0x359d4104302c250f49fa35c1da2ef26589669dfd")
    });

    describe('-', function () {

        it('MAIN', async function () {
            this.timeout(150000000);

            // let _underlying = "0x333D8b480BDB25eA7Be4Dd87EEB359988CE1b30D";
            let _vat = "0x0a2F62Fa25a19E5f860d150735D52B19eDe10273";
            let _spot = "0x9032bDa78d8fCe219fB0E95b69E54047921BB816";
            let _dog = "0xc9069E47C72C0c54F473Ca44691cF64e5C95a823";
            let _interaction = "0x925BEDd155c21B673bfD9F00e0eA23dd85d70186";
            let _auctionProxy = "0x451A1d5f0bE601811d9e84e034C8B8D74cA242a4";
            let _ilk = "0x4d56545f61426974574254430000000000000000000000000000000000000000"

            // Fetching
            this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
            this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
            this.DMatic = await hre.ethers.getContractFactory("dCol");
            this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
            this.Clip = await hre.ethers.getContractFactory("Clipper");
            this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");
            this.WAToken = await hre.ethers.getContractFactory("WAToken")
            this.Oracle = await hre.ethers.getContractFactory("WWBTCOracle");

            // Deployment
            console.log("Deploying...");

            let ra = await upgrades.deployProxy(this.RatioAdapter, [], {initializer: "initialize"});
            await ra.deployed();
            let raImp = await upgrades.erc1967.getImplementationAddress(ra.address);

            let watoken = await upgrades.deployProxy(this.WAToken, ["Wrapped Avalon wBTC", "WwBTC", "0xa984b70f7b41ee736b487d5f3d9c1e1026476ea3"], {initializer: "initialize"}); 
            await watoken.deployed();

            let _underlying = watoken.address;

            let masterVault = await upgrades.deployProxy(this.MasterVault, ["MasterVault Token", "MVT", 0, _underlying], {initializer: "initialize"}); 
            await masterVault.deployed();

            let dMatic = await upgrades.deployProxy(this.DMatic, [], {initializer: "initialize"}); 
            await dMatic.deployed();

            let davosProvider = await upgrades.deployProxy(this.DavosProvider, [_underlying, dMatic.address, masterVault.address, _interaction, false], {initializer: "initialize"}); 
            await davosProvider.deployed();

            let gemJoin = await upgrades.deployProxy(this.GemJoin, [_vat, _ilk, masterVault.address], {initializer: "initialize"}); 
            await gemJoin.deployed();

            let clip = await upgrades.deployProxy(this.Clip, [_vat, _spot, _dog, _ilk], {initializer: "initialize"}); 
            await clip.deployed();

            let oracle = await upgrades.deployProxy(this.Oracle, ["0x73AB44615772a0d31dB48A87d7F4F81a3601BceB", _underlying, masterVault.address, ra.address], {initializer: "initialize"}); 
            await oracle.deployed();

            await ra.setToken(watoken.address, "convertToAssets(uint256)", "convertToShares(uint256)", "", false);

            await masterVault.changeProvider(davosProvider.address);  console.log("1");
            await masterVault.changeYieldHeritor(signer1.address);  console.log("2");
            await masterVault.changeAdapter(ra.address);  console.log("2");

            await dMatic.changeMinter(davosProvider.address); 

            let vat = await ethers.getContractAt("Vat", "0x0a2F62Fa25a19E5f860d150735D52B19eDe10273");
            let spot = await ethers.getContractAt("Spotter", "0x9032bDa78d8fCe219fB0E95b69E54047921BB816");
            let dog = await ethers.getContractAt("Dog", "0xc9069E47C72C0c54F473Ca44691cF64e5C95a823");
            let interaction = await ethers.getContractAt("Interaction", "0x925BEDd155c21B673bfD9F00e0eA23dd85d70186");

            await vat.connect(signer1).rely(gemJoin.address);  console.log("1")
            await vat.connect(signer1).rely(clip.address);  console.log("2")
            await vat.connect(signer1)["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("line"), "5000000" + rad);  console.log("3")
            await vat.connect(signer1)["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("dust"), "1" + rad);  console.log("4")
            
            await spot.connect(signer1)["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("pip"), oracle.address); 

            await gemJoin.rely("0x925BEDd155c21B673bfD9F00e0eA23dd85d70186"); 

            await dog.connect(signer1).rely(clip.address);  console.log("1")
            await dog.connect(signer1)["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("hole"), "50000000" + rad);  console.log("2")
            await dog.connect(signer1)["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("chop"), "1100000000000000000");  console.log("3")
            await dog.connect(signer1)["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("clip"), clip.address);  console.log("4")

            await clip.rely("0x925BEDd155c21B673bfD9F00e0eA23dd85d70186");  console.log("1")
            await clip.rely("0xc9069E47C72C0c54F473Ca44691cF64e5C95a823");  console.log("2")
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("buf"), "1100000000000000000000000000");  console.log("3")// 10%
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tail"), "10800");  console.log("4")// 3H reset time
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("cusp"), "600000000000000000000000000");  console.log("5")// 60% reset ratio
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("chip"), "100000000000000");  console.log("6")// 0.01% vow incentive
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tip"), "10" + rad);  console.log("7")// 10$ flat incentive
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("stopped"), "0");  console.log("8")
            await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("spotter"), "0x9032bDa78d8fCe219fB0E95b69E54047921BB816");  console.log("9")
            await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("dog"), "0xc9069E47C72C0c54F473Ca44691cF64e5C95a823");  console.log("10")
            await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), "0x7B0E879f4860767d5e2455591Ba025978ab3461F");  console.log("11")
            await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("calc"), "0x5bF6C2a5dF522FeD9FaA17AA280510b4F78163E6");  console.log("12")

            await interaction.connect(signer1).setDavosProvider(masterVault.address, davosProvider.address);  console.log("1")
            await interaction.connect(signer1).setCollateralType(masterVault.address, gemJoin.address, _ilk, clip.address, "1515151515151515151515151515");  console.log("2")
            await interaction.connect(signer1).poke(masterVault.address, {gasLimit: 3000000});  console.log("3")
            await interaction.connect(signer1).drip(masterVault.address, {gasLimit: 2000000});  console.log("4")
            await interaction.connect(signer1).setCollateralDuty(masterVault.address, "1000000001622535724756171270", {gasLimit: 25000000});  console.log("5")

            console.log("NOW LOADING")
            console.log(await ra.toValue(watoken.address, "1000000000000000000"))
            console.log(await ra.fromValue(watoken.address, "1000000000000000000"))
            console.log(await oracle.peek())

            let wrappedTG = await ethers.getContractAt(["function depositETH(address,address,uint16) external payable"], "0x5a4247763709c251c8dA359674D5C362FDAc626D")
            // let wBTC = await ethers.getContractAt("Davos", "0xff204e2681a6fa0e2c3fade68a1b28fb90e4fc5f")
            
            // Signer1 deposits aToken
            let aToken = await ethers.getContractAt("WAToken", "0xa984b70f7b41ee736b487d5f3d9c1e1026476ea3");

            await aToken.connect(signer2).transfer(signer3.address, "200000000000000000");
            await aToken.connect(signer2).transfer(civilian.address,"200000000000000000");

            console.log(await aToken.balanceOf(signer3.address));
            console.log(await aToken.balanceOf(civilian.address));

            await aToken.connect(signer3).approve(davosProvider.address, "200000000000000000")
            await aToken.connect(civilian).approve(davosProvider.address,"200000000000000000")
            await aToken.connect(signer2).approve(davosProvider.address,  "200000000000000000")

            await davosProvider.changeAToken("0xa984b70f7b41ee736b487d5f3d9c1e1026476ea3");

            await davosProvider.connect(signer3).wrapAndProvide( "200000000000000000");
            await davosProvider.connect(civilian).wrapAndProvide("200000000000000000");
            await davosProvider.connect(signer2).wrapAndProvide( "200000000000000000");
            
            console.log("After WrapAndProvide")
            console.log(await aToken.balanceOf(signer3.address));
            console.log(await aToken.balanceOf(civilian.address));
            console.log(await aToken.balanceOf(watoken.address));
            console.log(await watoken.balanceOf(masterVault.address))
            console.log(await dMatic.balanceOf(signer3.address))
            console.log(await dMatic.balanceOf(civilian.address))
            console.log(await dMatic.balanceOf(signer2.address))

            console.log("SOMEBODY DEPOSITS")
            await wrappedTG.connect(signer2).depositETH(signer2.address, signer2.address, 0, {value: "40000000000000000000000"});
            await wrappedTG.connect(signer2).depositETH(signer2.address, signer2.address, 0, {value: "4000000000000000000000"});

            console.log(await aToken.balanceOf(signer3.address));
            console.log(await aToken.balanceOf(civilian.address));
            console.log(await aToken.balanceOf(watoken.address));

            let bal = await dMatic.balanceOf(signer3.address)
            let bal2 = await dMatic.balanceOf(civilian.address)

            await davosProvider.connect(signer3).releaseAndUnwrap(signer3.address,bal);
            await davosProvider.connect(civilian).releaseAndUnwrap(civilian.address, bal2);

            console.log("HERE")
            console.log(await aToken.balanceOf(signer3.address));
            console.log(await aToken.balanceOf(civilian.address));
            console.log(await aToken.balanceOf(watoken.address));
            console.log(await dMatic.balanceOf(signer3.address))
            console.log(await dMatic.balanceOf(civilian.address))
            console.log(await dMatic.balanceOf(signer2.address))
            // console.log("DESCEND");

            // console.log(await waToken.balanceOf(signer1.address))
            // console.log(await waToken.balanceOf(civilian.address))
            // console.log(await waToken.balanceOf(signer2.address))

            // let bal = await waToken.balanceOf(signer1.address)
            // let bal2 = await waToken.balanceOf(civilian.address)

            // await waToken.connect(signer1).redeem(bal, signer1.address, signer1.address);
            // await waToken.connect(civilian).redeem(bal2, civilian.address, civilian.address);
            // console.log(await waToken.balanceOf(signer1.address))
            // console.log(await aToken.balanceOf(signer1.address));
            // console.log(await waToken.balanceOf(civilian.address))
            // console.log(await aToken.balanceOf(civilian.address));
            // console.log(await aToken.balanceOf(waToken.address));
            // console.log(await waToken.balanceOf(signer2.address))

            // console.log("EMPTYING");
            // console.log(await aToken.balanceOf(waToken.address));
            // await waToken.connect(signer2).redeem("99999999972425314", signer2.address, signer2.address);

            // console.log(await waToken.balanceOf(signer2.address))
            // console.log(await aToken.balanceOf(waToken.address));

            // let bal3 = await waToken.balanceOf(signer2.address)
            // await waToken.connect(signer2).redeem(bal3, signer2.address, signer2.address);
            // console.log(await waToken.balanceOf(signer2.address))
            // console.log(await aToken.balanceOf(waToken.address));
        });
    });
});