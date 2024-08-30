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
    // let { _ratio_adapter } = require(`./config_${hre.network.name}.json`);
    
    // Fetching
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

    let ratioAdapter;
    let ratioAdapterImp;

    // Deployment
    console.log("Deploying...");

    // if (!!_ratio_adapter) {
        // ratioAdapter = await upgrades.deployProxy(this.RatioAdapter, [], {initializer: "initialize"});
        // await ratioAdapter.deployed();
        // ratioAdapterImp = await upgrades.erc1967.getImplementationAddress(ratioAdapter.address);
        // console.log("RatioAdapter      : " + ratioAdapter.address);
        // console.log("Imp              : " + ratioAdapterImp);

        let { _multisig } = require(`./config_${hre.network.name}.json`);


        // console.log("WARNING: DON'T FORGET TO SET NEW RATIO ADAPTER TO VAULTS AND ORACLES");

        
        // await ratioAdapter.setToken("0x333D8b480BDB25eA7Be4Dd87EEB359988CE1b30D", "", "", "exchangeRateStored()", true); console.log("1")
        // await ratioAdapter.setToken("0xf669C3C03D9fdF4339e19214A749E52616300E89", "", "", "exchangeRateStored()", true); console.log("2")
        // await ratioAdapter.setToken("0x2416092f143378750bb29b79eD961ab195CcEea5", "", "", "getRate()", true); console.log("3")

        // await ratioAdapter.setToken("0xB5beDd42000b71FddE22D3eE8a79Bd49A568fC8F", "", "", "getRate()", true); console.log("4")

        // await ratioAdapter.setProviderForToken("0x2416092f143378750bb29b79eD961ab195CcEea5", "0x4D7572040B84b41a6AA2efE4A93eFFF182388F88"); console.log("5")
    // } else {
    //     ratioAdapterImp = await this.RatioAdapter.deploy();
    //     await ratioAdapterImp.deployed();
    //     ratioAdapterImp = ratioAdapterImp.address;

    //     console.log("RatioAdapterImp    : " + ratioAdapterImp);

    //     console.log("Upgrading master vault v2...");
    //     const proxyAddress = await ethers.provider.getStorageAt(_ratio_adapter, admin_slot);
    //     const proxyAdminAddress = parseAddress(proxyAddress);
    //     let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);
    //     if (proxyAdminAddress != ethers.constants.AddressZero) {
    //         await (await proxyAdmin.upgrade(_ratio_adapter, ratioAdapterImp)).wait();
    //         console.log("Upgraded Successfully...")
    //     } else {
    //         console.log("Invalid proxyAdmin address");
    //     }
    //     console.log("Verifying RatioAdapterImp...");
    //     await hre.run("verify:verify", {address: ratioAdapterImp});

    // }

    // Store Deployed Contracts
    // const addresses = {
    //     _ratioAdapter    : ratioAdapter.address,
    //     _ratioAdapterImp : ratioAdapterImp,
    //     _initialNonce    : initialNonce
    // }

    // const json_addresses = JSON.stringify(addresses);
    // fs.writeFileSync(`./scripts/collateral/addresses_${hre.network.name}.json`, json_addresses);
    // console.log("Addresses Recorded to: " + `./scripts/collateral/addresses_${hre.network.name}.json`);

    ratioAdapter = await ethers.getContractAt("RatioAdapter", "0xC09D8C9a780E79Df8b8aCFB5Ec1b9e66fA3B5724");
    await ratioAdapter.transferOwnership(_multisig); console.log("1")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});