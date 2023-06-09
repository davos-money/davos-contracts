const { ethers, network, upgrades} = require('hardhat');
const { expect } = require("chai");
const {BigNumber} = require("ethers");

describe('WstETHOracle', function () {
    let deployer, signer1, signer2;

    let wad = "000000000000000000", // 18 Decimals
        ray = "000000000000000000000000000", // 27 Decimals
        rad = "000000000000000000000000000000000000000000000"; // 45 Decimals

    let collateral = ethers.utils.formatBytes32String("TEST");
    let maxPools = 5;

    let oracle, mVault, token;

    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
    const ST_ETH_PRICE = '100000000000';
    const ST_ETH_PRICE_18_DECIMALS = ST_ETH_PRICE + '0000000000'

    beforeEach(async function () {

        [deployer, signer1, signer2] = await ethers.getSigners();

        // Contract factory
        this.WstETHOracle = await ethers.getContractFactory("WstETHOracle");
        this.AggregatorV3 = await ethers.getContractFactory("MockAggregator");
        this.Token = await ethers.getContractFactory("Token");
        this.MasterVaultV2 = await ethers.getContractFactory("MasterVault_V2");

        const aggregator = await this.AggregatorV3.deploy(ST_ETH_PRICE); // price is 1000.00000000
        await aggregator.deployed()
        token = await upgrades.deployProxy(this.Token, ["Wrapped Staked Ether", "wstETH"], {initializer: "initialize"});
        await token.deployed();
        mVault = await upgrades.deployProxy(this.MasterVaultV2, ["Master Vault Token", "ceETH", 1000, token.address], {initializer: "initialize"});
        await mVault.deployed();
        await mVault.changeYieldHeritor(deployer.address);

        oracle = await upgrades.deployProxy(this.WstETHOracle, [aggregator.address, token.address, mVault.address], {initializer: "initialize"});
        await oracle.deployed();
    });

    describe('general', function () {
        it('initial price is equal', async function () {
            const peek = await oracle.peek();
            expect(BigNumber.from(peek[0]).toString()).to.be.eq(ST_ETH_PRICE_18_DECIMALS);
        });

        it('wst eth ratio changed', async () => {
            await token.setRatio("950000000000000000");
            const peek = await oracle.peek();
            expect(BigNumber.from(peek[0]).toString()).to.be.eq('1052631578947368421000'); // 1000 / 0.95
        });

        it('master vault deposited', async () => {
          const amount = ethers.utils.parseEther('1');

          await mVault.changeProvider(signer1.address);
          await token.mint(signer1.address, ethers.utils.parseEther('10'));
          await token.connect(signer1).approve(mVault.address, ethers.utils.parseEther('10'));
          await mVault.connect(signer1).depositUnderlying(signer1.address, amount);

          let peek = await oracle.peek();
          expect(BigNumber.from(peek[0]).toString()).to.be.eq(ST_ETH_PRICE_18_DECIMALS);

          await token.setRatio("990000000000000000");
          peek = await oracle.peek();
          expect(BigNumber.from(peek[0].toString())).to.be.eq('1009090909090909090899');

          await token.setRatio("980000000000000000");
          peek = await oracle.peek();
          expect(BigNumber.from(peek[0]).toString()).to.be.eq('1018367346938775509756');

          await mVault.claimYield();
          peek = await oracle.peek();
          expect(BigNumber.from(peek[0]).toString()).to.be.eq('1018367346938775509756');

          // withdraw
          await mVault.connect(signer1).withdrawUnderlying(deployer.address, ethers.utils.parseEther('0.5'));
          peek = await oracle.peek();
          expect(BigNumber.from(peek[0]).toString()).to.be.eq('1018367346938775509756');
        });
    });
});