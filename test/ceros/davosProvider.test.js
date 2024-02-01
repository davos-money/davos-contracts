const { expect } = require('chai');
const { ethers, upgrades, network } = require('hardhat');
const NetworkSnapshotter = require("../helpers/networkSnapshotter");

const DATA = "0x02",
  wad = "000000000000000000", // 18 Decimals
  ray = "000000000000000000000000000", // 27 Decimals
  rad = "000000000000000000000000000000000000000000000", // 45 Decimals
  ONE = 10 ** 27;
const _ilkCeMatic = ethers.utils.formatBytes32String("ceMATIC");
const _dgtRewardsPoolLimitInEth = "100000000";
const collateral = ethers.utils.formatBytes32String("aMATICc");

let Token, CeaMATICc, CeVault, DCol, CerosRouter, DavosProvider, Vat, Spot, Davos, GemJoin,
  DavosJoin, Oracle, Jug, Vow, Dog, Clip, Abacus, DgtToken, DgtRewards, DgtOracle, AuctionProxy, RatioAdapter,
  Interaction, MasterVault, WaitingPool;

async function initFactories () {
    // Contract factory
    const Token = await ethers.getContractFactory("Token");
    const CeaMATICc = await ethers.getContractFactory("CeToken");
    const CeVault = await ethers.getContractFactory("CeVault");
    const DCol = await ethers.getContractFactory("dCol");
    const CerosRouter = await ethers.getContractFactory("CerosRouterLs");
    const DavosProvider = await ethers.getContractFactory("DavosProvider");
    const Vat = await ethers.getContractFactory("Vat");
    const Spot = await ethers.getContractFactory("Spotter");
    const Davos = await ethers.getContractFactory("Davos");
    const GemJoin = await ethers.getContractFactory("GemJoin");
    const DavosJoin = await ethers.getContractFactory("DavosJoin");
    const Oracle = await ethers.getContractFactory("Oracle");
    const Jug = await ethers.getContractFactory("Jug");
    const Vow = await ethers.getContractFactory("Vow");
    const Dog = await ethers.getContractFactory("Dog");
    const Clip = await ethers.getContractFactory("Clipper");
    const Abacus = await ethers.getContractFactory("LinearDecrease");
    const DgtToken = await ethers.getContractFactory("DGTToken");
    const DgtRewards = await ethers.getContractFactory("DGTRewards");
    const DgtOracle = await ethers.getContractFactory("DGTOracle");
    const AuctionProxy = await ethers.getContractFactory("AuctionProxy");
    const RatioAdapter = await ethers.getContractFactory("RatioAdapter");
    const auctionProxy = await AuctionProxy.deploy();
    const Interaction = await ethers.getContractFactory("Interaction", {
        unsafeAllow: ['external-library-linking'],
        libraries: {
            AuctionProxy: auctionProxy.address
        }
    });
    const MasterVault = await ethers.getContractFactory("MasterVault_V2");
    const WaitingPool = await ethers.getContractFactory("WaitingPool");

    return [
        Token, CeaMATICc, CeVault, DCol, CerosRouter, DavosProvider, Vat, Spot, Davos, GemJoin,
        DavosJoin, Oracle, Jug, Vow, Dog, Clip, Abacus, DgtToken, DgtRewards, DgtOracle, AuctionProxy, RatioAdapter,
        Interaction, MasterVault, WaitingPool
    ]
}
async function init (tokenName, tokenSymbol, isNative){
    const [_multisig] = await ethers.getSigners();

    // Contract deployment
    const collateralToken = await Token.deploy()
    await collateralToken.deployed();
    await collateralToken.initialize(tokenName, tokenSymbol);

    const masterVault = await upgrades.deployProxy(MasterVault, ["MasterVault Token", "MVTK", 0, collateralToken.address]);
    await masterVault.deployed();

    const waitingPool = await upgrades.deployProxy(WaitingPool, [masterVault.address, collateralToken.address, 10]);
    await waitingPool.deployed();

    const dCol = await upgrades.deployProxy(DCol, [], {initializer: "initialize"});
    await dCol.deployed();
    dColImp = await upgrades.erc1967.getImplementationAddress(dCol.address);

    const abacus = await upgrades.deployProxy(Abacus, [], {initializer: "initialize"});
    await abacus.deployed();
    abacusImp = await upgrades.erc1967.getImplementationAddress(abacus.address);

    const oracle = await Oracle.deploy();
    await oracle.deployed();
    await oracle.setPrice("2" + wad); // 2$

    const vat = await upgrades.deployProxy(Vat, [], {initializer: "initialize"});
    await vat.deployed();
    vatImp = await upgrades.erc1967.getImplementationAddress(vat.address);

    const spot = await upgrades.deployProxy(Spot, [vat.address], {initializer: "initialize"});
    await spot.deployed();
    spotImp = await upgrades.erc1967.getImplementationAddress(spot.address);

    const davos = await upgrades.deployProxy(Davos, ["5", "DAVOS", "5000000" + wad], {initializer: "initialize"});
    await davos.deployed();
    davosImp = await upgrades.erc1967.getImplementationAddress(davos.address);

    const davosJoin = await upgrades.deployProxy(DavosJoin, [vat.address, davos.address], {initializer: "initialize"});
    await davosJoin.deployed();
    davosJoinImp = await upgrades.erc1967.getImplementationAddress(davosJoin.address);

    const gemJoin = await upgrades.deployProxy(GemJoin, [vat.address, _ilkCeMatic, masterVault.address], {initializer: "initialize"});
    await gemJoin.deployed();
    gemJoinImp = await upgrades.erc1967.getImplementationAddress(gemJoin.address);

    const jug = await upgrades.deployProxy(Jug, [vat.address], {initializer: "initialize"});
    await jug.deployed();
    jugImp = await upgrades.erc1967.getImplementationAddress(jug.address);

    const vow = await upgrades.deployProxy(Vow, [vat.address, davosJoin.address, _multisig.address], {initializer: "initialize"});
    await vow.deployed();
    vowImp = await upgrades.erc1967.getImplementationAddress(vow.address);

    const dog = await upgrades.deployProxy(Dog, [vat.address], {initializer: "initialize"});
    await dog.deployed();
    dogImpl = await upgrades.erc1967.getImplementationAddress(dog.address);

    const clip = await upgrades.deployProxy(Clip, [vat.address, spot.address, dog.address, _ilkCeMatic], {initializer: "initialize"});
    await clip.deployed();
    clipImp = await upgrades.erc1967.getImplementationAddress(dog.address);

    const rewards = await upgrades.deployProxy(DgtRewards, [vat.address, _dgtRewardsPoolLimitInEth + wad, 5], {initializer: "initialize"});
    await rewards.deployed();
    rewardsImp = await upgrades.erc1967.getImplementationAddress(rewards.address);

    const interaction = await upgrades.deployProxy(Interaction, [vat.address, spot.address, davos.address, davosJoin.address, jug.address, dog.address, rewards.address],
      {
          initializer: "initialize",
          unsafeAllowLinkedLibraries: true
      }
    );
    await interaction.deployed();
    interactionImplAddress = await upgrades.erc1967.getImplementationAddress(interaction.address);

    const davosProvider = await upgrades.deployProxy(DavosProvider, [collateralToken.address, dCol.address, masterVault.address, interaction.address, isNative], {initializer: "initialize"});
    await davosProvider.deployed();

    const ratioAdapter = await upgrades.deployProxy(RatioAdapter, [], {initializer: "initialize"});

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

    await abacus["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tau"), "36000"); // Price will reach 0 after this time

    await interaction.setCollateralType(masterVault.address, gemJoin.address, _ilkCeMatic, clip.address, "1333333333333333333333333333");
    await interaction.poke(masterVault.address);
    await interaction.drip(masterVault.address);
    await interaction.setDavosProvider(masterVault.address, davosProvider.address);

    await masterVault.changeProvider(davosProvider.address);
    await masterVault.changeAdapter(ratioAdapter.address);
    // await masterVault.setWaitingPool(waitingPool.address);
    await dCol.changeMinter(davosProvider.address);
    if (isNative) {
        await davosProvider.changeNativeStatus(isNative);
    }
    return [
        //Contracts
        collateralToken, masterVault, waitingPool, dCol, abacus, oracle, vat,
        spot, davos, davosJoin, gemJoin, jug, vow, dog, clip, rewards, interaction, davosProvider, ratioAdapter
    ]
}

describe('===DavosProvider===', function () {
    this.timeout(15000);

    let deployer, signer1, signer2, signer3, multisig, _multisig;
    let matic, collateralDerivative, collateralToken, masterVault, waitingPool, dCol, abacus, oracle, vat, spot, davos,
        davosJoin, gemJoin, jug, vow, dog, clip, rewards, interaction, davosProvider, ratioAdapter;
    const networkSnapshotter = new NetworkSnapshotter();

    before(async function () {
        //Factories
        [Token, CeaMATICc, CeVault, DCol, CerosRouter, DavosProvider, Vat, Spot, Davos, GemJoin,
            DavosJoin, Oracle, Jug, Vow, Dog, Clip, Abacus, DgtToken, DgtRewards, DgtOracle, AuctionProxy, RatioAdapter,
            Interaction, MasterVault, WaitingPool] = await initFactories();
        //Signers
       [deployer, signer1, signer2, signer3, multisig] = await ethers.getSigners();
       _multisig = deployer.address;
    });

    describe('--- ERC20', function () {
        before(async function () {
            [ collateralToken, masterVault, waitingPool, dCol, abacus, oracle, vat, spot, davos, davosJoin,
              gemJoin, jug, vow, dog, clip, rewards, interaction, davosProvider, ratioAdapter]
              = await init("Matic Token", "MTK", false);
            await networkSnapshotter.firstSnapshot();
        });
        beforeEach(async function () {
            await networkSnapshotter.revert();
        });
        describe('--- Provide', function () {
            it('provide()', async function () {
                await collateralToken.approve(davosProvider.address, "1" + wad);
                await collateralToken.mint(deployer.address, "1" + wad);
                expect(await collateralToken.balanceOf(deployer.address)).to.be.equal("1" + wad);
                await davosProvider.provide("1" + wad);
                expect(await collateralToken.balanceOf(deployer.address)).to.be.equal(0);
            });
            it('provideWithReferral()', async function () {
                await collateralToken.approve(davosProvider.address, "1" + wad);
                await collateralToken.mint(deployer.address, "1" + wad);
                expect(await collateralToken.balanceOf(deployer.address)).to.be.equal("1" + wad);
                const code = ethers.utils.formatBytes32String("TheCode");
                await expect(await davosProvider.provideWithReferral("1" + wad, code))
                  .to.emit(davosProvider, 'Referral').withArgs(code)
                  .and
                  .to.emit(davosProvider, 'Deposit').withArgs(deployer.address, 1+wad);
                expect(await collateralToken.balanceOf(deployer.address)).to.be.equal(0);
            });
        })
        describe('--- Release', function () {
            it('reverts: recipient is 0 address', async function () {
                await collateralToken.approve(davosProvider.address, "1" + wad);
                await collateralToken.mint(deployer.address, "1" + wad);
                await davosProvider.provide("1" + wad);

                await expect(davosProvider.release(ethers.constants.AddressZero, "1" + wad)).to.be.revertedWith("");
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
                let newAddress = await Token.deploy();
                await newAddress.deployed();
                await davosProvider.changeUnderlying(newAddress.address);
                expect(await davosProvider.underlying()).to.be.equal(newAddress.address);
            });
            it('Change collateral', async function () {
                let newAddress = await Token.deploy();
                await newAddress.deployed();
                await davosProvider.changeCollateral(newAddress.address);
                expect(await davosProvider.collateral()).to.be.equal(newAddress.address);
            });
            it('Change collateralDerivative', async function () {
                let newAddress = await Token.deploy();
                await newAddress.deployed();
                await davosProvider.changeCollateralDerivative(newAddress.address);
                expect(await davosProvider.collateralDerivative()).to.be.equal(newAddress.address);
            });
            it('Change masterVault', async function () {
                let newAddress = await Token.deploy();
                await newAddress.deployed();
                await davosProvider.changeMasterVault(newAddress.address);
                expect(await davosProvider.masterVault()).to.be.equal(newAddress.address);
            });
            it('Change interaction', async function () {
                let newAddress = await Token.deploy();
                await newAddress.deployed();
                await davosProvider.changeInteraction(newAddress.address);
                expect(await davosProvider.interaction()).to.be.equal(newAddress.address);
            });
        });
        describe('--- OnlyOwnerOrInteraction', function () {
            it('reverts: not owner or interaction', async function () {
                await expect(davosProvider.connect(signer3).liquidation(deployer.address, "1"))
                  .to.be.revertedWith("DavosProvider/not-interaction-or-owner");
            });
            it('reverts: 0 address liquidation', async function () {
                await expect(davosProvider.liquidation(ethers.constants.AddressZero, "1")).to.be.revertedWith("");
            });
            it('reverts: 0 address mint', async function () {
                await expect(davosProvider.daoMint(ethers.constants.AddressZero, "1")).to.be.revertedWith("");
            });
            it('reverts: 0 address burn', async function () {
                await expect(davosProvider.daoBurn(ethers.constants.AddressZero, "1")).to.be.revertedWith("");
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
    })

    describe('--- Native', function () {
        before(async function () {
            [ collateralToken, masterVault, waitingPool, dCol, abacus, oracle, vat, spot, davos, davosJoin,
              gemJoin, jug, vow, dog, clip, rewards, interaction, davosProvider, ratioAdapter]
              = await init("Wrapped Matic", "wMATIC", true);
            await networkSnapshotter.firstSnapshot();
        });
        beforeEach(async function () {
            await networkSnapshotter.revert();
        });
        describe('--- Provide', function () {
            it('provide()', async function () {
                expect(await collateralToken.balanceOf(masterVault.address)).to.be.equal(0);
                await expect(davosProvider.provide("2" + wad, {value: "1" + wad}))
                  .to.be.revertedWith("DavosProvider/erc20-not-accepted");
                await expect(davosProvider.provide(0, {value: "1" + wad}))
                  .to.emit(davosProvider, 'Deposit').withArgs(deployer.address, 1+wad);
                expect(await collateralToken.balanceOf(masterVault.address)).to.be.equal("1" + wad);
            });
            it('provideWithReferral()', async function () {
                expect(await collateralToken.balanceOf(masterVault.address)).to.be.equal(0);
                const code = ethers.utils.formatBytes32String("TheCode");
                await expect(davosProvider.provideWithReferral("2" + wad, code, {value: "1" + wad}))
                  .to.be.revertedWith("DavosProvider/erc20-not-accepted");
                await expect(davosProvider.provideWithReferral(0, code, {value: "1" + wad}))
                  .to.emit(davosProvider, 'Referral').withArgs(code)
                  .and
                  .to.emit(davosProvider, 'Deposit').withArgs(deployer.address, 1+wad);
                expect(await collateralToken.balanceOf(masterVault.address)).to.be.equal("1" + wad);
            });
        })
    });
});