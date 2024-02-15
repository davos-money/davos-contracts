let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");
const TUPABI = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

    // Fetching
    // this.Token = await hre.ethers.getContractFactory("MockToken");
    // this.O = await hre.ethers.getContractFactory("Oracle");
    // this.DavosProvider = await hre.ethers.getContractFactory("DavosProvider");
    this.TUP = await hre.ethers.getContractFactory(TUPABI.abi, TUPABI.bytecode);
    
    // Deployment
    console.log("Deploying...");
    let proxy = await this.TUP.deploy("0x9ed9f3e630253fE798cBEf13Be66B78EB9373B22", "0xD3Ca61303C70e3615e7345C41A3aB5c51F92bE9a", "0x");
    console.log(proxy.address);


    // let t = await upgrades.deployProxy(this.DavosProvider, [], {initializer: false, redeployImplementation: 'never'});
    // await t.deployed();
    // let ts = await upgrades.erc1967.getImplementationAddress(t.address);
    // console.log("DP               : " + t.address);
    // console.log("Imp              : " + ts);

    // console.log(await(await ((await this.DP.deploy()).deployed())).address);
    // let o = await this.O.deploy(); await o.deployed();
    // console.log(o.address);

    // let t = await upgrades.deployProxy(this.Token, ["Puffer ETH", "pufETH"], {initializer: "initialize"});
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