let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();

    // Fetching
    this.Token = await hre.ethers.getContractFactory("MockToken");
    this.O = await hre.ethers.getContractFactory("Oracle");
    this.DP = await hre.ethers.getContractFactory("DavosProvider");

    // Deployment
    console.log("Deploying...");
    console.log(await(await ((await this.DP.deploy()).deployed())).address);
    // let o = await this.O.deploy(); await o.deployed();
    // console.log(o.address);

    // let t = await upgrades.deployProxy(this.Token, ["Origin ETH", "oETH"], {initializer: "initialize"});
    // await t.deployed();
    // let ts = await upgrades.erc1967.getImplementationAddress(t.address);
    // console.log("wcUSDC           : " + t.address);
    // console.log("Imp              : " + ts);


    //  // Store Deployed Contracts
    //  const addresses = {
    //     _wcUSDC     : t.address,
    //     _wcUSDCImp  : ts,
    // }

    // const json_addresses = JSON.stringify(addresses);
    // fs.writeFileSync(`./scripts/addresses_${network.name}_asset.json`, json_addresses);
    // console.log("Addresses Recorded to: " + `./scripts/addresses_${network.name}_asset.json`);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});