let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();

    // Fetching
    this.MockToken = await hre.ethers.getContractFactory("MockToken");

    // Deployment
    console.log("Deploying...");

    let vat = await upgrades.deployProxy(this.MockToken, ["StakeWise ETH", "osETH"], {initializer: "initialize"});
    await vat.deployed();
    vatImp = await upgrades.erc1967.getImplementationAddress(vat.address);
    console.log("Vat             :", vat.address);
    console.log("VatImp          :", vatImp);

    // let dp = await this.DavosProvider.deploy();
    // await dp.deployed();
    // console.log("DavosProvider    : " + dp.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});