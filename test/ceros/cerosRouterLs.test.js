const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { joinSignature } = require('ethers/lib/utils');
const { ethers, network } = require('hardhat');
const Web3 = require('web3');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const DATA = "0x02";

describe('===CerosRouterLs===', function () {
    let deployer, signer1, signer2, signer3, multisig;

    let amaticc,
        amaticb,
        matic,
        ceVault,
        ceaMATICc,
        cerosRouter;

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
        this.CerosRouter = await hre.ethers.getContractFactory("CerosRouterLs");
        this.Pool = await hre.ethers.getContractFactory("PolygonPool");

        // Contract deployment
        amaticc = await this.Token.deploy();
        await amaticc.deployed();
        matic = await this.Token.deploy();
        await matic.deployed();
        amaticb = await this.Token.deploy();
        await amaticb.deployed();
        pool = await this.Pool.deploy(amaticc.address, matic.address);
        await pool.deployed();
        ceaMATICc = await upgrades.deployProxy(this.CeaMATICc, ["ceaMATICc", "ceaMATICc"], {initializer: "initialize"});
        await ceaMATICc.deployed();
        ceVault = await upgrades.deployProxy(this.CeVault, ["CEROS aMATICc Vault", ceaMATICc.address, amaticc.address], {initializer: "initialize"});
        await ceVault .deployed();
        cerosRouter = await upgrades.deployProxy(this.CerosRouter, [amaticc.address, matic.address, amaticb.address, ceVault.address, signer3.address, 0, pool.address, NULL_ADDRESS], {initializer: "initialize"});
        await cerosRouter.deployed();

        // Contract initialization
        await amaticc.initialize("amaticc", "aMATICc");
        await amaticb.initialize("amaticb", "aMATICb");
        await matic.initialize("Matic Token", "MATIC");
        await ceVault.changeRouter(cerosRouter.address);
        await ceaMATICc.changeVault(ceVault.address);
    });

    describe('--- initialize()', function () {
        it('checks correct initialization', async function () {
            expect(await cerosRouter.s_pool()).to.be.equal(pool.address);
        });
    });
    describe('--- deposit()', function () {
        it('reverts: CerosRouter/invalid-amount', async function () {
            await expect(cerosRouter.deposit(0)).to.be.revertedWith("CerosRouter/invalid-amount");
        });
        it('reverts: CerosRouter/price-low', async function () {
            await pool.setMinimumStake("1000000000000000000");
            await matic.mint(deployer.address, "100000000000000000");
            await matic.approve(cerosRouter.address, "100000000000000000");
            await expect(cerosRouter.deposit("100000000000000000")).to.be.revertedWith("CerosRouter/price-low");
        });
        it('reverts: CerosRouter/wrong-certToken-amount-in-CerosRouter', async function () {
            await pool.setMinimumStake("100000000000000000");
            await matic.mint(deployer.address, "1000000000000000000");
            await matic.approve(cerosRouter.address, "1000000000000000000");
            await pool.setReturn0(true);
            await expect(cerosRouter.deposit("1000000000000000000")).to.be.revertedWith("CerosRouter/wrong-certToken-amount-in-CerosRouter");
        });
        it('deposits matic into cerosRouter', async function () {
            await pool.setMinimumStake("100000000000000000");
            await matic.mint(deployer.address, "100000000000000000");
            await matic.approve(cerosRouter.address, "100000000000000000");
            await cerosRouter.deposit("100000000000000000");

            expect(await matic.balanceOf(pool.address)).to.be.equal("100000000000000000");
            expect(await amaticc.balanceOf(ceVault.address)).to.be.equal("100000000000000000");
        });
    });
    describe('--- withdrawAMATICc()', function () {
        it('checks amatic withdrawal', async function () {
            await pool.setMinimumStake("100000000000000000");
            await matic.mint(deployer.address, "100000000000000000");
            await matic.approve(cerosRouter.address, "100000000000000000");
            await cerosRouter.deposit("100000000000000000");

            await cerosRouter.withdrawAMATICc(deployer.address, "100000000000000000");
            expect(await amaticc.balanceOf(ceVault.address)).to.be.equal(0);
            expect(await amaticc.balanceOf(deployer.address)).to.be.equal("100000000000000000");
        });
    });
    describe('--- withdrawFor()', function () {
        it('checks withdraw onbehalf', async function () {
            await pool.setMinimumStake("100000000000000000");
            await matic.mint(deployer.address, "100000000000000000");
            await matic.approve(cerosRouter.address, "100000000000000000");
            await cerosRouter.deposit("100000000000000000");

            await expect(cerosRouter.connect(signer2).withdrawFor(deployer.address, "100000000000000000")).to.be.revertedWith("CerosRouter/not-owner-or-strategy");
            await cerosRouter.withdrawFor(deployer.address, "100000000000000000");
            expect(await amaticc.balanceOf(ceVault.address)).to.be.equal(0);
            expect(await matic.balanceOf(deployer.address)).to.be.equal("100000000000000000");
        });
    });
    describe('--- pause() and unpause()', function () {
        it('pauses the contract', async function () {
            await cerosRouter.pause();      
            expect(await cerosRouter.paused()).to.be.equal(true);
        });
        it('unpauses the contract', async function () {
            await cerosRouter.pause();      
            await cerosRouter.unpause();      
            expect(await cerosRouter.paused()).to.be.equal(false);
        });
    });
    describe('--- Setters', function () {
        it('changes price getter', async function () {
            await cerosRouter.changePriceGetter(signer3.address);     
            expect(await cerosRouter.s_priceGetter()).to.be.equal(signer3.address);
        });
        it('changes pair fee', async function () {
            await cerosRouter.changePairFee(1);      
            expect(await cerosRouter.s_pairFee()).to.be.equal(1);
        });
        it('changes strategy', async function () {
            await cerosRouter.changeStrategy(signer3.address);      
            expect(await cerosRouter.s_strategy()).to.be.equal(signer3.address);
        });
        it('changes pool', async function () {
            await cerosRouter.changePool(signer3.address);      
            expect(await cerosRouter.s_pool()).to.be.equal(signer3.address);
        });
        it('changes dex', async function () {
            await cerosRouter.changeDex(signer3.address);      
            expect(await cerosRouter.s_dex()).to.be.equal(signer3.address);
        });
        it('changes ceVault', async function () {
            await cerosRouter.changeCeVault(signer3.address);      
            expect(await cerosRouter.s_ceVault()).to.be.equal(signer3.address);
        });
    });
    describe('--- Views', function () {
        it('gets yield for', async function () {
            await pool.setMinimumStake("100000000000000000");
            await matic.mint(deployer.address, "100000000000000000");
            await matic.approve(cerosRouter.address, "100000000000000000");
            await cerosRouter.deposit("100000000000000000");

            await amaticc.setRatio("4000000000000000");
            expect(await cerosRouter.getYieldFor(deployer.address)).to.be.equal("99600000000000000");
        });
    });
    describe('--- claim()/claimProfit()', function () {
        it('claims yield and profit', async function () {
            await pool.setGiveMore(true);

            await pool.setMinimumStake("100000000000000000");
            await matic.mint(deployer.address, "100000000000000000");
            await matic.approve(cerosRouter.address, "100000000000000000");

            await expect(cerosRouter.claimProfit(deployer.address)).to.be.revertedWith("CerosRouter/no-profits");

            await cerosRouter.deposit("100000000000000000");

            await amaticc.setRatio("4000000000000000");
            expect(await cerosRouter.getYieldFor(deployer.address)).to.be.equal("99600000000000000");

            await cerosRouter.claim(deployer.address);
            expect(await cerosRouter.getYieldFor(deployer.address)).to.be.equal("0");
        });
    });
});