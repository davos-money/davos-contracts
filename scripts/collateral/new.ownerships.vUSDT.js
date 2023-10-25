let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000", // 45 Decimals
    ONE = 10 ** 27;

const admin_slot = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
const PROXY_ADMIN_ABI = ["function upgrade(address proxy, address implementation) public"]

function parseAddress(addressString){
    const buf = Buffer.from(addressString.replace(/^0x/, ''), 'hex');
    if (!buf.slice(0, 12).equals(Buffer.alloc(12, 0))) {
        return undefined;
    }
    const address = '0x' + buf.toString('hex', 12, 32); // grab the last 20 bytes
    return ethers.utils.getAddress(address);
}

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    let { _masterVault, _davosProvider, _dMatic, _clip, _gemJoin } = require(`../addresses_${hre.network.name}_collateral1.json`);
    let { _multisig } = require(`./config_${hre.network.name}.json`);

    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
    this.DMatic = await hre.ethers.getContractFactory("dCol");
    this.GemJoin = await hre.ethers.getContractFactory("GemJoin");
    this.Clip = await hre.ethers.getContractFactory("Clipper");

    // Initialize
    console.log("Initializing...");

    let masterVaultAt = await ethers.getContractAt("MasterVault_V2", _masterVault);
    let davosProviderAt = await ethers.getContractAt("DavosProvider", _davosProvider);
    let dMaticAt = await ethers.getContractAt("dCol", _dMatic);
    let gemJoinAt = await ethers.getContractAt("GemJoin", _gemJoin);
    let clipAt = await ethers.getContractAt("Clipper", _clip);

    console.log("Transfering...");
    await masterVaultAt.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    await davosProviderAt.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    await dMaticAt.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    await gemJoinAt.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    await clipAt.rely(_multisig, {nonce: _nonce}); _nonce += 1;
    console.log("Transfer Complete !!!");

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

    console.log("Transfer Complete !!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});