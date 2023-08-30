let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const { deploy } = require("@openzeppelin/hardhat-upgrades/dist/utils");

//////////////////////
// 3_core.deploy.js //
//////////////////////

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
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    // let _nonce = initialNonce
        
    // Config 
    // let _chainId = process.env.CHAIN_ID;
    // let _multisig = process.env.MULTISIG;

    // console.log(_chainId);
    // console.log(_multisig);

    // Fetching

    this.Davos = await hre.ethers.getContractFactory("Davos");

    // Deployment
    console.log("Core...");

    let davos = await upgrades.deployProxy(this.Davos, ["1101", "DUSD", "5000000" + wad], {initializer: "initialize"}); console.log("1");
    await davos.deployed(); console.log("2");
    davosImp = await upgrades.erc1967.getImplementationAddress(davos.address);
    console.log("davos           :", davos.address);
    console.log("davosImp        :", davosImp);

    console.log("Rely on Bridge");
    await davos.rely("0x2304CE6B42D505141A286B7382d4D515950b1890");
    console.log("Done");

    // console.log("===Transfering Ownership");
    // await davos.rely(_multisig); console.log("Relied");
    // await davos.deny(deployer.address); console.log("Denied");

    // console.log("=== Try proxyAdmin transfer...");
    // const proxyAdminAddress = parseAddress(await ethers.provider.getStorageAt(davos.address, admin_slot));

    // let PROXY_ADMIN_ABI = ["function owner() public view returns (address)"];
    // let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);

    // let owner = await proxyAdmin.owner();
    // console.log("Owner: ", owner);

    // if (owner != ethers.constants.AddressZero && owner != _multisig) {
    //     PROXY_ADMIN_ABI = ["function transferOwnership(address newOwner) public"];
    //     let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);
    //     await proxyAdmin.transferOwnership(_multisig);
    //     console.log("proxyAdmin transferred");
    // } else {
    //     console.log("Already owner of proxyAdmin")
    // }
    // console.log("Transfer Complete !!!");

    // Store Deployed Contracts
    const addresses = {
        _davos          : davos.address,
        _davosImp       : davosImp
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${hre.network.name}.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${hre.network.name}.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});