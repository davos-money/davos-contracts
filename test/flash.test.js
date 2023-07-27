const { ethers, network, upgrades} = require('hardhat');
const { expect } = require("chai");
const toBN = ethers.BigNumber.from;
const formatBytes32String = ethers.utils.formatBytes32String;

const wad = "000000000000000000", // 18 Decimals
      ray = "000000000000000000000000000", // 27 Decimals
      rad = "000000000000000000000000000000000000000000000"; // 45 Decimals

describe('===Flash===', function () {
    let deployer, signer1, signer2;
    
    let collateral = formatBytes32String("TEST");

    beforeEach(async function () {

        [deployer, signer1, signer2] = await ethers.getSigners();

        // Contract factory
        this.Vat = await ethers.getContractFactory("Vat");
        this.Vow = await ethers.getContractFactory("Vow");
        this.Davos = await ethers.getContractFactory("Davos");
        this.DavosJoin = await ethers.getContractFactory("DavosJoin");
        this.Flash = await ethers.getContractFactory("Flash");
        this.BorrowingContract = await ethers.getContractFactory("FlashBorrower");

        // Contract deployment
        vat = await upgrades.deployProxy(this.Vat, [], {initializer: "initialize"});
        await vat.deployed();
        davos = await upgrades.deployProxy(this.Davos, [97, "DUSD", "100" + wad], {initializer: "initialize"});
        await davos.deployed();
        davosjoin = await upgrades.deployProxy(this.DavosJoin, [vat.address, davos.address], {initializer: "initialize"});
        await davosjoin.deployed();
        vow = await upgrades.deployProxy(this.Vow, [vat.address, davosjoin.address, deployer.address], {initializer: "initialize"});
        await vow.deployed();
        flash = await upgrades.deployProxy(this.Flash, [vat.address, davos.address, davosjoin.address, vow.address], {initializer: "initialize"});
        await flash.deployed();
        borrowingContract = await this.BorrowingContract.connect(deployer).deploy(flash.address);
        await borrowingContract.deployed();
    });

    describe('--- initialize()', function () {
        it('deployer is an authorized member: ward = 1', async function () {
            expect(await flash.wards(deployer.address)).to.be.equal("1");
        });
        it('other addresses are not authorized by default: ward = 0', async function () {
            expect(await flash.wards(signer1.address)).to.be.equal("0");
        });
    });
    describe('--- rely()', function () {
        it('authorized member can authorize another user', async function () {
            await flash.rely(signer1.address);
            expect(await flash.wards(signer1.address)).to.be.equal("1");
        });
        it('reverts when unauthorized member tries to authorize: Flash/not-authorized', async function () {
            await expect(flash.connect(signer1).rely(signer1.address)).to.be.revertedWith("Flash/not-authorized");
            expect(await flash.wards(signer1.address)).to.be.equal("0");
        });
    });
    describe('--- deny()', function () {
        it('authorized member can revoke authorization of another user', async function () {
            await flash.rely(signer1.address);
            expect(await flash.wards(signer1.address)).to.be.equal("1");
            await flash.deny(signer1.address);
            expect(await flash.wards(signer1.address)).to.be.equal("0");
        });
        it('reverts when unauthorized member tries revoke authorization: Flash/not-authorized', async function () {
            await flash.rely(signer1.address);
            await expect(flash.connect(signer2).deny(signer1.address)).to.be.revertedWith("Flash/not-authorized");
            expect(await flash.wards(signer1.address)).to.be.equal("1");
        });
    });
    describe('--- file(2)', function () {
        it('sets max loan amount = rad', async function () {
            value = toRad(1);
            await flash["file(bytes32,uint256)"](formatBytes32String("max"), value);
            expect(await flash.max()).to.be.equal(value);
        });
        it('sets max loan amount = 0', async function () {
            value = "0";
            await flash["file(bytes32,uint256)"](formatBytes32String("max"), value);
            expect(await flash.max()).to.be.equal(value);
        });
        it('sets max loan amount < rad', async function () {
            value = randomBN(rad.length);
            await flash["file(bytes32,uint256)"](formatBytes32String("max"), value);
            expect(await flash.max()).to.be.equal(value);
        });
        it('reverts when max > upper bound: Flash/ceiling-too-high', async function () {
            value = toRad(1).add(1);
            await expect(flash["file(bytes32,uint256)"](formatBytes32String("max"), value))
              .to.be.revertedWith("Flash/ceiling-too-high");
        });
        it('sets flash fee (toll)', async function () {
            value = randomBN(wad.length);
            await flash["file(bytes32,uint256)"](formatBytes32String("toll"), value);
            expect(await flash.toll()).to.be.equal(value);
        });
        it('reverts for setting unknown var: Flash/file-unrecognized-param', async function () {
            await expect(flash["file(bytes32,uint256)"](formatBytes32String("maxtoll"), "100" + rad))
              .to.be.revertedWith("Flash/file-unrecognized-param");
        });
    });
    describe('--- maxFlashLoan()', function () {
        it('returns max flash loan amount for davos token', async function () {
            value = randomBN(wad.length);
            await flash["file(bytes32,uint256)"](formatBytes32String("max"), value);
            expect(await flash.maxFlashLoan(davos.address)).to.be.equal(value);
        });
        it('for every other token max flash loan amount = 0', async function () {
            value = randomBN(wad.length);
            await flash["file(bytes32,uint256)"](formatBytes32String("max"), value);
            expect(await flash.maxFlashLoan(deployer.address)).to.be.equal("0");
        });
    });
    describe('--- flashFee()', function () {
        const amounts = [
            "1111111111111111111",
            "111111111111111111",
            "11111111111111111",
            "1111111111111111",
            "111111111111111",
            "11111111111111",
            "1111111111111",
            "111111111111",
            "11111111111",
            "1111111111",
            "111111111",
            "11111111",
            "1111111",
            "111111",
            "11111",
            "1111",
            "111",
            "11",
            "1",
            "0",
        ]
        amounts.forEach(function (amount) {
            it(`calculates flashFee for ${amount}DAVOS`, async function () {
                toll = randomBN(wad.length);
                expectedFlashFee = toBN(amount).mul(toll).div(toWad(1));
                await flash["file(bytes32,uint256)"](formatBytes32String("toll"), toll);
                expect(await flash.flashFee(davos.address, amount)).to.be.closeTo(expectedFlashFee, 1);
            });
        })
        it('reverts for unknown token: Flash/token-unsupported', async function () {
            toll = randomBN(wad.length);
            await flash["file(bytes32,uint256)"](formatBytes32String("toll"), toll);
            await expect(flash.flashFee(deployer.address, "1" + wad)).to.be.revertedWith("Flash/token-unsupported");
        });
    });
    describe('--- flashLoan()', function () {
        
        const amounts = [
            "9999999999999999999",
            "6666666666666666666",
            "5555555555555555555",
            "1111111111111111111",
            "111111111111111111",
            "11111111111111111",
            "1111111111111111",
            "111111111111111",
            "11111111111111",
            "1111111111111",
            "111111111111",
            "11111111111",
            "1111111111",
            "111111111",
            "11111111",
            "1111111",
            "111111",
            "11111",
            "1111",
            "111",
            "11",
            "1",
            "0",
        ]
        
        amounts.forEach(function (amount) {
            it(`flash mints ${amount}, burns and accrues with fee`, async function () {
                await vat.init(collateral);
                await vat["file(bytes32,uint256)"](formatBytes32String("Line"), "200" + rad);
                await vat["file(bytes32,bytes32,uint256)"](collateral, formatBytes32String("line"), "200" + rad);
                await vat["file(bytes32,bytes32,uint256)"](collateral, formatBytes32String("dust"), "10" + rad);
                await vat["file(bytes32,bytes32,uint256)"](collateral, formatBytes32String("spot"), "100" + ray);
                await vat.slip(collateral, deployer.address, "1" + wad);
                await vat.frob(collateral, deployer.address, deployer.address, deployer.address, "1" + wad, 0);
                await vat.frob(collateral, deployer.address, deployer.address, davosjoin.address, 0, "20" + wad);
                await vat.rely(flash.address);
                await vat.rely(davosjoin.address);
                
                await davos.rely(davosjoin.address);
                
                await davosjoin.rely(flash.address);
                
                maxFlashLoan = toWad(10);
                toll = toBN("10000000000000000"); // 1%
                await flash["file(bytes32,uint256)"](formatBytes32String("max"), maxFlashLoan);
                await flash["file(bytes32,uint256)"](formatBytes32String("toll"), toll);
                requiredFlashFee = await flash.flashFee(davos.address, amount); // get flashFee from contract
                borrowerBalanceReserve = randomBN(18); // to check that it does not burn more than necessary
                borrowerBalance = requiredFlashFee.mul(2).add(borrowerBalanceReserve); // mul fee by 2 to borrow two times and add some reserve
                
                await davos.mint(borrowingContract.address, borrowerBalance); // minting davos tokens to pay flashFee
                flashBorrowerBalanceBefore = await davos.balanceOf(borrowingContract.address);
                console.log(`Borrowing contract balance before: ${flashBorrowerBalanceBefore}DAVOS`);
                await borrowingContract.flashBorrow(davos.address, amount); // borrow 2 times
                await borrowingContract.flashBorrow(davos.address, amount);
                
                feeCollected = (await vat.davos(flash.address));
                console.log(`Fee collected: ${feeCollected}DAVOS`);
                expect(feeCollected.mul(toWad(1)).div(toRad(1))).to.be.eq(requiredFlashFee.mul(2));
                
                flashBorrowerBalanceAfter = await davos.balanceOf(borrowingContract.address);
                console.log(`Borrowing contract balance after: ${flashBorrowerBalanceAfter}DAVOS`);
                expect(flashBorrowerBalanceAfter).to.be.eq(borrowerBalanceReserve);
                
                expect(await vat.davos(vow.address)).to.be.equal(toBN(0));
                await flash.accrue();
                expect(await vat.davos(vow.address)).to.be.equal(feeCollected); // Surplus from Flash fee
            })
        })
        
        it('reverts when flashBorrower balance is not sufficient to pay flashFee: Davos/insufficient-balance', async function () {
            await vat.init(collateral);
            await vat["file(bytes32,uint256)"](formatBytes32String("Line"), "200" + rad);
            await vat["file(bytes32,bytes32,uint256)"](collateral, formatBytes32String("line"), "200" + rad);
            await vat["file(bytes32,bytes32,uint256)"](collateral, formatBytes32String("dust"), "10" + rad);
            await vat["file(bytes32,bytes32,uint256)"](collateral, formatBytes32String("spot"), "100" + ray);
            await vat.slip(collateral, deployer.address, "1" + wad);
            await vat.frob(collateral, deployer.address, deployer.address, deployer.address, "1" + wad, 0);
            await vat.frob(collateral, deployer.address, deployer.address, davosjoin.address, 0, "20" + wad);
            await vat.rely(flash.address);
            await vat.rely(davosjoin.address);
            
            await davos.rely(davosjoin.address);
            
            await davosjoin.rely(flash.address);
            
            maxFlashLoan = toWad(10);
            toll = toBN("10000000000000000"); // 1%
            amount = randomBN(18);
            await flash["file(bytes32,uint256)"](formatBytes32String("max"), maxFlashLoan);
            await flash["file(bytes32,uint256)"](formatBytes32String("toll"), toll);
            borrowerBalance = (await flash.flashFee(davos.address, amount)).sub(1); // sub 1 wei
            await davos.mint(borrowingContract.address, borrowerBalance); // Minting insufficient davos token to pay flashFee
            await expect(borrowingContract.flashBorrow(davos.address, amount))
              .to.be.revertedWith("Davos/insufficient-balance");
        });
        
        it('reverts on borrowing unknown token: Flash/token-unsupported', async function () {
            await flash["file(bytes32,uint256)"](formatBytes32String("max"), "10" + wad);
            await flash["file(bytes32,uint256)"](formatBytes32String("toll"), "10000000000000000"); // 1%
            davos2 = await this.Davos.connect(deployer).deploy();
            await davos2.deployed();
            await expect(borrowingContract.flashBorrow(davos2.address, "1" + wad))
              .to.be.revertedWith("Flash/token-unsupported");
        });
        it('reverts on exceeding max loan amount: Flash/ceiling-exceeded', async function () {
            max = toWad(10);
            await flash["file(bytes32,uint256)"](formatBytes32String("max"), max);
            await flash["file(bytes32,uint256)"](formatBytes32String("toll"), "10000000000000000"); // 1%
            await expect(borrowingContract.flashBorrow(davos.address, max.add(1)))
              .to.be.revertedWith("Flash/ceiling-exceeded");
        });
        it('reverts when vat is disabled: Flash/vat-not-live', async function () {
            await flash["file(bytes32,uint256)"](formatBytes32String("max"), "10" + wad);
            await flash["file(bytes32,uint256)"](formatBytes32String("toll"), "10000000000000000"); // 1%
            await vat.cage();
            await expect(borrowingContract.flashBorrow(davos.address, "9" + wad))
              .to.be.revertedWith("Flash/vat-not-live");
        });
    });
});

function toWad(amount) {
  return toBN(amount + wad)
}
function toRay(amount) {
  return toBN(amount + ray)
}
function toRad(amount) {
  return toBN(amount + rad)
}

function randomBN(length) {
    if (length > 0) {
        let randomNum = '';
        randomNum += Math.floor(Math.random() * 9) + 1; // generates a random digit 1-9
        for (let i = 0; i < length - 1; i++) {
            randomNum += Math.floor(Math.random() * 10); // generates a random digit 0-9
        }
        return toBN(randomNum);
    } else {
        return toBN(0);
    }
}