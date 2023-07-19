const { expect, use } = require("chai");
const { ethers } = require("hardhat");
// const { Web3 } = require('web3');
// const web3 = new Web3();


describe("Jar_V2", function () {
    let jar2;
    let owner;
    let token;
    let user;
    let wad = "000000000000000000";
    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        
        const Token = await ethers.getContractFactory("ERC20Upgradeable");
        token = await Token.deploy();
        
        const JarV2 = await ethers.getContractFactory("Jar_V2");
        jar2 = await upgrades.deployProxy(JarV2, ["Jar Token", "JAR_V2", token.address], {initializer: "initialize"});
        await jar2.deployed();
        //await token.approve(jar2.address, "1"+wad);
        // jar2 = await JarV2.deploy();
        // await jar2.initialize("Test Jar", "TJAR", token.address);
    });

    describe('--- rely()', function () {
      it('reverts: Jar_V2/not-authorized', async function () {
          await expect(jar2.connect(user).rely(user.address)).to.be.revertedWith("Jar_V2/not-authorized");
          expect(await jar2.wards(user.address)).to.be.equal("0");
      });
      it('relies on address', async function () {
          await jar2.rely(user.address);
          expect(await jar2.wards(user.address)).to.be.equal("1");
      });
  });

  describe('--- deny()', function () {
    it('reverts: Jar_V2/not-authorized', async function () {
        await expect(jar2.connect(user).deny(user.address)).to.be.revertedWith("Jar_V2/not-authorized");
    });
    it('denies an address', async function () {
        await jar2.rely(user.address);
        expect(await jar2.wards(user.address)).to.be.equal("1");
        await jar2.deny(user.address);
        expect(await jar2.wards(user.address)).to.be.equal("0");
    });
  });

  describe('--- Put rewards', function(){
      it("should allow authorized address to put rewards", async function () {
            //const amount = web3.utils.toWei('1.5', 'ether');
            await jar2.mint(user.address, "1"+wad);
            await token.approve(jar2.address, "1"+wad, { from: user.address });
            await jar2.rely(user.address);
            await jar2.putRewards("1"+wad);
            
            expect(await jar2.balanceOf(user.address)).to.equal("1"+wad);
            
 
          });
      it("should not allow unauthorized address to put rewards", async function () {
             // const amount = Web3.utils.toWei('1.5', 'ether');
             await jar2.mint(owner.address, "1"+wad);
             await token.approve(jar2.address, "1"+wad, { from: owner.address });
             await jar2.putRewards("1"+wad);
             await jar2.deny(owner.address);
             await expect(jar2.putRewards("1"+wad)).to.be.revertedWith("Jar_V2/not-authorized");

            });
    });
});