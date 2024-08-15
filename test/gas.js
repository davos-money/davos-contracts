const { ethers } = require('hardhat');
const TransparentUpgradeableProxy = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json");
const ProxyAdmin = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json");
const ether = require('@openzeppelin/test-helpers/src/ether');

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000"; // 45 Decimals

describe('===Gas Calculation===', function () {
    let deployer;

    beforeEach(async function () {
        [deployer, _multisig] = await ethers.getSigners();
    });

    describe('--- calculate()', function () {
        it('calculates: gasCost', async function () {

            var total = Number(0);

            this.Vat = await ethers.getContractFactory("Vat");
            this.Spot = await ethers.getContractFactory("Spotter");
            this.Davos = await ethers.getContractFactory("Davos");
            this.DavosJoin = await ethers.getContractFactory("DavosJoin");
            this.Jug = await ethers.getContractFactory("Jug");
            this.Vow = await ethers.getContractFactory("Vow");
            this.Dog = await ethers.getContractFactory("Dog");
            this.Abacus = await ethers.getContractFactory("LinearDecrease");

            this.PA = await hre.ethers.getContractFactory(ProxyAdmin.abi, ProxyAdmin.bytecode);
            this.TUP = await hre.ethers.getContractFactory(TransparentUpgradeableProxy.abi, TransparentUpgradeableProxy.bytecode);

            this.DgtRewards = await hre.ethers.getContractFactory("DGTRewards");
            this.AuctionProxy = await hre.ethers.getContractFactory("AuctionProxy");
            const auctionProxy = await this.AuctionProxy.deploy();
            this.Interaction = await hre.ethers.getContractFactory("Interaction", {
                unsafeAllow: ['external-library-linking'],
                libraries: {
                    AuctionProxy: auctionProxy.address
                }
            });

            this.MasterVault = await ethers.getContractFactory("MasterVault_V2");
            this.DavosProvider = await ethers.getContractFactory("DavosProvider");
            this.DCol = await ethers.getContractFactory("dCol");
            this.GemJoin = await ethers.getContractFactory("GemJoin");
            this.Clip = await ethers.getContractFactory("Clipper");

            this.RatioAdapter = await ethers.getContractFactory("RatioAdapter");
            
            this.Oracle = await ethers.getContractFactory("WWBTCOracle");

            this.WAToken = await ethers.getContractFactory("WAToken");

            let vatImp = await this.Vat.deploy();
            let spotImp = await this.Spot.deploy();
            let davosImp = await this.Davos.deploy();
            let davosJoinImp = await this.DavosJoin.deploy();
            let jugImp = await this.Jug.deploy();
            let vowImp = await this.Vow.deploy();
            let dogImp = await this.Dog.deploy();
            let abacusImp = await this.Abacus.deploy();

            total += Number(vatImp.deployTransaction.gasLimit);
            total += Number(spotImp.deployTransaction.gasLimit);
            total += Number(davosImp.deployTransaction.gasLimit);
            total += Number(davosJoinImp.deployTransaction.gasLimit);
            total += Number(jugImp.deployTransaction.gasLimit);
            total += Number(vowImp.deployTransaction.gasLimit);
            total += Number(dogImp.deployTransaction.gasLimit);
            total += Number(abacusImp.deployTransaction.gasLimit);

            console.log("Vat---------------------------------" + vatImp.deployTransaction.gasLimit)
            console.log("Spot--------------------------------" + spotImp.deployTransaction.gasLimit)
            console.log("Davos-------------------------------" + davosImp.deployTransaction.gasLimit)
            console.log("DJoin-------------------------------" + davosJoinImp.deployTransaction.gasLimit)
            console.log("Jug---------------------------------" + jugImp.deployTransaction.gasLimit)
            console.log("Vow---------------------------------" + vowImp.deployTransaction.gasLimit)
            console.log("Dog---------------------------------" + dogImp.deployTransaction.gasLimit)
            console.log("Aba---------------------------------" + abacusImp.deployTransaction.gasLimit)
            console.log("TOTAL-------------------------------" + total);

            // Proxy Admin
            let proxyAdmin = await this.PA.deploy();
            console.log("ProxyAdmin--------------------------" + proxyAdmin.deployTransaction.gasLimit)
            total += Number(proxyAdmin.deployTransaction.gasLimit);
            console.log("TOTAL-------------------------------" + total);

            // Logic, Admin, Data
            let vat = await this.TUP.deploy(vatImp.address, proxyAdmin.address, "0x");
            let spot = await this.TUP.deploy(spotImp.address, proxyAdmin.address, "0x");
            let davos = await this.TUP.deploy(davosImp.address, proxyAdmin.address, "0x");
            let davosJoin = await this.TUP.deploy(davosJoinImp.address, proxyAdmin.address, "0x");
            let jug = await this.TUP.deploy(jugImp.address, proxyAdmin.address, "0x");
            let vow = await this.TUP.deploy(vowImp.address, proxyAdmin.address, "0x");
            let dog = await this.TUP.deploy(dogImp.address, proxyAdmin.address, "0x");
            let abacus = await this.TUP.deploy(abacusImp.address, proxyAdmin.address, "0x");

            total += Number(vat.deployTransaction.gasLimit) * 8;
            console.log("8 Proxies---------------------------" + Number(vat.deployTransaction.gasLimit)*8)
            console.log("TOTAL-------------------------------" + total)

            let dgtRewardsImp = await this.DgtRewards.deploy();
            let interactionImp = await this.Interaction.deploy();
            total += Number(dgtRewardsImp.deployTransaction.gasLimit)
            total += Number(auctionProxy.deployTransaction.gasLimit)
            total += Number(interactionImp.deployTransaction.gasLimit)

            console.log("Rewards-----------------------------" + dgtRewardsImp.deployTransaction.gasLimit)
            console.log("AuctionProxy------------------------" + auctionProxy.deployTransaction.gasLimit)
            console.log("Interaction-------------------------" + interactionImp.deployTransaction.gasLimit)
            console.log("TOTAL-------------------------------" + total);

            let rewards = await this.TUP.deploy(dgtRewardsImp.address, proxyAdmin.address, "0x");
            let interaction = await this.TUP.deploy(interactionImp.address, proxyAdmin.address, "0x");

            total += Number(vat.deployTransaction.gasLimit) * 2;
            console.log("2 Proxies---------------------------" + Number(vat.deployTransaction.gasLimit)*2)
            console.log("TOTAL-------------------------------" + total);

            vat = await ethers.getContractAt("Vat", vat.address);
            spot = await ethers.getContractAt("Spotter", spot.address);
            davos = await ethers.getContractAt("Davos", davos.address);
            davosJoin = await ethers.getContractAt("DavosJoin", davosJoin.address);
            jug = await ethers.getContractAt("Jug", jug.address);
            vow = await ethers.getContractAt("Vow", vow.address);
            dog = await ethers.getContractAt("Dog", dog.address);
            abacus = await ethers.getContractAt("LinearDecrease", abacus.address);
            rewards = await ethers.getContractAt("DGTRewards", rewards.address);
            interaction = await ethers.getContractAt("Interaction", interaction.address);

            let receipt;
            receipt = await (await vat.initialize()).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await spot.initialize(vat.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davos.initialize(1, "DUSD", "5000000" + wad)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davosJoin.initialize(vat.address, davos.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await jug.initialize(vat.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vow.initialize(vat.address, davosJoin.address, deployer.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dog.initialize(vat.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await abacus.initialize()).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await rewards.initialize(vat.address, ether("100000000").toString(), "5")).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await interaction.initialize(vat.address, spot.address, davos.address, davosJoin.address, jug.address, dog.address, rewards.address)).wait(); total += Number(receipt.cumulativeGasUsed);

            receipt = await (await vat.rely(spot.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat.rely(davosJoin.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat.rely(jug.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat.rely(dog.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Line"), 5000000 + rad)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davos.rely(davosJoin.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davos.setSupplyCap("5000000" + wad)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await spot.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await spot["file(bytes32,uint256)"](ethers.utils.formatBytes32String("par"), 1 + ray)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await rewards.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davosJoin.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davosJoin.rely(vow.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dog.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dog["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dog["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Hole"), 50000000 + rad)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await jug.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await jug["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vow.rely(dog.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vow["file(bytes32,address)"](ethers.utils.formatBytes32String("davos"), davos.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await abacus.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tau"), 36000)).wait(); total += Number(receipt.cumulativeGasUsed);

            console.log("TOTAL ALL INITIALIZE ---------------" + total);

            receipt = await (await interaction.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await rewards.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await spot.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davos.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davosJoin.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await jug.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vow.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dog.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await abacus.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);

            proxyAdmin = await ethers.getContractAt(["function transferOwnership(address) external"], proxyAdmin.address);
            receipt = await (await proxyAdmin.transferOwnership(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);

            console.log("TOTAL ALL TRANSFERS ----------------" + total);

            let masterVaultImp = await this.MasterVault.deploy();
            let davosProviderImp = await this.DavosProvider.deploy();
            let dColImp = await this.DCol.deploy();
            let gemJoinImp = await this.GemJoin.deploy();
            let clipImp = await this.Clip.deploy();
            let ratioAdapterImp = await this.RatioAdapter.deploy();
            let oracleImp = await this.Oracle.deploy();
            let wATokenImp = await this.WAToken.deploy();

            total += Number(masterVaultImp.deployTransaction.gasLimit);
            total += Number(davosProviderImp.deployTransaction.gasLimit);
            total += Number(dColImp.deployTransaction.gasLimit);
            total += Number(gemJoinImp.deployTransaction.gasLimit);
            total += Number(clipImp.deployTransaction.gasLimit);
            total += Number(ratioAdapterImp.deployTransaction.gasLimit);
            total += Number(oracleImp.deployTransaction.gasLimit);
            total += Number(wATokenImp.deployTransaction.gasLimit);

            console.log("MasterVault-------------------------" + masterVaultImp.deployTransaction.gasLimit)
            console.log("DavosProvider-----------------------" + davosProviderImp.deployTransaction.gasLimit)
            console.log("DCol--------------------------------" + dColImp.deployTransaction.gasLimit)
            console.log("GemJoin-----------------------------" + gemJoinImp.deployTransaction.gasLimit)
            console.log("Clipper-----------------------------" + clipImp.deployTransaction.gasLimit)
            console.log("RatioAdapter------------------------" + ratioAdapterImp.deployTransaction.gasLimit)
            console.log("Oracle------------------------------" + oracleImp.deployTransaction.gasLimit)
            console.log("Wrapper-----------------------------" + wATokenImp.deployTransaction.gasLimit)
            console.log("TOTAL-------------------------------" + total);

            // Proxy Admin
            proxyAdmin = await this.PA.deploy();
            console.log("ProxyAdmin--------------------------" + proxyAdmin.deployTransaction.gasLimit)
            total += Number(proxyAdmin.deployTransaction.gasLimit);
            console.log("TOTAL-------------------------------" + total);

            // Logic, Admin, Data
            let masterVault = await this.TUP.deploy(masterVaultImp.address, proxyAdmin.address, "0x");
            let davosProvider = await this.TUP.deploy(davosProviderImp.address, proxyAdmin.address, "0x");
            let dCol = await this.TUP.deploy(dColImp.address, proxyAdmin.address, "0x");
            let gemJoin = await this.TUP.deploy(gemJoinImp.address, proxyAdmin.address, "0x");
            let clip = await this.TUP.deploy(clipImp.address, proxyAdmin.address, "0x");
            let ratioAdapter = await this.TUP.deploy(ratioAdapterImp.address, proxyAdmin.address, "0x");
            let oracle = await this.TUP.deploy(oracleImp.address, proxyAdmin.address, "0x");
            let wAToken = await this.TUP.deploy(wATokenImp.address, proxyAdmin.address, "0x");

            total += Number(masterVault.deployTransaction.gasLimit) * 8;
            console.log("8 Proxies---------------------------" + Number(masterVault.deployTransaction.gasLimit)*8)
            console.log("TOTAL-------------------------------" + total)

            masterVault = await ethers.getContractAt("MasterVault_V2", masterVault.address);
            davosProvider = await ethers.getContractAt("DavosProvider", davosProvider.address);
            dCol = await ethers.getContractAt("dCol", dCol.address);
            gemJoin = await ethers.getContractAt("GemJoin", gemJoin.address);
            clip = await ethers.getContractAt("Clipper", clip.address);
            ratioAdapter = await ethers.getContractAt("RatioAdapter", ratioAdapter.address);
            oracle = await ethers.getContractAt("WWBTCOracle", oracle.address);
            wAToken = await ethers.getContractAt("WAToken", wAToken.address);

            // TEMP
            let _underlying = (await this.Davos.deploy()).address;
            let _ilk = ethers.utils.formatBytes32String("TEMP");

            receipt = await (await masterVault.initialize("MasterVault Token", "MVT", 0, wAToken.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davosProvider.initialize(wAToken.address, dCol.address, masterVault.address, interaction.address, false)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dCol.initialize()).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await gemJoin.initialize(vat.address, _ilk, masterVault.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await clip.initialize(vat.address, spot.address, dog.address, _ilk)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await ratioAdapter.initialize()).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await oracle.initialize("0x73AB44615772a0d31dB48A87d7F4F81a3601BceB", wAToken.address, masterVault.address, ratioAdapter.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await wAToken.initialize("abc", "ABC", _underlying)).wait(); total += Number(receipt.cumulativeGasUsed);

            await ( await ratioAdapter.setToken(wAToken.address, "convertToAssets(uint256)", "convertToShares(uint256)", "", false)).wait(); total += Number(receipt.cumulativeGasUsed); 

            await ( await masterVault.changeProvider(davosProvider.address)).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await masterVault.changeYieldHeritor(deployer.address)).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await masterVault.changeAdapter(ratioAdapter.address)).wait(); total += Number(receipt.cumulativeGasUsed); 

            await ( await dCol.changeMinter(davosProvider.address)).wait(); total += Number(receipt.cumulativeGasUsed); 

            await ( await vat.rely(gemJoin.address)).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await vat.rely(clip.address)).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await vat["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("line"), "5000000" + rad)).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await vat["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("dust"), "1" + rad)).wait(); total += Number(receipt.cumulativeGasUsed); 
            
            await ( await spot["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("pip"), oracle.address)).wait(); total += Number(receipt.cumulativeGasUsed); 

            await ( await gemJoin.rely("0x925BEDd155c21B673bfD9F00e0eA23dd85d70186")).wait(); total += Number(receipt.cumulativeGasUsed); 

            await ( await dog.rely(clip.address)).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await dog["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("hole"), "50000000" + rad)).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await dog["file(bytes32,bytes32,uint256)"](_ilk, ethers.utils.formatBytes32String("chop"), "1100000000000000000")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await dog["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("clip"), clip.address)).wait(); total += Number(receipt.cumulativeGasUsed); 

            await ( await clip.rely("0x925BEDd155c21B673bfD9F00e0eA23dd85d70186")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip.rely("0xc9069E47C72C0c54F473Ca44691cF64e5C95a823")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("buf"), "1100000000000000000000000000")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tail"), "10800")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("cusp"), "600000000000000000000000000")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("chip"), "100000000000000")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tip"), "10" + rad)).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("stopped"), "0")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("spotter"), "0x9032bDa78d8fCe219fB0E95b69E54047921BB816")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("dog"), "0xc9069E47C72C0c54F473Ca44691cF64e5C95a823")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), "0x7B0E879f4860767d5e2455591Ba025978ab3461F")).wait(); total += Number(receipt.cumulativeGasUsed); 
            await ( await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("calc"), "0x5bF6C2a5dF522FeD9FaA17AA280510b4F78163E6")).wait(); total += Number(receipt.cumulativeGasUsed); 

            await davosProvider.changeAToken(wAToken.address);

            await ( await interaction.setDavosProvider(masterVault.address, davosProvider.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            await ( await interaction.setCollateralType(masterVault.address, gemJoin.address, _ilk, clip.address, "1515151515151515151515151515")).wait(); total += Number(receipt.cumulativeGasUsed);
            // await ( await interaction.poke(masterVault.address, {gasLimit: 3000000})).wait(); total += Number(receipt.cumulativeGasUsed);
            await ( await interaction.drip(masterVault.address, {gasLimit: 2000000})).wait(); total += Number(receipt.cumulativeGasUsed);
            await ( await interaction.setCollateralDuty(masterVault.address, "1000000001622535724756171270", {gasLimit: 25000000})).wait(); total += Number(receipt.cumulativeGasUsed);

            console.log("TOTAL COLLATERAL ALL INITIALIZE-----" + total);

            await ( await ratioAdapter.transferOwnership(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            await ( await wAToken.transferOwnership(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            await ( await masterVault.transferOwnership(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            await ( await davosProvider.transferOwnership(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            await ( await dCol.transferOwnership(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            await ( await gemJoin.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            await ( await clip.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);

            proxyAdmin = await ethers.getContractAt(["function transferOwnership(address) external"], proxyAdmin.address);
            receipt = await (await proxyAdmin.transferOwnership(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);

            console.log("TOTAL COLLATERAL ALL TRANSFER-------" + total);
        });
    });
});