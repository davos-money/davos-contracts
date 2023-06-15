const { ethers, network, upgrades} = require('hardhat');
const { expect } = require("chai");
const {BigNumber} = require("ethers");

describe('RethOracle', function () {
    let deployer, signer1, signer2;

    let oracle, mVault, token, aggregator1, aggregator2;

    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
    const R_ETH_PRICE = '100000000000';
    const R_ETH_PRICE_18_DECIMALS = R_ETH_PRICE + '0000000000'

    beforeEach(async function () {

        [deployer, signer1, signer2] = await ethers.getSigners();

        // Contract factory
        this.RethOracle = await ethers.getContractFactory("RethOracle");
        this.AggregatorV3 = await ethers.getContractFactory("MockAggregator");
        this.Token = await ethers.getContractFactory("Token");
        this.MasterVaultV2 = await ethers.getContractFactory("MasterVault_V2");
        this.RatioAdapter = await ethers.getContractFactory("RatioAdapter");

        aggregator1 = await this.AggregatorV3.deploy('100000000'); // price is equal
        await aggregator1.deployed();
        aggregator2 = await this.AggregatorV3.deploy(R_ETH_PRICE); // price is 1000.00000000
        await aggregator2.deployed()

        token = await upgrades.deployProxy(this.Token, ["Wrapped Staked Ether", "rETH"], {initializer: "initialize"});
        await token.deployed();
        mVault = await upgrades.deployProxy(this.MasterVaultV2, ["Master Vault Token", "ceETH", 1000, token.address], {initializer: "initialize"});
        await mVault.deployed();
        await mVault.changeYieldHeritor(deployer.address);

        const adapter = await upgrades.deployProxy(this.RatioAdapter, [], {initializer: "initialize"});
        await adapter.deployed();
        await adapter.setToken(token.address, 'getRethValue(uint256)', 'getEthValue(uint256)', '', false);
        await mVault.changeAdapter(adapter.address);

        oracle = await upgrades.deployProxy(this.RethOracle, [aggregator1.address, aggregator2.address, mVault.address], {initializer: "initialize"});
        await oracle.deployed();

    });

    describe('general', function () {
        it('initial price is equal', async function () {
            const peek = await oracle.peek();
            expect(BigNumber.from(peek[0]).toString()).to.be.eq(R_ETH_PRICE_18_DECIMALS);
        });

        it('wst eth ratio changed', async () => {
            await aggregator1.update('105263158') //
            await token.setRatio("950000000000000000");
            const peek = await oracle.peek();
            expect(BigNumber.from(peek[0]).toString()).to.be.eq('1052631580000000000000'); // 1000 / 0.95
        });

        it('master vault changes does not affect the price', async () => {
          const amount = ethers.utils.parseEther('1');
          await token.setRatio("1000000000000000000");

          await mVault.changeProvider(signer1.address);
          await token.mint(signer1.address, ethers.utils.parseEther('10'));
          await token.connect(signer1).approve(mVault.address, ethers.utils.parseEther('10'));
          await mVault.connect(signer1).deposit(amount, signer1.address);

          let peek = await oracle.peek();
          expect(BigNumber.from(peek[0]).toString()).to.be.eq(R_ETH_PRICE_18_DECIMALS);

          await aggregator1.update('125000000') // // 1.25
          await token.setRatio("800000000000000000");
          peek = await oracle.peek();
          expect(BigNumber.from(peek[0]).toString()).to.be.eq('1225000000000000000000'); // 1900.000000000000000000 USD

          await aggregator1.update('200000000') // 2
          await token.setRatio("500000000000000000");
          peek = await oracle.peek();
          expect(BigNumber.from(peek[0]).toString()).to.be.eq('1900000000000000000000'); // 1900.000000000000000000 USD

          await mVault.claimYield();
          peek = await oracle.peek();
          expect(BigNumber.from(peek[0]).toString()).to.be.eq('1900000000000000000000'); // 1900.000000000000000000 USD

          // withdraw
          await mVault.connect(signer1).redeem(ethers.utils.parseEther('0.1'), signer1.address, signer1.address);
          peek = await oracle.peek();
          expect(BigNumber.from(peek[0]).toString()).to.be.eq('1900000000000000000000', 'wrong price after redeem');
        });
    });
});