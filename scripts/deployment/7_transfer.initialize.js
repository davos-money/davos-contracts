const hre = require("hardhat");
const {ethers, upgrades} = require("hardhat");
const {ether} = require("@openzeppelin/test-helpers");

async function main() {

  [deployer] = await ethers.getSigners();
  const BRIDGE_ADD_ABI = ["function addBridge(address bridge, uint256 toChain) public"]
  const BRIDGE_WARP_ABI = ["function addWarpDestination(address fromToken, uint256 toChain, address toToken) external"]

  /** Load Addresses */ 
  let {
    masterVault,
    cerosYieldStr,
  } = require('./addresses.json');

  let {
    _bridge,
    targetBridge,
    davos,
    targetDavos
  } = require('./addresses.json');

  let {
    _multisig
  } = require('./addresses.json');

  /** Load factories */
  let _masterVault = await hre.ethers.getContractAt("MasterVault", masterVault);
  let strategy = await hre.ethers.getContractAt("CerosYieldConverterStrategyLs", cerosYieldStr);
  let bridgeAdd = await hre.ethers.getContractAt(BRIDGE_ADD_ABI, _bridge);
  let bridgeWarp = await hre.ethers.getContractAt(BRIDGE_WARP_ABI, _bridge);

  /** Do Initialize */
  console.log("---------------------------");
  console.log("Initializing...");
  let _nonce = await ethers.provider.getTransactionCount(deployer.address);

  console.log("---MasterVault feeRecipient")
  await (await _masterVault.changeFeeReceiver(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---MasterVault feeRecipient set !!!")

  console.log("---Strategy feeRecipient")
  await (await strategy.setFeeRecipient(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---Strategy feeRecipient set !!!")

  console.log("---Strategy strategist")
  await (await strategy.setStrategist(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---Strategy strategist set !!!")

  console.log("---Bridge addBridge")
  await (await bridgeAdd.addBridge(targetBridge, 137, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---Bridge addBridge set !!!")

  console.log("---Bridge warp")
  await (await bridgeWarp.addWarpDestination(davos, 137, targetDavos, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---Bridge warp set !!!")

  console.log("---------------------------");
  console.log("Complete...");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });