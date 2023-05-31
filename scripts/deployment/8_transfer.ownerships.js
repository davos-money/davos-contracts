const hre = require("hardhat");
const {ethers, upgrades} = require("hardhat");
const {ether} = require("@openzeppelin/test-helpers");

async function main() {

  [deployer] = await ethers.getSigners();
  const PROXY_ADMIN_ABI = ["function transferOwnership(address newOwner) public"]
  const BRIDGE_PROXY_ADMIN = ["function changeProxyAdmin(address proxy, address newAdmin) public"]

  /** Load Addresses */ 
  let {
    ceaMATICc, 
    ceVault, 
    dMatic, 
    cerosRouter,
    masterVault,
    cerosYieldStr,
    davosProvider,
  } = require('./addresses.json');

  let {
    proxyAdmin, 
    _bridge,
    bridgeProxyAdmin
  } = require('./addresses.json');

  let {
    _multisig
  } = require('./addresses.json');

  /** Load factories */
  let ceamaticC = await hre.ethers.getContractAt("CeToken", ceaMATICc);
  let cevaulT = await hre.ethers.getContractAt("CeVault", ceVault);
  let dmatiC = await hre.ethers.getContractAt("dMATIC", dMatic);
  let cerosrouteR = await hre.ethers.getContractAt("CerosRouterLs", cerosRouter);
  let mastervaulT = await hre.ethers.getContractAt("MasterVault", masterVault);
  let strategY = await hre.ethers.getContractAt("CerosYieldConverterStrategyLs", cerosYieldStr);
  let davosprovideR = await hre.ethers.getContractAt("DavosProvider", davosProvider);
  let proxyadmiN = await hre.ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdmin);
  let bridgE = await hre.ethers.getContractAt(PROXY_ADMIN_ABI, _bridge);
  let birdgeproxyadmiN = await hre.ethers.getContractAt(BRIDGE_PROXY_ADMIN, bridgeProxyAdmin);

  /** Do transfer */
  // If the execution fails at some TX, you can safely comment out
  // previous TXs from that point for next execution.
  console.log("---------------------------");
  console.log("Initializing ownerships transfer...");
  let _nonce = await ethers.provider.getTransactionCount(deployer.address);

  console.log("---ceamaticc");
  await (await ceamaticC.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---ceamaticc: " + _multisig);

  console.log("---cevaulT");
  await (await cevaulT.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---cevaulT: " + _multisig);

  console.log("---dmatiC");
  await (await dmatiC.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---dmatiC: " + _multisig);

  console.log("---cerosrouteR");
  await (await cerosrouteR.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---cerosrouteR: " + _multisig);

  console.log("---mastervaulT");
  await (await mastervaulT.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---mastervaulT: " + _multisig);

  console.log("---strategY");
  await (await strategY.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---strategY: " + _multisig);

  console.log("---davosprovideR");
  await (await davosprovideR.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---davosprovideR: " + _multisig);

  console.log("---proxyadmiN");
  await (await proxyadmiN.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---proxyadmiN: " + _multisig);

  console.log("---bridgE");
  await (await bridgE.transferOwnership(_multisig, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---bridgE: " + _multisig);

  console.log("---birdgeproxyadmiN");
  await (await birdgeproxyadmiN.changeProxyAdmin(_bridge, proxyAdmin, {nonce: _nonce})).wait(); _nonce += 1;
  console.log("---birdgeproxyadmiN: " + _multisig);

  console.log("---------------------------");
  console.log("Ownerships transfer complete...");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });