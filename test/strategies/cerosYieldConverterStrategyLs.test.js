const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { joinSignature } = require('ethers/lib/utils');
const { ethers, network } = require('hardhat');
const Web3 = require('web3');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const DATA = "0x02";

describe('===CerosYieldConverterStretgyLs===', function () {
    let deployer, signer1, signer2, signer3;

    let underlying,
        cerosRouter;

    beforeEach(async function () {

        ////////////////////////////////
        /** Deployments ------------ **/
        ////////////////////////////////

        [deployer, signer1, signer2, signer3] = await ethers.getSigners();

        // Contract factory
        this.Token = await hre.ethers.getContractFactory("Token");
        this.CeaMATICc = await hre.ethers.getContractFactory("CeToken");
        this.CeVault = await hre.ethers.getContractFactory("CeVault");
        this.CerosRouter = await hre.ethers.getContractFactory("CerosRouterLs");
        this.Pool = await hre.ethers.getContractFactory("PolygonPool");
        this.Cycs = await hre.ethers.getContractFactory("CerosYieldConverterStrategyLs");

        // Contract deployment
        amaticc = await this.Token.deploy();
        await amaticc.deployed();
        underlying = await this.Token.deploy();
        await underlying.deployed();
        amaticb = await this.Token.deploy();
        await amaticb.deployed();
        ceaMATICc = await upgrades.deployProxy(this.CeaMATICc, ["ceaMATICc", "ceaMATICc"], {initializer: "initialize"});
        await ceaMATICc.deployed();

        pool = await this.Pool.deploy(amaticc.address, underlying.address);
        await pool.deployed();
        ceVault = await upgrades.deployProxy(this.CeVault, ["CEROS aMATICc Vault", ceaMATICc.address, amaticc.address], {initializer: "initialize"});
        await ceVault .deployed();
        cerosRouter = await upgrades.deployProxy(this.CerosRouter, [amaticc.address, underlying.address, amaticb.address, ceVault.address, signer3.address, 0, pool.address, NULL_ADDRESS], {initializer: "initialize"});
        await cerosRouter.deployed();
        cycs = await upgrades.deployProxy(this.Cycs, [cerosRouter.address, signer1.address, underlying.address, signer2.address], {initializer: "initialize"});
        await cycs.deployed();

        // Contract initialization
        await amaticc.initialize("amaticc", "aMATICc");
        await amaticb.initialize("amaticb", "aMATICb");
        await underlying.initialize("Matic Token", "MATIC");
        await ceVault.changeRouter(cerosRouter.address);
        await ceaMATICc.changeVault(ceVault.address);
    });

    describe('--- initialize()', function () {
        it('checks correct initialization', async function () {
            expect(await cerosRouter.s_pool()).to.be.equal(pool.address);
        });
    });
    describe('--- changeDestination()', function () {
        it('reverts: 0 address', async function () {
            await expect(cycs.changeDestination(NULL_ADDRESS)).to.be.revertedWith("");
        });
        it('changes destination address', async function () {
            await cycs.changeDestination(signer2.address);
            expect(await cycs.destination()).to.be.equal(signer2.address);
        });
    });
    describe('--- canDeposit()/canWithdraw()', function () {
        it('returns depositable amount', async function () {
            let map = await cycs.canDeposit(1);
            expect(map[0]).to.be.equal(1);
            expect(map[1]).to.be.equal(1);
        });
        it('returns withdrawable amount', async function () {
            let map = await cycs.canWithdraw(1);
            expect(map[0]).to.be.equal(1);
            expect(map[1]).to.be.equal(1);
        });
    });
    describe('--- deposit()', function () {
        it('reverts: Strategy/not-masterVault', async function () {
            await expect(cycs.deposit(1)).to.be.revertedWith("Strategy/not-masterVault");
        });
        it('reverts: Strategy/insufficient-balance', async function () {
            await expect(cycs.connect(signer2).deposit(1)).to.be.revertedWith("Strategy/insufficient-balance");
        });
        it('reverts: Strategy/invalid-amount', async function () {
            await underlying.mint(cycs.address, "1000000000000000000");
            await expect(cycs.connect(signer2).deposit(0)).to.be.revertedWith("Strategy/invalid-amount");
        });
        it('deposits amount into ceros', async function () {
            await amaticc.setRatio("1000000000000000000");
            await underlying.mint(cycs.address, "1000000000000000000");
            await cycs.connect(signer2).deposit("1000000000000000000");
            expect(await underlying.balanceOf(cycs.address)).to.be.equal(0);
        });
    });
    describe('--- withdraw()', function () {
        it('reverts: Strategy/invalid-amount', async function () {
            await amaticc.setRatio("1000000000000000000");
            await underlying.mint(cycs.address, "1000000000000000000");
            await cycs.connect(signer2).deposit("1000000000000000000");
            await expect(cycs.connect(signer2).withdraw(signer2.address, 0)).to.be.revertedWith("Strategy/invalid-amount");
        });
        it('withdraws amount from ceros', async function () {
            await amaticc.setRatio("1000000000000000000");
            await underlying.mint(cycs.address, "1000000000000000000");
            await cycs.connect(signer2).deposit("1000000000000000000");
            expect(await underlying.balanceOf(cycs.address)).to.be.equal(0);

            await cerosRouter.changeStrategy(cycs.address);
            await cycs.connect(signer2).withdraw(cycs.address, "1000000000000000000");
            expect(await underlying.balanceOf(cycs.address)).to.be.equal("1000000000000000000");
        });
    });
    describe('--- harvest()', function () {
        it('tries harvesting yield', async function () {
            await cycs.setStrategist(signer2.address);
            await cycs.connect(signer2).harvest();
        });
    });
});