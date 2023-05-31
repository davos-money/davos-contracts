const hre = require("hardhat");
const {ethers, upgrades} = require("hardhat");
const {ether} = require("@openzeppelin/test-helpers");

async function main() {

  [deployer] = await ethers.getSigners();
  const BRIDGE_ADD_ABI = ["function addBridge(address bridge, uint256 toChain) public"]
  const BRIDGE_WARP_ABI = ["function addWarpDestination(address fromToken, uint256 toChain, address toToken) external"]
  const PROXY_ADMIN_ABI = ["function transferOwnership(address newOwner) public"]
  const BRIDGE_PROXY_ADMIN = ["function changeProxyAdmin(address proxy, address newAdmin) public"]

  /** Load Addresses */ 
  let {
    _bridge,
    targetBridge,
    davos,
    targetDavos,
    pbridgeProxyAdmin,
    pproxyAdmin
  } = require('./addresses.json');

  let {
    _multisig
  } = require('./addresses.json');
  
  /** Load factories */
  let bridgeAdd = await hre.ethers.getContractAt(BRIDGE_ADD_ABI, targetBridge);
  let bridgeWarp = await hre.ethers.getContractAt(BRIDGE_WARP_ABI, targetBridge);
  let bridgE = await hre.ethers.getContractAt(PROXY_ADMIN_ABI, targetBridge);
  let birdgeproxyadmiN = await hre.ethers.getContractAt(BRIDGE_PROXY_ADMIN, pbridgeProxyAdmin);

  /** Do Initialize */
  console.log("---------------------------");
  console.log("Initializing...");
  let _nonce = await ethers.provider.getTransactionCount(deployer.address);

  console.log("---Bridge addBridge")
  await (await bridgeAdd.addBridge(_bridge, 1, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---Bridge addBridge set !!!")

  console.log("---Bridge warp")
  await (await bridgeWarp.addWarpDestination(targetDavos, 1, davos, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---Bridge warp set !!!")

  console.log("---bridgE");
  await (await bridgE.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---bridgE: " + _multisig);

  console.log("---birdgeproxyadmiN");
  await (await birdgeproxyadmiN.changeProxyAdmin(targetBridge, pproxyAdmin, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---birdgeproxyadmiN: " + _multisig);

  console.log("---------------------------");
  console.log("Complete...");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });