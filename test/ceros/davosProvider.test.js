const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { joinSignature } = require('ethers/lib/utils');
const { ethers, network } = require('hardhat');
const Web3 = require('web3');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const DATA = "0x02";

describe('===DavosProvider===', function () {
    let deployer, signer1, signer2, signer3, multisig;

    let davosProvider,
        matic,
        collateralDerivative,
        masterVault,
        interaction;

    let _ilkCeMatic = ethers.utils.formatBytes32String("ceMATIC");
    let _dgtRewardsPoolLimitInEth = "100000000";
    let _multisig;

    let wad = "000000000000000000", // 18 Decimals
        ray = "000000000000000000000000000", // 27 Decimals
        rad = "000000000000000000000000000000000000000000000", // 45 Decimals
        ONE = 10 ** 27;


    let collateral = ethers.utils.formatBytes32String("aMATICc");

    beforeEach(async function () {

        ////////////////////////////////
        /** Deployments ------------ **/
        ////////////////////////////////

        [deployer, signer1, signer2, signer3, multisig] = await ethers.getSigners();
        _multisig = deployer.address;

        // Contract factory
        this.Token = await hre.ethers.getContractFactory("Token");
        this.CeaMATICc = await hre.ethers.getContractFactory("CeToken");
        this.CeVault = await hre.ethers.getContractFactory("CeVault");
        this.DCol = await hre.ethers.getContractFactory("dCol");
        this.CerosRouter = await hre.ethers.getContractFactory("CerosRouterLs");
        this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
        this.Vat = await hre.ethers.getContractFactory("Vat");
        this.Spot = await hre.ethers.getContractFactory("Spotter");
        this.Davos = await hre.ethers.getContractFactory("Davos");
        this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
        this.DavosJoin = await hre.ethers.getContractFactory("DavosJoin");
        this.Oracle = await hre.ethers.getContractFactory("Oracle"); 
        this.Jug = await hre.ethers.getContractFactory("Jug");
        this.Vow = await hre.ethers.getContractFactory("Vow");
        this.Dog = await hre.ethers.getContractFactory("Dog");
        this.Clip = await hre.ethers.getContractFactory("Clipper");
        this.Abacus = await hre.ethers.getContractFactory("LinearDecrease");
        this.DgtToken = await hre.ethers.getContractFactory("DGTToken");
        this.DgtRewards = await hre.ethers.getContractFactory("DGTRewards");
        this.DgtOracle = await hre.ethers.getContractFactory("DGTOracle"); 
        this.AuctionProxy = await hre.ethers.getContractFactory("AuctionProxy");
        this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

        const auctionProxy = await this.AuctionProxy.deploy();
        await auctionProxy.deployed();
        this.Interaction = await hre.ethers.getContractFactory("Interaction", {
            unsafeAllow: ['external-library-linking'],
            libraries: {
                AuctionProxy: auctionProxy.address
            }
        });

        this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
        this.WaitingPool = await hre.ethers.getContractFactory("WaitingPool");

        // Contract deployment
        collateralToken = await this.Token.deploy()
        await collateralToken.deployed();
        await collateralToken.initialize("Matic Token", "MTK");

        masterVault = await upgrades.deployProxy(this.MasterVault, ["MasterVault Token", "MVTK", 0, collateralToken.address]);
        await masterVault.deployed();

        waitingPool = await upgrades.deployProxy(this.WaitingPool, [masterVault.address, collateralToken.address, 10]);
        await waitingPool.deployed();

        dCol = await upgrades.deployProxy(this.DCol, [], {initializer: "initialize"});
        await dCol.deployed();
        dColImp = await upgrades.erc1967.getImplementationAddress(dCol.address);

        abacus = await upgrades.deployProxy(this.Abacus, [], {initializer: "initialize"});
        await abacus.deployed();
        abacusImp = await upgrades.erc1967.getImplementationAddress(abacus.address);

        oracle = await this.Oracle.deploy();
        await oracle.deployed();
        await oracle.setPrice("2" + wad); // 2$

        vat = await upgrades.deployProxy(this.Vat, [], {initializer: "initialize"});
        await vat.deployed();
        vatImp = await upgrades.erc1967.getImplementationAddress(vat.address);

        spot = await upgrades.deployProxy(this.Spot, [vat.address], {initializer: "initialize"});
        await spot.deployed();
        spotImp = await upgrades.erc1967.getImplementationAddress(spot.address);

        davos = await upgrades.deployProxy(this.Davos, ["5", "DAVOS", "5000000" + wad], {initializer: "initialize"});
        await davos.deployed();
        davosImp = await upgrades.erc1967.getImplementationAddress(davos.address);

        davosJoin = await upgrades.deployProxy(this.DavosJoin, [vat.address, davos.address], {initializer: "initialize"});
        await davosJoin.deployed();
        davosJoinImp = await upgrades.erc1967.getImplementationAddress(davosJoin.address);

        gemJoin = await upgrades.deployProxy(this.GemJoin, [vat.address, _ilkCeMatic, masterVault.address], {initializer: "initialize"});
        await gemJoin.deployed();
        gemJoinImp = await upgrades.erc1967.getImplementationAddress(gemJoin.address);

        jug = await upgrades.deployProxy(this.Jug, [vat.address], {initializer: "initialize"});
        await jug.deployed();
        jugImp = await upgrades.erc1967.getImplementationAddress(jug.address);

        vow = await upgrades.deployProxy(this.Vow, [vat.address, davosJoin.address, _multisig], {initializer: "initialize"});
        await vow.deployed();
        vowImp = await upgrades.erc1967.getImplementationAddress(vow.address);

        dog = await upgrades.deployProxy(this.Dog, [vat.address], {initializer: "initialize"});
        await dog.deployed();
        dogImpl = await upgrades.erc1967.getImplementationAddress(dog.address);

        clip = await upgrades.deployProxy(this.Clip, [vat.address, spot.address, dog.address, _ilkCeMatic], {initializer: "initialize"});
        await clip.deployed();
        clipImp = await upgrades.erc1967.getImplementationAddress(dog.address);

        rewards = await upgrades.deployProxy(this.DgtRewards, [vat.address, _dgtRewardsPoolLimitInEth + wad, 5], {initializer: "initialize"});
        await rewards.deployed();
        rewardsImp = await upgrades.erc1967.getImplementationAddress(rewards.address);

        interaction = await upgrades.deployProxy(this.Interaction, [vat.address, spot.address, davos.address, davosJoin.address, jug.address, dog.address, rewards.address], 
            {
                initializer: "initialize",
                unsafeAllowLinkedLibraries: true
            }
        );
        await interaction.deployed();
        interactionImplAddress = await upgrades.erc1967.getImplementationAddress(interaction.address);

        davosProvider = await upgrades.deployProxy(this.DavosProvider, [collateralToken.address, dCol.address, masterVault.address, interaction.address, false], {initializer: "initialize"});
        await davosProvider.deployed();

        ratioAdapter = await upgrades.deployProxy(this.RatioAdapter, [], {initializer: "initialize"});

        // initialize
        await vat.rely(gemJoin.address);
        await vat.rely(spot.address);
        await vat.rely(davosJoin.address);
        await vat.rely(jug.address);
        await vat.rely(dog.address);
        await vat.rely(clip.address);
        await vat.rely(interaction.address);
        await vat["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Line"), "5000000" + rad);
        await vat["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("line"), "5000000" + rad);
        await vat["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("dust"), "100" + rad);
        
        await davos.rely(davosJoin.address);
        await davos.setSupplyCap("5000000" + wad);
        
        await spot.rely(interaction.address);
        await spot["file(bytes32,bytes32,address)"](_ilkCeMatic, ethers.utils.formatBytes32String("pip"), oracle.address);
        await spot["file(bytes32,uint256)"](ethers.utils.formatBytes32String("par"), "1" + ray); // It means pegged to 1$
        
        await rewards.rely(interaction.address);
        
        await gemJoin.rely(interaction.address);
        await davosJoin.rely(interaction.address);
        await davosJoin.rely(vow.address);
        
        await dog.rely(interaction.address);
        await dog.rely(clip.address);
        await dog["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address);
        await dog["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Hole"), "50000000" + rad);
        await dog["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("hole"), "50000000" + rad);
        await dog["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("chop"), "1100000000000000000");
        await dog["file(bytes32,bytes32,address)"](_ilkCeMatic, ethers.utils.formatBytes32String("clip"), clip.address);
        
        await clip.rely(interaction.address);
        await clip.rely(dog.address);
        await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("buf"), "1100000000000000000000000000"); // 10%
        await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tail"), "10800"); // 3H reset time
        await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("cusp"), "600000000000000000000000000"); // 60% reset ratio
        await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("chip"), "100000000000000"); // 0.01% vow incentive
        await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tip"), "10" + rad); // 10$ flat incentive
        await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("stopped"), "0");
        await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("spotter"), spot.address);
        await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("dog"), dog.address);
        await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address);
        await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("calc"), abacus.address);
        
        await jug.rely(interaction.address);
        await jug["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address);
        
        await vow.rely(dog.address);
        await vow["file(bytes32,address)"](ethers.utils.formatBytes32String("davos"), davos.address);
        
        await abacus.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tau"), "36000"); // Price will reach 0 after this time

        await interaction.setCollateralType(masterVault.address, gemJoin.address, _ilkCeMatic, clip.address, "1333333333333333333333333333");
        await interaction.poke(masterVault.address);
        await interaction.drip(masterVault.address);
        await interaction.setDavosProvider(masterVault.address, davosProvider.address);

        await masterVault.changeProvider(davosProvider.address);
        await masterVault.changeAdapter(ratioAdapter.address);
        // await masterVault.setWaitingPool(waitingPool.address);
        await dCol.changeMinter(davosProvider.address);
    });

    describe('--- Provide', function () {
        it('checks provide() functionality with ERC20', async function () {
            await collateralToken.approve(davosProvider.address, "1" + wad);
            await collateralToken.mint(deployer.address, "1" + wad);
            expect(await collateralToken.balanceOf(deployer.address)).to.be.equal("1" + wad);
            await davosProvider.provide("1" + wad);      
            expect(await collateralToken.balanceOf(deployer.address)).to.be.equal(0);
        });
        it('checks provide() functionality with Native', async function () {
            // Contract deployment
            collateralToken = await this.Token.deploy()
            await collateralToken.deployed();
            await collateralToken.initialize("Wrapped Matic", "wMATIC");

            masterVault = await upgrades.deployProxy(this.MasterVault, ["MasterVault Token", "MVTK", 0, collateralToken.address]);
            await masterVault.deployed();

            waitingPool = await upgrades.deployProxy(this.WaitingPool, [masterVault.address, collateralToken.address, 10]);
            await waitingPool.deployed();

            dCol = await upgrades.deployProxy(this.DCol, [], {initializer: "initialize"});
            await dCol.deployed();
            dColImp = await upgrades.erc1967.getImplementationAddress(dCol.address);

            abacus = await upgrades.deployProxy(this.Abacus, [], {initializer: "initialize"});
            await abacus.deployed();
            abacusImp = await upgrades.erc1967.getImplementationAddress(abacus.address);

            oracle = await this.Oracle.deploy();
            await oracle.deployed();
            await oracle.setPrice("2" + wad); // 2$

            vat = await upgrades.deployProxy(this.Vat, [], {initializer: "initialize"});
            await vat.deployed();
            vatImp = await upgrades.erc1967.getImplementationAddress(vat.address);

            spot = await upgrades.deployProxy(this.Spot, [vat.address], {initializer: "initialize"});
            await spot.deployed();
            spotImp = await upgrades.erc1967.getImplementationAddress(spot.address);

            davos = await upgrades.deployProxy(this.Davos, ["5", "DAVOS", "5000000" + wad], {initializer: "initialize"});
            await davos.deployed();
            davosImp = await upgrades.erc1967.getImplementationAddress(davos.address);

            davosJoin = await upgrades.deployProxy(this.DavosJoin, [vat.address, davos.address], {initializer: "initialize"});
            await davosJoin.deployed();
            davosJoinImp = await upgrades.erc1967.getImplementationAddress(davosJoin.address);

            gemJoin = await upgrades.deployProxy(this.GemJoin, [vat.address, _ilkCeMatic, masterVault.address], {initializer: "initialize"});
            await gemJoin.deployed();
            gemJoinImp = await upgrades.erc1967.getImplementationAddress(gemJoin.address);

            jug = await upgrades.deployProxy(this.Jug, [vat.address], {initializer: "initialize"});
            await jug.deployed();
            jugImp = await upgrades.erc1967.getImplementationAddress(jug.address);

            vow = await upgrades.deployProxy(this.Vow, [vat.address, davosJoin.address, _multisig], {initializer: "initialize"});
            await vow.deployed();
            vowImp = await upgrades.erc1967.getImplementationAddress(vow.address);

            dog = await upgrades.deployProxy(this.Dog, [vat.address], {initializer: "initialize"});
            await dog.deployed();
            dogImpl = await upgrades.erc1967.getImplementationAddress(dog.address);

            clip = await upgrades.deployProxy(this.Clip, [vat.address, spot.address, dog.address, _ilkCeMatic], {initializer: "initialize"});
            await clip.deployed();
            clipImp = await upgrades.erc1967.getImplementationAddress(dog.address);

            rewards = await upgrades.deployProxy(this.DgtRewards, [vat.address, _dgtRewardsPoolLimitInEth + wad, 5], {initializer: "initialize"});
            await rewards.deployed();
            rewardsImp = await upgrades.erc1967.getImplementationAddress(rewards.address);

            interaction = await upgrades.deployProxy(this.Interaction, [vat.address, spot.address, davos.address, davosJoin.address, jug.address, dog.address, rewards.address], 
                {
                    initializer: "initialize",
                    unsafeAllowLinkedLibraries: true
                }
            );
            await interaction.deployed();
            interactionImplAddress = await upgrades.erc1967.getImplementationAddress(interaction.address);

            davosProvider = await upgrades.deployProxy(this.DavosProvider, [collateralToken.address, dCol.address, masterVault.address, interaction.address, true], {initializer: "initialize"});
            await davosProvider.deployed();

            this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

            // initialize
            await vat.rely(gemJoin.address);
            await vat.rely(spot.address);
            await vat.rely(davosJoin.address);
            await vat.rely(jug.address);
            await vat.rely(dog.address);
            await vat.rely(clip.address);
            await vat.rely(interaction.address);
            await vat["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Line"), "5000000" + rad);
            await vat["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("line"), "5000000" + rad);
            await vat["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("dust"), "100" + rad);
            
            await davos.rely(davosJoin.address);
            await davos.setSupplyCap("5000000" + wad);
            
            await spot.rely(interaction.address);
            await spot["file(bytes32,bytes32,address)"](_ilkCeMatic, ethers.utils.formatBytes32String("pip"), oracle.address);
            await spot["file(bytes32,uint256)"](ethers.utils.formatBytes32String("par"), "1" + ray); // It means pegged to 1$
            
            await rewards.rely(interaction.address);
            
            await gemJoin.rely(interaction.address);
            await davosJoin.rely(interaction.address);
            await davosJoin.rely(vow.address);
            
            await dog.rely(interaction.address);
            await dog.rely(clip.address);
            await dog["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address);
            await dog["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Hole"), "50000000" + rad);
            await dog["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("hole"), "50000000" + rad);
            await dog["file(bytes32,bytes32,uint256)"](_ilkCeMatic, ethers.utils.formatBytes32String("chop"), "1100000000000000000");
            await dog["file(bytes32,bytes32,address)"](_ilkCeMatic, ethers.utils.formatBytes32String("clip"), clip.address);
            
            await clip.rely(interaction.address);
            await clip.rely(dog.address);
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("buf"), "1100000000000000000000000000"); // 10%
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tail"), "10800"); // 3H reset time
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("cusp"), "600000000000000000000000000"); // 60% reset ratio
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("chip"), "100000000000000"); // 0.01% vow incentive
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tip"), "10" + rad); // 10$ flat incentive
            await clip["file(bytes32,uint256)"](ethers.utils.formatBytes32String("stopped"), "0");
            await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("spotter"), spot.address);
            await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("dog"), dog.address);
            await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address);
            await clip["file(bytes32,address)"](ethers.utils.formatBytes32String("calc"), abacus.address);
            
            await jug.rely(interaction.address);
            await jug["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address);
            
            await vow.rely(dog.address);
            await vow["file(bytes32,address)"](ethers.utils.formatBytes32String("davos"), davos.address);
            
            await abacus.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tau"), "36000"); // Price will reach 0 after this time

            await interaction.setCollateralType(masterVault.address, gemJoin.address, _ilkCeMatic, clip.address, "1333333333333333333333333333");
            await interaction.poke(masterVault.address);
            await interaction.drip(masterVault.address);
            await interaction.setDavosProvider(masterVault.address, davosProvider.address);

            await masterVault.changeProvider(davosProvider.address);
            await masterVault.changeAdapter(ratioAdapter.address);
            // await masterVault.setWaitingPool(waitingPool.address);
            await dCol.changeMinter(davosProvider.address);

            await davosProvider.changeNativeStatus(true);

            expect(await collateralToken.balanceOf(masterVault.address)).to.be.equal(0);
            await expect(davosProvider.provide("2" + wad, {value: "1" + wad})).to.be.revertedWith("DavosProvider/erc20-not-accepted");      
            await davosProvider.provide(0, {value: "1" + wad});      
            expect(await collateralToken.balanceOf(masterVault.address)).to.be.equal("1" + wad);
        });
    });
    describe('--- Release', function () {
        it('reverts: recipient is 0 address', async function () {
            await collateralToken.approve(davosProvider.address, "1" + wad);
            await collateralToken.mint(deployer.address, "1" + wad);
            await davosProvider.provide("1" + wad);      

            await expect(davosProvider.release(NULL_ADDRESS, "1" + wad)).to.be.revertedWith("");
        });
        it('checks release() functionality', async function () {
            await collateralToken.approve(davosProvider.address, "1" + wad);
            await collateralToken.mint(deployer.address, "1" + wad);
            await davosProvider.provide("1" + wad);      

            await davosProvider.release(deployer.address, "1" + wad);
        });
    });
    describe('--- Pause and Unpause', function () {
        it('pauses the contract', async function () {
            await davosProvider.pause();      
            expect(await davosProvider.paused()).to.be.equal(true);
        });
        it('unpauses the contract', async function () {
            await davosProvider.pause();      
            await davosProvider.unPause();      
            expect(await davosProvider.paused()).to.be.equal(false);
        });
    });
    describe('--- Setters', function () {
        it('Change underlying token', async function () {
            let newAddress = await this.Token.deploy(); 
            await newAddress.deployed();
            await davosProvider.changeUnderlying(newAddress.address);      
            expect(await davosProvider.underlying()).to.be.equal(newAddress.address);
        });
        it('Change collateral', async function () {
            let newAddress = await this.Token.deploy(); 
            await newAddress.deployed();
            await davosProvider.changeCollateral(newAddress.address);      
            expect(await davosProvider.collateral()).to.be.equal(newAddress.address);
        });
        it('Change collateralDerivative', async function () {
            let newAddress = await this.Token.deploy(); 
            await newAddress.deployed();
            await davosProvider.changeCollateralDerivative(newAddress.address);      
            expect(await davosProvider.collateralDerivative()).to.be.equal(newAddress.address);
        });
        it('Change masterVault', async function () {
            let newAddress = await this.Token.deploy(); 
            await newAddress.deployed();
            await davosProvider.changeMasterVault(newAddress.address);      
            expect(await davosProvider.masterVault()).to.be.equal(newAddress.address);
        });
        it('Change interaction', async function () {
            let newAddress = await this.Token.deploy(); 
            await newAddress.deployed();
            await davosProvider.changeInteraction(newAddress.address);      
            expect(await davosProvider.interaction()).to.be.equal(newAddress.address);
        });
    });
    describe('--- OnlyOwnerOrInteraction', function () {
        it('reverts: not owner or interaction', async function () {
            await expect(davosProvider.connect(signer3).liquidation(deployer.address, "1")).to.be.revertedWith("DavosProvider/not-interaction-or-owner");
        });
        it('reverts: 0 address liquidation', async function () {
            await expect(davosProvider.liquidation(NULL_ADDRESS, "1")).to.be.revertedWith("");
        });
        it('reverts: 0 address mint', async function () {
            await expect(davosProvider.daoMint(NULL_ADDRESS, "1")).to.be.revertedWith("");
        });
        it('reverts: 0 address burn', async function () {
            await expect(davosProvider.daoBurn(NULL_ADDRESS, "1")).to.be.revertedWith("");
        });
        it('mints dCol', async function () {
            await davosProvider.daoMint(deployer.address, "1");
            expect(await dCol.balanceOf(deployer.address)).to.be.equal("1");
        });
        it('burns dCol', async function () {
            await davosProvider.daoMint(deployer.address, "1");
            expect(await dCol.balanceOf(deployer.address)).to.be.equal("1");

            await davosProvider.daoBurn(deployer.address, "1");
            expect(await dCol.balanceOf(deployer.address)).to.be.equal("0");
        });
    });
});