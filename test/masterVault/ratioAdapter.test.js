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
    adapter;
  let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000", // 45 Decimals
    ONE = 10 ** 27;


  let collateral = ethers.utils.formatBytes32String("aMATICc");
  //
  beforeEach(async function () {

    [deployer, signer1, signer2, signer3, signer4] = await ethers.getSigners();

    // Contract factory
    this.Token = await ethers.getContractFactory("Token");
    this.RatioAdapter = await ethers.getContractFactory("RatioAdapter");

    // Contract deployment
    token = await upgrades.deployProxy(this.Token, ["Wrapped Staked Ether", "wstETH"], {initializer: "initialize"});
    await token.deployed();
    await token.setRatio("500000000000000000");

    adapter = await upgrades.deployProxy(this.RatioAdapter, [], {initializer: "initialize"});
    await adapter.deployed();
  });

  describe('--- General', function () {
    it('---general', async function () {
      await adapter.setToken(token.address, 'getStETHByWstETH(uint256)', 'getWstETHByStETH(uint256)');

      const method = await adapter.fromMethods(token.address);
      console.log('method', method);

      let res = await adapter.fromValue(token.address, ethers.utils.parseEther('1'));
      console.log(res.toString());

      res = await adapter.toValue(token.address, ethers.utils.parseEther('1'));
      console.log(res.toString());
    });
  });
});