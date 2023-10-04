let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const { deploy } = require("@openzeppelin/hardhat-upgrades/dist/utils");

let wad = "000000000000000000"; // 18 Decimals
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

    // Signer
    [deployer] = await ethers.getSigners();
    let multisig;
    let addr = require(`./addresses_${hre.network.name}.json`);
    this.Davos = await hre.ethers.getContractFactory("Davos");
    let davos = await this.Davos.attach(addr._davos);

    if (hre.network.name == "linea") {
        multisig = "0x8F0E864AE6aD45d973BD5B3159D5a7079A83B774";
    } else if (hre.network.name == "avalanche") { 
        multisig = "0x6122255099D7603ec8216941aA7a4aDe497CC9c4";
    } else throw("ERR:> Network Unsupported !");

    // Deployment
    console.log("Core...");

    console.log("===Transfering Ownership");
    await davos.rely(multisig); console.log("Relied");
    // await davos.deny(deployer.address); console.log("Denied");

    console.log("=== Try proxyAdmin transfer...");
    const proxyAdminAddress = parseAddress(await ethers.provider.getStorageAt(davos.address, admin_slot));

    let PROXY_ADMIN_ABI = ["function owner() public view returns (address)"];
    let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);

    let owner = await proxyAdmin.owner();
    console.log("Owner: ", owner);

    if (owner != ethers.constants.AddressZero && owner != multisig) {
        PROXY_ADMIN_ABI = ["function transferOwnership(address newOwner) public"];
        let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);
        await proxyAdmin.transferOwnership(multisig);
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