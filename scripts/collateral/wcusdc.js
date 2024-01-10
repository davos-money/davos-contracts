let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();

    // Fetching
    this.Token = await hre.ethers.getContractFactory("WcUSDCv3_2");

    // Deployment
    console.log("Deploying...");

    let t = await upgrades.deployProxy(this.Token, ["Wrapped cUSDCv3", "wcUSDCv3", "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf"], {initializer: "initialize"});
    await t.deployed();
    let ts = await upgrades.erc1967.getImplementationAddress(t.address);
    console.log("wcUSDC           : " + t.address);
    console.log("Imp              : " + ts);

    await t.transferOwnership("0x39355FFAfC47E54E7d7e786b1Df0fa0e222FBd06");

     // Store Deployed Contracts
     const addresses = {
        _wcUSDC     : t.address,
        _wcUSDCImp  : ts,
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${network.name}_asset.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${network.name}_asset.json`);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});