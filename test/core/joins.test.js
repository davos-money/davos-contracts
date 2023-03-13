const { ethers, network } = require('hardhat');
const { expect } = require("chai");

describe('===GemJoin===', function () {
    let deployer, signer1, signer2;

    let wad = "000000000000000000", // 18 Decimals
        ray = "000000000000000000000000000", // 27 Decimals
        rad = "000000000000000000000000000000000000000000000"; // 45 Decimals

    let collateral = ethers.utils.formatBytes32String("TEST");

    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {

        [deployer, signer1, signer2] = await ethers.getSigners();

        // Contract factory
        this.GemJoin = await ethers.getContractFactory("GemJoin");
        this.Vat = await ethers.getContractFactory("Vat");
        this.Davos = await ethers.getContractFactory("Davos");

        // Contract deployment
        vat = await upgrades.deployProxy(this.Vat, [], {initializer: "initialize"});
        await vat.deployed();
        gem = await upgrades.deployProxy(this.Davos, [97, "GEM", "100" + wad], {initializer: "initialize"});
        await gem.deployed();
        gemjoin = await upgrades.deployProxy(this.GemJoin, [vat.address, collateral, gem.address], {initializer: "initialize"});
        await gemjoin.deployed();
    });

    describe('--- initialize()', function () {
        it('initialize', async function () {
            expect(await gemjoin.vat()).to.be.equal(vat.address);
        });
    });
    describe('--- rely()', function () {
        it('reverts: GemJoin/not-authorized', async function () {
            await gemjoin.deny(deployer.address);
            await expect(gemjoin.rely(signer1.address)).to.be.revertedWith("GemJoin/not-authorized");
            expect(await gemjoin.wards(signer1.address)).to.be.equal("0");
        });
        it('relies on address', async function () {
            await gemjoin.rely(signer1.address);
            expect(await gemjoin.wards(signer1.address)).to.be.equal("1");
        });
    });
    describe('--- deny()', function () {
        it('reverts: GemJoin/not-authorized', async function () {
            await gemjoin.deny(deployer.address);
            await expect(gemjoin.deny(signer1.address)).to.be.revertedWith("GemJoin/not-authorized");
        });
        it('denies an address', async function () {
            await gemjoin.rely(signer1.address);
            expect(await gemjoin.wards(signer1.address)).to.be.equal("1");
            await gemjoin.deny(signer1.address);
            expect(await gemjoin.wards(signer1.address)).to.be.equal("0");
        });
    });
    describe('--- cage()', function () {
        it('cages', async function () {
            await gemjoin.cage();
            expect(await gemjoin.live()).to.be.equal("0");
        });
    });
    describe('--- join()', function () {
        it('reverts: GemJoin/not-live', async function () {
            await gemjoin.cage();
            await expect(gemjoin.join(deployer.address, "1" + wad)).to.be.revertedWith("GemJoin/not-live");
        });
        it('reverts: GemJoin/overflow', async function () {
            await expect(gemjoin.join(deployer.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")).to.be.revertedWith("GemJoin/overflow");
        });
        it('joins davos erc20', async function () {
            await gem.mint(deployer.address, "1" + wad);
            await gem.approve(gemjoin.address, "1" + wad);
            await vat.rely(gemjoin.address);
            await gem.rely(gemjoin.address);

            await gemjoin.join(deployer.address, "1" + wad);
            expect(await vat.gem(collateral, deployer.address)).to.be.equal("1" + wad);
        });
    });
    describe('--- exit()', function () {
        it('reverts: GemJoin/overflow', async function () {
            await expect(gemjoin.exit(deployer.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")).to.be.revertedWith("GemJoin/overflow");
        });
        it('exits davos erc20', async function () {
            await gem.mint(deployer.address, "1" + wad);
            await gem.approve(gemjoin.address, "1" + wad);
            await vat.rely(gemjoin.address);
            await gem.rely(gemjoin.address);

            await gemjoin.join(deployer.address, "1" + wad);
            expect(await vat.gem(collateral, deployer.address)).to.be.equal("1" + wad);

            await gemjoin.exit(deployer.address, "1" + wad);
            expect(await vat.gem(collateral, deployer.address)).to.be.equal("0");
        });
    });
    describe('--- uncage()', function () {
        it('uncages previouly caged', async function () {
            await gemjoin.cage();
            await gemjoin.uncage();
            expect(await gemjoin.live()).to.be.equal(1);
        });
    });
});
describe('===DavosJoin===', function () {
    let deployer, signer1, signer2;

    let wad = "000000000000000000", // 18 Decimals
        ray = "000000000000000000000000000", // 27 Decimals
        rad = "000000000000000000000000000000000000000000000"; // 45 Decimals

    let collateral = ethers.utils.formatBytes32String("TEST");

    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {

        [deployer, signer1, signer2] = await ethers.getSigners();

        // Contract factory
        this.DavosJoin = await ethers.getContractFactory("DavosJoin");
        this.Vat = await ethers.getContractFactory("Vat");
        this.Davos = await ethers.getContractFactory("Davos");

        // Contract deployment
        vat = await upgrades.deployProxy(this.Vat, [], {initializer: "initialize"});
        await vat.deployed();
        davos = await upgrades.deployProxy(this.Davos, [97, "DAVOS", "100" + wad], {initializer: "initialize"});
        await davos.deployed();
        davosjoin = await upgrades.deployProxy(this.DavosJoin, [vat.address, davos.address], {initializer: "initialize"});
        await davosjoin.deployed();
    });

    describe('--- initialize()', function () {
        it('initialize', async function () {
            expect(await davosjoin.vat()).to.be.equal(vat.address);
        });
    });
    describe('--- rely()', function () {
        it('reverts: DavosJoin/not-authorized', async function () {
            await davosjoin.deny(deployer.address);
            await expect(davosjoin.rely(signer1.address)).to.be.revertedWith("DavosJoin/not-authorized");
            expect(await davosjoin.wards(signer1.address)).to.be.equal("0");
        });
        it('relies on address', async function () {
            await davosjoin.rely(signer1.address);
            expect(await davosjoin.wards(signer1.address)).to.be.equal("1");
        });
    });
    describe('--- deny()', function () {
        it('reverts: DavosJoin/not-authorized', async function () {
            await davosjoin.deny(deployer.address);
            await expect(davosjoin.deny(signer1.address)).to.be.revertedWith("DavosJoin/not-authorized");
        });
        it('denies an address', async function () {
            await davosjoin.rely(signer1.address);
            expect(await davosjoin.wards(signer1.address)).to.be.equal("1");
            await davosjoin.deny(signer1.address);
            expect(await davosjoin.wards(signer1.address)).to.be.equal("0");
        });
    });
    describe('--- cage()', function () {
        it('cages', async function () {
            await davosjoin.cage();
            expect(await davosjoin.live()).to.be.equal("0");
        });
    });
    describe('--- join()', function () {
        it('joins davos erc20', async function () {
            await vat.init(collateral);
            await vat.rely(davosjoin.address);
            await davos.rely(davosjoin.address);
            await vat.hope(davosjoin.address);

            await vat.connect(deployer)["file(bytes32,uint256)"](await ethers.utils.formatBytes32String("Line"), "200" + rad);
            await vat.connect(deployer)["file(bytes32,bytes32,uint256)"](collateral, await ethers.utils.formatBytes32String("line"), "200" + rad);  
            await vat.connect(deployer)["file(bytes32,bytes32,uint256)"](collateral, await ethers.utils.formatBytes32String("dust"), "10" + rad);              
            await vat.connect(deployer)["file(bytes32,bytes32,uint256)"](collateral, await ethers.utils.formatBytes32String("spot"), "100" + ray);

            await vat.slip(collateral, deployer.address, "1" + wad);
            await vat.connect(deployer).frob(collateral, deployer.address, deployer.address, deployer.address, "1" + wad, 0);
            await vat.connect(deployer).frob(collateral, deployer.address, deployer.address, deployer.address, 0, "15" + wad);
            await davosjoin.exit(deployer.address, "1" + wad);

            await davos.approve(davosjoin.address, "1" + wad);
            
            await davosjoin.join(deployer.address, "1" + wad);
            expect(await vat.davos(deployer.address)).to.be.equal("15" + rad);
        });
    });
    describe('--- exit()', function () {
        it('reverts: DavosJoin/not-live', async function () {
            await davosjoin.cage();
            await expect(davosjoin.exit(deployer.address, "1" + wad)).to.be.revertedWith("DavosJoin/not-live");
        });
        it('exits davos erc20', async function () {
            await vat.init(collateral);
            await vat.rely(davosjoin.address);
            await davos.rely(davosjoin.address);
            await vat.hope(davosjoin.address);

            await vat.connect(deployer)["file(bytes32,uint256)"](await ethers.utils.formatBytes32String("Line"), "200" + rad);
            await vat.connect(deployer)["file(bytes32,bytes32,uint256)"](collateral, await ethers.utils.formatBytes32String("line"), "200" + rad);  
            await vat.connect(deployer)["file(bytes32,bytes32,uint256)"](collateral, await ethers.utils.formatBytes32String("dust"), "10" + rad);              
            await vat.connect(deployer)["file(bytes32,bytes32,uint256)"](collateral, await ethers.utils.formatBytes32String("spot"), "100" + ray);

            await vat.slip(collateral, deployer.address, "1" + wad);
            await vat.connect(deployer).frob(collateral, deployer.address, deployer.address, deployer.address, "1" + wad, 0);
            await vat.connect(deployer).frob(collateral, deployer.address, deployer.address, deployer.address, 0, "15" + wad);
            await davosjoin.exit(signer1.address, "1" + wad);

            expect(await davos.balanceOf(signer1.address)).to.be.equal("1" + wad);
        });
    });
    describe('--- uncage()', function () {
        it('uncages previouly caged', async function () {
            await davosjoin.cage();
            await davosjoin.uncage();
            expect(await davosjoin.live()).to.be.equal(1);
        });
    });
});