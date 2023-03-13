const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { joinSignature } = require('ethers/lib/utils');
const { ethers, network } = require('hardhat');
const Web3 = require('web3');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const DATA = "0x02";

describe('===Oracles===', function () {
    let deployer, signer1, signer2, signer3, multisig;

    let vat, 
        spot, 
        amaticc,
        gemJoin, 
        jug,
        vow,
        jar;

    let oracle;

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

        // Contract factory
        this.Oracle = await ethers.getContractFactory("MaticOracle");
        this.DGTOracle = await ethers.getContractFactory("DGTOracle");
        this.MockAggregator = await ethers.getContractFactory("MockAggregator");

        // Contract deployment
        oracle = await this.Oracle.deploy();
        await oracle.deployed();
        dgtoracle = await this.DGTOracle.deploy();
        mg = await this.MockAggregator.deploy("119029360");
        await mg.deployed();
    });

    describe('--- Initialize and Peek', function () {
        it('checks aggregator', async function () {
            await oracle.initialize(mg.address);
            expect((await oracle.peek()).toString()).to.be.equal("0x0000000000000000000000000000000000000000000000001084c5b9066bc000,true");
        });
        it('checks aggregator and returns false if price is 0', async function () {
            mg = await this.MockAggregator.deploy("-1");
            await oracle.initialize(mg.address);
            expect((await oracle.peek()).toString()).to.be.equal("0x0000000000000000000000000000000000000000000000000000000000000000,false");
        });
        it('checks dgtOracle', async function () {
            await dgtoracle.initialize(1);
            expect((await dgtoracle.peek()).toString()).to.be.equal("0x0000000000000000000000000000000000000000000000000000000000000001,true");
            await dgtoracle.changePriceToken(2);
            expect((await dgtoracle.peek()).toString()).to.be.equal("0x0000000000000000000000000000000000000000000000000000000000000002,true");
        });
    });
});