let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

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
    let { _ratio_adapter } = require(`./config_${hre.network.name}.json`);
    
    // Fetching
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

    let ratioAdapter;
    let ratioAdapterImp;

    // Deployment
    console.log("Deploying...");

    if (!!_ratio_adapter) {
        ratioAdapter = await upgrades.deployProxy(this.RatioAdapter, [], {initializer: "initialize", nonce: _nonce}); _nonce += 1
        await ratioAdapter.deployed();
        ratioAdapterImp = await upgrades.erc1967.getImplementationAddress(ratioAdapter.address);
        console.log("RatioAdapter      : " + ratioAdapter.address);
        console.log("Imp              : " + ratioAdapterImp);
        console.log("WARNING: DON'T FORGET TO SET NEW RATIO ADAPTER TO VAULTS AND ORACLES");
    } else {
        ratioAdapterImp = await this.RatioAdapter.deploy();
        await ratioAdapterImp.deployed();
        ratioAdapterImp = ratioAdapterImp.address;

        console.log("RatioAdapterImp    : " + ratioAdapterImp);

        console.log("Upgrading master vault v2...");
        const proxyAddress = await ethers.provider.getStorageAt(_ratio_adapter, admin_slot);
        const proxyAdminAddress = parseAddress(proxyAddress);
        let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);
        if (proxyAdminAddress != ethers.constants.AddressZero) {
            await (await proxyAdmin.upgrade(_ratio_adapter, ratioAdapterImp)).wait();
            console.log("Upgraded Successfully...")
        } else {
            console.log("Invalid proxyAdmin address");
        }
        console.log("Verifying RatioAdapterImp...");
        await hre.run("verify:verify", {address: ratioAdapterImp});

    }

    // Store Deployed Contracts
    const addresses = {
        _ratioAdapter    : ratioAdapter.address,
        _ratioAdapterImp : ratioAdapterImp,
        _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/collateral/addresses_${hre.network.name}.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/collateral/addresses_${hre.network.name}.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});