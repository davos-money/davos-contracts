const hre = require("hardhat");
const {ethers, upgrades} = require("hardhat");
const {ether} = require("@openzeppelin/test-helpers");

async function main() {

  [deployer] = await ethers.getSigners();

  /** Load Addresses */ 
  let {_vat, _spot, _davos, _davosJoin, _jug, _vow, _dog, _abacus } = require(`./deployment/addresses_${hre.network.name}_3.json`);
  let {_rewards, _interaction, _auctionProxy } = require(`./deployment/addresses_${hre.network.name}_4.json`);
  let { _jar } = require(`./deployment/addresses_${hre.network.name}_5.json`);
  let { _multisig } = require(`./deployment/config_${hre.network.name}.json`);

  let { _ratioAdapter } = require(`./collateral/addressesOracle_${hre.network.name}.json`);
  let { _masterVault, _dMatic, _davosProvider, _gemJoin, _clip } = require(`./collateral/addresses_${hre.network.name}.json`);

  /** Load factories */
  this.Vat = await hre.ethers.getContractFactory("Vat");
  this.Spot = await hre.ethers.getContractFactory("Spotter");
  this.Davos = await hre.ethers.getContractFactory("Davos");
  this.DavosJoin = await hre.ethers.getContractFactory("DavosJoin");
  this.Jug = await hre.ethers.getContractFactory("Jug");
  this.Vow = await hre.ethers.getContractFactory("Vow");
  this.Dog = await hre.ethers.getContractFactory("Dog");
  this.Abaci = await ethers.getContractFactory("LinearDecrease");
  this.DGTRewards = await hre.ethers.getContractFactory("DGTRewards");
  this.Interaction = await hre.ethers.getContractFactory("Interaction", {libraries: { AuctionProxy: _auctionProxy}});
  this.Jar = await hre.ethers.getContractFactory("Jar");
  
  this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");
  this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
  this.dMatic = await hre.ethers.getContractFactory("dCol");
  this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
  this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
  this.Clipper = await hre.ethers.getContractFactory("Clipper");

  /** Attach contracts to addresses */ 
  let vat = await this.Vat.attach(_vat);
  let spot = await this.Spot.attach(_spot);
  let davos = await this.Davos.attach(_davos);
  let davosjoin = await this.DavosJoin.attach(_davosJoin);
  let jug = await this.Jug.attach(_jug);
  let vow = await this.Vow.attach(_vow);
  let dog = await this.Dog.attach(_dog);
  let abaci = await this.Abaci.attach(_abacus);
  let dgtrewards = await this.DGTRewards.attach(_rewards);
  let interaction = await this.Interaction.attach(_interaction);
  let jar = await this.Jar.attach(_jar);

  let ratioAdapter = await this.RatioAdapter.attach(_ratioAdapter);
  let masterVault = await this.MasterVault.attach(_masterVault);
  let dmatic = await this.dMatic.attach(_dMatic);
  let davosProvider = await this.DavosProvider.attach(_davosProvider);
  let gemjoin = await this.GemJoin.attach(_gemJoin);
  let clip = await this.Clipper.attach(_clip);

  /** Do transfer */
  // If the execution fails at some TX, you can safely comment out
  // previous TXs from that point for next execution.
  console.log("---------------------------");
  console.log("Initializing wards transfer...");
  let _nonce = await ethers.provider.getTransactionCount(deployer.address);

  console.log("--vat");
  await (await vat.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---vat" + deployer.address);

  console.log("--spot");
  await (await spot.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---spot" + deployer.address);

  console.log("--davos");
  await (await davos.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---davos" + deployer.address);

  console.log("--davosjoin");
  await (await davosjoin.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---davosjoin" + deployer.address);

  console.log("--jug");
  await (await jug.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---jug" + deployer.address);

  console.log("--vow");
  await (await vow.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---vow" + deployer.address);

  console.log("--dog");
  await (await dog.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---dog" + deployer.address);

  console.log("--gemjoin");
  await (await gemjoin.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---gemjoin" + deployer.address);

  console.log("--clip");
  await (await clip.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---clip" + deployer.address);

  console.log("--abaci");
  await (await abaci.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---abaci" + deployer.address);

  console.log("--dgtrewards");
  await (await dgtrewards.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---dgtrewards" + deployer.address);

  console.log("--interaction");
  await (await interaction.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---interaction" + deployer.address);

  console.log("--jar");
  await (await jar.deny(deployer.address, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---jar" + deployer.address);

  console.log("---------------------------");
  console.log("Wards transfer complete...");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });