const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { joinSignature } = require('ethers/lib/utils');
const { ethers, network } = require('hardhat');
const Web3 = require('web3');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const DATA = "0x02";

describe('===MasterVault_V2===', function () {
    let deployer, signer1, signer2, signer3, signer4, yieldHeritor;

    let token, 
        mv;
    let wad = "000000000000000000", // 18 Decimals
        ray = "000000000000000000000000000", // 27 Decimals
        rad = "000000000000000000000000000000000000000000000", // 45 Decimals
        ONE = 10 ** 27;


    let collateral = ethers.utils.formatBytes32String("aMATICc");

    beforeEach(async function () {

        [deployer, signer1, signer2, signer3, signer4, yieldHeritor] = await ethers.getSigners();

        // Contract factory
        this.Token = await ethers.getContractFactory("Token");
        this.MasterVault_V2 = await ethers.getContractFactory("MasterVault_V2");

        // Contract deployment
        token = await upgrades.deployProxy(this.Token, ["Wrapped Staked Ether", "wstETH"], {initializer: "initialize"});
        await token.deployed();
        await token.setRatio("950000000000000000");
        mv = await upgrades.deployProxy(this.MasterVault_V2, ["Master Vault Token", "ceMATIC", 1000, token.address, deployer.address], {initializer: "initialize"});
        await mv.deployed();
    });

    describe('--- General', function () {
        it('---general', async function () {
            this.timeout(1500000000);

            await mv.changeYieldHeritor(yieldHeritor.address);
            await token.mint(deployer.address, "1000000000000000000");
            await token.mint(signer1.address, "7000000000000000000");
            await token.mint(signer2.address, "11000000000000000000");

            await token.connect(deployer).approve(mv.address,"1000000000000000000");
            await token.connect(signer1).approve(mv.address, "7000000000000000000");
            await token.connect(signer2).approve(mv.address, "11000000000000000000");

            await mv.connect(signer1).depositUnderlying(signer1.address, "7000000000000000000");
            await mv.connect(signer2).depositUnderlying(signer2.address, "11000000000000000000");

            console.log("--- Ratio: 950000000000000000");
            console.log("Deposit: " + await token.balanceOf(mv.address));
            console.log("S1_Balance: " + await mv.balanceOf(signer1.address));
            console.log("S2_Balance: " + await mv.balanceOf(signer2.address));
            console.log("H_Balance: " + await token.balanceOf(yieldHeritor.address));
            await expect(mv.claimYield()).to.be.revertedWith("MasterVault_V2/no-vault-yields");

            await token.setRatio("940000000000000000");
            console.log("--- Ratio: a 940000000000000000");
            console.log("Deposit: " + await token.balanceOf(mv.address));
            console.log("S1_Balance: " + await mv.balanceOf(signer1.address));
            console.log("S2_Balance: " + await mv.balanceOf(signer2.address));
            console.log("H_Balance: " + await token.balanceOf(yieldHeritor.address));

            console.log("--- Ratio: b 940000000000000000");
            console.log("Principle : " + await mv.getVaultPrinciple());
            console.log("Yield     : " + await mv.getVaultYield());
            await mv.claimYield();
            console.log("Yield     : " + await mv.getVaultYield());
            console.log("Deposit: " + await token.balanceOf(mv.address));
            console.log("H_Balance: " + await token.balanceOf(yieldHeritor.address));

            await token.setRatio("920000000000000000");
            console.log("--- Ratio: 920000000000000000 ; margin: 20%");
            await mv.changeYieldMargin("2000");
            console.log("Principle : " + await mv.getVaultPrinciple());
            console.log("Yield     : " + await mv.getVaultYield());
            await mv.claimYield();

            console.log("--- All withdraw");
            await mv.connect(signer1).withdrawUnderlying(signer1.address, "7000000000000000000");
            await mv.connect(signer2).withdrawUnderlying(signer2.address, "11000000000000000000");
            console.log("Deposit: " + await token.balanceOf(mv.address));
            console.log("S1_Balance: " + await mv.balanceOf(signer1.address));
            console.log("S2_Balance: " + await mv.balanceOf(signer2.address));
            console.log("H_Balance: " + await token.balanceOf(yieldHeritor.address));
            console.log("Principle : " + await mv.getVaultPrinciple());
            console.log("Yield     : " + await mv.getVaultYield());
            await expect(mv.claimYield()).to.be.revertedWith("MasterVault_V2/no-vault-yields");
            console.log("Yield     : " + await mv.getVaultYield());
            console.log("Deposit: " + await token.balanceOf(mv.address));
            console.log("Wallet1: " + await token.balanceOf(signer1.address));
            console.log("Wallet2: " + await token.balanceOf(signer2.address));
        });
    });
});