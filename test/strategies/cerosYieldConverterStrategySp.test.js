const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { joinSignature } = require('ethers/lib/utils');
const { ethers, network } = require('hardhat');
const Web3 = require('web3');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const DATA = "0x02";

describe('===CerosYieldConverterStretgySp===', function () {
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
        this.CerosRouter = await hre.ethers.getContractFactory("CerosRouterSp");
        this.Cycs = await hre.ethers.getContractFactory("CerosYieldConverterStrategySp");
        this.Lp = await hre.ethers.getContractFactory("LP");
        this.SwapPool = await hre.ethers.getContractFactory("SwapPool");

        // Contract deployment
        amaticc = await this.Token.deploy();
        await amaticc.deployed();
        underlying = await this.Token.deploy();
        await underlying.deployed();
        amaticb = await this.Token.deploy();
        await amaticb.deployed();
        ceaMATICc = await upgrades.deployProxy(this.CeaMATICc, ["ceaMATICc", "ceaMATICc"], {initializer: "initialize"});
        await ceaMATICc.deployed();

        lp = await this.Lp.connect(deployer).deploy();
        await lp.deployed();
        swapPool = await upgrades.deployProxy(this.SwapPool,
          [underlying.address,
          amaticc.address,
          lp.address,
          false,
          false],
          {initializer: "initialize"}
        );
        await swapPool.deployed();

        ceVault = await upgrades.deployProxy(this.CeVault, ["CEROS aMATICc Vault", ceaMATICc.address, amaticc.address], {initializer: "initialize"});
        await ceVault .deployed();
        cerosRouter = await upgrades.deployProxy(this.CerosRouter, [amaticc.address, underlying.address, ceaMATICc.address, ceVault.address, signer3.address, 0, swapPool.address, NULL_ADDRESS], {initializer: "initialize"});
        await cerosRouter.deployed();
        cycs = await upgrades.deployProxy(this.Cycs, [cerosRouter.address, signer1.address, underlying.address, amaticc.address, signer3.address, swapPool.address], {initializer: "initialize"});
        await cycs.deployed();

        // // Contract initialization
        await amaticc.initialize("amaticc", "aMATICc");
        await amaticb.initialize("amaticb", "aMATICb");
        await underlying.initialize("Matic Token", "MATIC");
        await ceVault.changeRouter(cerosRouter.address);
        await ceaMATICc.changeVault(ceVault.address);
        await lp.setSwapPool(swapPool.address);
    });

    describe('--- initialize()', function () {
        it('checks correct initialization', async function () {
            expect(await cerosRouter.getPoolAddress()).to.be.equal(swapPool.address);
        });
    });
    describe('--- changeRouter()', function () {
        it('reverts: 0 address', async function () {
            await expect(cycs.changeCeRouter(NULL_ADDRESS)).to.be.revertedWith("");
        });
        it('changes destination address', async function () {
            await cycs.changeCeRouter(signer2.address);
            expect(await cycs._ceRouter()).to.be.equal(signer2.address);
        });
    });
    describe('--- changeSwapPool()', function () {
        it('reverts: 0 address', async function () {
            await expect(cycs.changeSwapPool(NULL_ADDRESS)).to.be.revertedWith("");
        });
        it('changes destination address', async function () {
            await cycs.changeSwapPool(signer2.address);
            expect(await cycs._swapPool()).to.be.equal(signer2.address);
        });
    });
    describe('--- changeFeeFlag()', function () {
        it('changes destination address', async function () {
            await cycs.changeFeeFlag(true);
            expect(await cycs.feeFlag()).to.be.equal(true);
        });
    });
    describe('--- canDeposit()/canWithdraw()', function () {
        it('returns depositable amount when enough liquidity', async function () {
            await amaticc.mint(signer1.address, "30000000000000000000");
            await underlying.mint(signer1.address, "30000000000000000000");
            await amaticc.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await underlying.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await swapPool.connect(signer1).addLiquidity("30000000000000000000", "30000000000000000000"); 

            let value = await cycs.canDeposit("1000000000000000000");
            expect(value[0]).to.be.equal("1000000000000000000");
        });
        it('returns depositable amount when not enough liquidity', async function () {
            await amaticc.mint(signer1.address, "30000000000000000000");
            await underlying.mint(signer1.address, "30000000000000000000");
            await amaticc.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await underlying.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await swapPool.connect(signer1).addLiquidity("30000000000000000000", "30000000000000000000"); 

            let value = await cycs.canDeposit("300000000000000000000"); // 300
            expect(value[0]).to.be.equal("30000000000000000000"); // 30 -> remaining liquidity
        });
        it('returns withdrawable amount when enough liquidity', async function () {
            await amaticc.mint(signer1.address, "30000000000000000000");
            await underlying.mint(signer1.address, "30000000000000000000");
            await amaticc.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await underlying.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await swapPool.connect(signer1).addLiquidity("30000000000000000000", "30000000000000000000"); 

            let value = await cycs.canWithdraw("1000000000000000000");
            expect(value[0]).to.be.equal("1000000000000000000");
        });
        it('returns withdrawable amount when not enough liquidity', async function () {
            await amaticc.mint(signer1.address, "30000000000000000000");
            await underlying.mint(signer1.address, "30000000000000000000");
            await amaticc.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await underlying.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await swapPool.connect(signer1).addLiquidity("30000000000000000000", "30000000000000000000"); 

            let value = await cycs.canWithdraw("300000000000000000000"); // 300
            expect(value[0]).to.be.equal("30000000000000000000"); // 30 -> remaining liquidity
        });
        it('returns withdrawable amount when enough amount with strategy', async function () {
            await amaticc.mint(signer1.address, "30000000000000000000");
            await underlying.mint(signer1.address, "30000000000000000000");
            await amaticc.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await underlying.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await swapPool.connect(signer1).addLiquidity("30000000000000000000", "30000000000000000000"); 

            await underlying.mint(cycs.address, "300000000000000000000");
            let value = await cycs.canWithdraw("200000000000000000000");
            expect(value[0]).to.be.equal("200000000000000000000");
        });
    });
    describe('--- deposit()', function () {
        it('reverts: Strategy/not-masterVault', async function () {
            await expect(cycs.deposit(1)).to.be.revertedWith("!vault");
        });
        it('reverts: Strategy/insufficient-balance', async function () {
            await expect(cycs.connect(signer3).deposit(1)).to.be.revertedWith("insufficient balance");
        });
        it('reverts: Strategy/invalid-amount', async function () {
            await underlying.mint(cycs.address, "1000000000000000000");
            await expect(cycs.connect(signer3).deposit(0)).to.be.revertedWith("invalid amount");
        });
        it('deposits amount into ceros', async function () {
            await amaticc.mint(signer1.address, "30000000000000000000");
            await underlying.mint(signer1.address, "30000000000000000000");
            await amaticc.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await underlying.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await swapPool.connect(signer1).addLiquidity("30000000000000000000", "30000000000000000000"); 

            await amaticc.setRatio("1000000000000000000");
            await underlying.mint(cycs.address, "1000000000000000000");
            expect(await amaticc.balanceOf(ceVault.address)).to.be.equal(0);
            await cycs.connect(signer3).deposit("1000000000000000000");
            expect(await amaticc.balanceOf(ceVault.address)).to.be.equal("1000000000000000000"); // Ratio is 1e18

        });
    });
    describe('--- withdraw()', function () {
        it('reverts: Strategy/invalid-amount', async function () {
            await amaticc.mint(signer1.address, "30000000000000000000");
            await underlying.mint(signer1.address, "30000000000000000000");
            await amaticc.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await underlying.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await swapPool.connect(signer1).addLiquidity("30000000000000000000", "30000000000000000000"); 

            await amaticc.setRatio("1000000000000000000");
            await underlying.mint(cycs.address, "1000000000000000000");
            await cycs.connect(signer3).deposit("1000000000000000000");
            await expect(cycs.connect(signer3).withdraw(signer2.address, 0)).to.be.revertedWith("invalid amount");
        });
        it('withdraws amount from ceros', async function () {
            await amaticc.mint(signer1.address, "30000000000000000000");
            await underlying.mint(signer1.address, "30000000000000000000");
            await amaticc.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await underlying.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await swapPool.connect(signer1).addLiquidity("30000000000000000000", "30000000000000000000"); 

            await amaticc.setRatio("1000000000000000000");
            await underlying.mint(cycs.address, "1000000000000000000");
            await cycs.connect(signer3).deposit("1000000000000000000");

            await cycs.connect(signer3).withdraw(signer2.address, "1000000000000000000");
            expect(await underlying.balanceOf(signer3.address)).to.be.equal("1000000000000000000");
        });
        it('withdraws amount from ceros strategy', async function () {
            await amaticc.mint(signer1.address, "30000000000000000000");
            await underlying.mint(signer1.address, "30000000000000000000");
            await amaticc.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await underlying.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await swapPool.connect(signer1).addLiquidity("30000000000000000000", "30000000000000000000"); 

            await amaticc.setRatio("1000000000000000000");
            await underlying.mint(cycs.address, "1000000000000000000");
            await cycs.connect(signer3).deposit("1000000000000000000");

            await underlying.mint(cycs.address, "30000000000000000000");
            await cycs.connect(signer3).withdraw(signer2.address, "1000000000000000000");
            expect(await underlying.balanceOf(signer3.address)).to.be.equal("1000000000000000000");
        });
        it('withdraws more than available from ceros strategy', async function () {
            await amaticc.mint(signer1.address, "30000000000000000000");
            await underlying.mint(signer1.address, "30000000000000000000");
            await amaticc.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await underlying.connect(signer1).approve(swapPool.address, "30000000000000000000");
            await swapPool.connect(signer1).addLiquidity("30000000000000000000", "30000000000000000000"); 

            await amaticc.setRatio("1000000000000000000");
            await underlying.mint(cycs.address, "1000000000000000000");
            await cycs.connect(signer3).deposit("1000000000000000000");

            await underlying.mint(cycs.address, "30000000000000000000");
            await cycs.connect(signer3).withdraw(signer2.address, "100000000000000000000");
            expect(await underlying.balanceOf(signer3.address)).to.be.equal("0");
        });
    });
    describe('--- harvest()/harvestAndSwap()', function () {
        it('tries harvesting yield', async function () {
            await cycs.setStrategist(signer2.address);
            await cycs.connect(signer2).harvest();
            await cycs.connect(signer2).harvestAndSwap();
        });
    });
});