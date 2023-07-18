const hre = require("hardhat");
const {ethers, upgrades} = require("hardhat");
const {ether} = require("@openzeppelin/test-helpers");

const admin_slot = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

function parseAddress(addressString){
    const buf = Buffer.from(addressString.replace(/^0x/, ''), 'hex');
    if (!buf.slice(0, 12).equals(Buffer.alloc(12, 0))) {
        return undefined;
    }
    const address = '0x' + buf.toString('hex', 12, 32); // grab the last 20 bytes
    return ethers.utils.getAddress(address);
}


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

  console.log("--ratioAdapter");
  await (await ratioAdapter.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---ratioAdapter" + _multisig);

  console.log("--MasterVault");
  await (await masterVault.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---MasterVault" + _multisig);

  console.log("--DavosProvider");
  await (await davosProvider.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---DavosProvider" + _multisig);

  console.log("--Dmatic");
  await (await dmatic.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---Dmatic" + _multisig);

  console.log("=== Try proxyAdmin transfer...");
    const proxyAdminAddress = parseAddress(await ethers.provider.getStorageAt(_masterVault, admin_slot));

    let PROXY_ADMIN_ABI = ["function owner() public view returns (address)"];
    let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);

    let owner = await proxyAdmin.owner();
    console.log("Owner: ", owner);
    console.log("Multi: ", _multisig);

    if (owner != ethers.constants.AddressZero && owner != _multisig) {
        PROXY_ADMIN_ABI = ["function transferOwnership(address newOwner) public"];
        let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);
        await proxyAdmin.transferOwnership(_multisig);
        console.log("proxyAdmin transferred");
    } else {
        console.log("Already owner of proxyAdmin")
    }

  console.log("---------------------------");
  console.log("Wards transfer complete...");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });