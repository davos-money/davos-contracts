const hre = require("hardhat");
const {ethers, upgrades} = require("hardhat");
const {ether} = require("@openzeppelin/test-helpers");

async function main() {

  [deployer] = await ethers.getSigners();

  /** Load Addresses */ 
  let {
    vat, 
    spot, 
    davos, 
    davosJoin,
    gemJoin,
    jug,
    vow,
    dog, 
    clip,
    abacus,
    rewards,
    interaction,
    jar,
    auctionProxy
  } = require('./addresses.json');

  let {
    _multisig
  } = require('./addresses.json');

  /** Load factories */
  this.Vat = await hre.ethers.getContractFactory("Vat");
  this.Spot = await hre.ethers.getContractFactory("Spotter");
  this.Davos = await hre.ethers.getContractFactory("Davos");
  this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
  this.DavosJoin = await hre.ethers.getContractFactory("DavosJoin");
  this.Jug = await hre.ethers.getContractFactory("Jug");
  this.Vow = await hre.ethers.getContractFactory("Vow");
  this.Dog = await hre.ethers.getContractFactory("Dog");
  this.Clip = await hre.ethers.getContractFactory("Clipper");
  this.Abaci = await ethers.getContractFactory("LinearDecrease");
  this.DGTRewards = await hre.ethers.getContractFactory("DGTRewards");
  this.Interaction = await hre.ethers.getContractFactory("Interaction", {libraries: { AuctionProxy: auctionProxy}});
  this.Jar = await hre.ethers.getContractFactory("Jar");

  /** Attach contracts to addresses */ 
  let _vat = await this.Vat.attach(vat);
  let _spot = await this.Spot.attach(spot);
  let _davos = await this.Davos.attach(davos);
  let _gemjoin = await this.GemJoin.attach(gemJoin);
  let _davosjoin = await this.DavosJoin.attach(davosJoin);
  let _jug = await this.Jug.attach(jug);
  let _vow = await this.Vow.attach(vow);
  let _dog = await this.Dog.attach(dog);
  let _clip = await this.Clip.attach(clip);
  let _abaci = await this.Abaci.attach(abacus);
  let _dgtrewards = await this.DGTRewards.attach(rewards);
  let _interaction = await this.Interaction.attach(interaction);
  let _jar = await this.Jar.attach(jar);

  /** Do transfer */
  // If the execution fails at some TX, you can safely comment out
  // previous TXs from that point for next execution.
  console.log("---------------------------");
  console.log("Initializing wards transfer...");
  let _nonce = await ethers.provider.getTransactionCount(deployer.address);

  console.log("--vat");
  await (await _vat.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---vat" + _multisig);

  console.log("--spot");
  await (await _spot.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---spot" + _multisig);

  console.log("--davos");
  await (await _davos.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---davos" + _multisig);

  console.log("--gemjoin");
  await (await _gemjoin.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---gemjoin" + _multisig);

  console.log("--davosjoin");
  await (await _davosjoin.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---davosjoin" + _multisig);

  console.log("--jug");
  await (await _jug.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---jug" + _multisig);

  console.log("--vow");
  await (await _vow.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---vow" + _multisig);

  console.log("--dog");
  await (await _dog.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---dog" + _multisig);

  console.log("--clip");
  await (await _clip.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---clip" + _multisig);

  console.log("--abaci");
  await (await _abaci.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---abaci" + _multisig);

  console.log("--dgtrewards");
  await (await _dgtrewards.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---dgtrewards" + _multisig);

  console.log("--interaction");
  await (await _interaction.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---interaction" + _multisig);

  console.log("--jar");
  await (await _jar.deny(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---jar" + _multisig);

  console.log("---------------------------");
  console.log("Wards transfer complete...");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });