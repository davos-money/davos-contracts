const { ethers, network } = require('hardhat');
const { expect } = require("chai");

describe('===DgtToken===', function () {
    let deployer, signer1, signer2;

    let wad = "000000000000000000", // 18 Decimals
        ray = "000000000000000000000000000", // 27 Decimals
        rad = "000000000000000000000000000000000000000000000"; // 45 Decimals

    let collateral = ethers.utils.formatBytes32String("TEST");

    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {

        [deployer, signer1, signer2] = await ethers.getSigners();

        // Contract factory
        this.DgtToken = await ethers.getContractFactory("DGTToken");

        // Contract deployment
        dgttoken = await upgrades.deployProxy(this.DgtToken, ["100" + wad, deployer.address], {initializer: "initialize"});
        await dgttoken.deployed();
    });

    describe('--- initialize()', function () {
        it('initialize', async function () {
            expect(await dgttoken.symbol()).to.be.equal("DGT");
        });
    });
    describe('--- rely()', function () {
        it('reverts: DgtToken/not-authorized', async function () {
            await dgttoken.deny(deployer.address);
            await expect(dgttoken.rely(signer1.address)).to.be.revertedWith("DgtToken/not-authorized");
            expect(await dgttoken.wards(signer1.address)).to.be.equal("0");
        });
        it('reverts: DgtToken/invalid-address', async function () {
            await expect(dgttoken.rely(NULL_ADDRESS)).to.be.revertedWith("DgtToken/invalid-address");
        });
        it('relies on address', async function () {
            await dgttoken.rely(signer1.address);
            expect(await dgttoken.wards(signer1.address)).to.be.equal("1");
        });
    });
    describe('--- deny()', function () {
        it('reverts: DgtToken/not-authorized', async function () {
            await dgttoken.deny(deployer.address);
            await expect(dgttoken.deny(signer1.address)).to.be.revertedWith("DgtToken/not-authorized");
        });
        it('reverts: DgtToken/invalid-address', async function () {
            await expect(dgttoken.deny(NULL_ADDRESS)).to.be.revertedWith("DgtToken/invalid-address");
        });
        it('denies an address', async function () {
            await dgttoken.rely(signer1.address);
            expect(await dgttoken.wards(signer1.address)).to.be.equal("1");
            await dgttoken.deny(signer1.address);
            expect(await dgttoken.wards(signer1.address)).to.be.equal("0");
        });
    });
    describe('--- mint()', function () {
        it('reverts: DgtToken/rewards-oversupply', async function () {
            await expect(dgttoken.mint(deployer.address, "1000" + wad)).to.be.revertedWith("DgtToken/rewards-oversupply");
        });
        it('mints davos to an address', async function () {
            await dgttoken.mint(signer1.address, "1" + wad);
            expect(await dgttoken.balanceOf(signer1.address)).to.be.equal("1" + wad);
        });
    });
    describe('--- burn()', function () {
        it('burns from address', async function () {
            await dgttoken.mint(signer1.address, "1" + wad);
            await dgttoken.connect(signer1).burn("1" + wad);
            expect(await dgttoken.balanceOf(signer1.address)).to.be.equal(0);
        });
    });
    describe('--- pause()', function () {
        it('pauses transfers', async function () {
            await dgttoken.pause();
            expect(await dgttoken.paused()).to.be.equal(true);
        });
    });
    describe('--- unpause()', function () {
        it('unpauses transfers', async function () {
            await dgttoken.pause();
            expect(await dgttoken.paused()).to.be.equal(true);

            await dgttoken.unpause();
            expect(await dgttoken.paused()).to.be.equal(false);
        });
    });
});