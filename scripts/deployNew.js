let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

const admin_slot = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
const PROXY_ADMIN_ABI = ["function upgrade(address proxy, address implementation) public"]

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000", // 45 Decimals
    ONE = 10 ** 27;

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

    // Fetching
    // this.WcUSDC = await hre.ethers.getContractFactory("WcUSDCv3_2");
    // this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2_R");
    this.Davos = await hre.ethers.getContractFactory("Davos");

    // Deployment
    console.log("Deploying...");

    // if (hre.network.name == "arbitrum" || hre.network.name == "arbitrumTestnet") {
    //     console.log("ARBITRUM");
    //     let c = await this.WcUSDC.deploy();
    //     await c.deployed();
    //     console.log(c.address);
    // } else if (hre.network.name == "bsc" || hre.network.name == "bscTestnet") { 
    //     console.log("BSC");
    //     let c = await this.MasterVault.deploy();
    //     await c.deployed();
    //     console.log(c.address);
    // } else throw("ERR:> Network Unsupported !");
    let davos = await upgrades.deployProxy(this.Davos, ["81457", "DUSD", "5000000" + wad], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await davos.deployed();
    davosImp = await upgrades.erc1967.getImplementationAddress(davos.address);
    console.log("davos           :", davos.address);
    console.log("davosImp        :", davosImp);

    console.log("Transfering Ownership");

    initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    _nonce = initialNonce
    multisig = "0x9DA9270DE0Fa48c2626EcB57154b3D72d45BC298";

    await (await davos.rely(multisig, {nonce: _nonce})).wait(); _nonce += 1; console.log("Relied");

    const proxyAdminAddress = parseAddress(await ethers.provider.getStorageAt(davos.address, admin_slot));

    let PROXY_ADMIN_ABI = ["function owner() public view returns (address)"];
    let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);

    let owner = await proxyAdmin.owner();
    console.log("Owner: ", owner);
    console.log("Multi: ", multisig);

    if (owner != ethers.constants.AddressZero && owner != multisig) {
        PROXY_ADMIN_ABI = ["function transferOwnership(address newOwner) public"];
        let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);
        await(await proxyAdmin.transferOwnership(multisig, {nonce: _nonce})).wait();
        console.log("proxyAdmin transferred");
    } else {
        console.log("Already owner of proxyAdmin")
    }

    console.log("DONE !!")

     // Store Deployed Contracts
     const addresses = {
        _davos          : davos.address,
        _davosImp       : davosImp,
        _initialNonce   : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${hre.network.name}_davos.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${hre.network.name}_davos.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});