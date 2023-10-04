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
    let chainid;

    this.Davos = await hre.ethers.getContractFactory("Davos");

    if (hre.network.name == "linea") {
        chainid = 59144;
    } else if (hre.network.name == "lineaTestnet") {
        chainid = 59140;
    } else if (hre.network.name == "avalanche") { 
        chainid = 43114;
    } else if (hre.network.name == "avalancheTestnet") {
        chainid = 43113;
    } else throw("ERR:> Network Unsupported !");

    // Deployment
    console.log("Core...");

    let davos = await upgrades.deployProxy(this.Davos, [chainid, "DUSD", "5000000" + wad], {initializer: "initialize"}); console.log("1");
    await davos.deployed();
    davosImp = await upgrades.erc1967.getImplementationAddress(davos.address);
    console.log("davos           :", davos.address);
    console.log("davosImp        :", davosImp);

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