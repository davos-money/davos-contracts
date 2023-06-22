let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const ether = require("@openzeppelin/test-helpers/src/ether");

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

    // Config
    let { _cl_eth_usd, _cl_reth_eth, _reth, _wsteth, _master_vault_v2, _multisig } = require(`./config_${hre.network.name}.json`);
    let { _masterVault } = require(`./addresses_${hre.network.name}.json`);
    
    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");
    this.RethOracle = await hre.ethers.getContractFactory(hre.network.name === 'ethereum' ? "RethOracle" : "RethOracleTestnet");
    this.WstETHOracle = await hre.ethers.getContractFactory("WstETHOracle");

    // Deployment
    console.log("=== Deploying...");

    let ratioAdapter = await upgrades.deployProxy(this.RatioAdapter, [], {initializer: "initialize"});
    await ratioAdapter.deployed();
    let ratioAdapterImp = await upgrades.erc1967.getImplementationAddress(ratioAdapter.address);
    console.log("RatioAdapter     : " + ratioAdapter.address);
    console.log("Imp              : " + ratioAdapterImp);

    let rethOracleArgs = hre.network.name === 'ethereum' ? [_cl_reth_eth, _cl_eth_usd, _masterVault] : [_cl_eth_usd, _reth, ratioAdapter.address, _masterVault]
    
    let rethOracle = await upgrades.deployProxy(this.RethOracle, rethOracleArgs, {initializer: "initialize"});
    await rethOracle.deployed();
    let rethOracleImp = await upgrades.erc1967.getImplementationAddress(rethOracle.address);
    console.log("RethOracle       : " + rethOracle.address);
    console.log("Imp              : " + rethOracleImp);

    let wstEthOracle = await upgrades.deployProxy(this.WstETHOracle, [_cl_eth_usd, _wsteth, _master_vault_v2, ratioAdapter.address], {initializer: "initialize"});
    await wstEthOracle.deployed();
    let wstEthOracleImp = await upgrades.erc1967.getImplementationAddress(wstEthOracle.address);
    console.log("WstETHOracle     : " + wstEthOracle.address);
    console.log("Imp              : " + wstEthOracleImp);

    let masterVaultImp = await this.MasterVault.deploy();
    await masterVaultImp.deployed();
    console.log("Master Vault Imp : " + masterVaultImp.address);

    // Store Deployed Contracts
    const addresses = {
        _ratioAdapter    : ratioAdapter.address,
        _ratioAdapterImp : ratioAdapterImp,
        _rethOracle      : rethOracle.address,
        _rethOracleImp   : rethOracleImp,
        _wstEthOracle    : wstEthOracle.address,
        _wstEthOracleImp : wstEthOracleImp,
        _master_vault_v2 : masterVaultImp.address
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/collateral/oracles_${network.name}.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/collateral/oracles_${network.name}.json`);

    console.log("=== Setup contracts...");
    await ratioAdapter.setToken(_wsteth, 'getStETHByWstETH(uint256)', 'getWstETHByStETH(uint256)', '', false);
    await ratioAdapter.setToken(_reth, 'getRethValue(uint256)', 'getEthValue(uint256)', "", false);

    console.log("=== Transfer Ownerships...");
    const proxyAdminAddress = parseAddress(await ethers.provider.getStorageAt(ratioAdapter.address, admin_slot));

    let PROXY_ADMIN_ABI = ["function owner() public view returns (address)"];
    let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);

    let owner = await proxyAdmin.owner();
    console.log("Owner: ", owner);

    if (owner != ethers.constants.AddressZero && owner != _multisig) {
        PROXY_ADMIN_ABI = ["function transferOwnership(address newOwner) public"];
        let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);
        await proxyAdmin.transferOwnership(_multisig);
        console.log("proxyAdmin transferred");
    } else {
        console.log("Already owner of proxyAdmin")
    }

    await ratioAdapter.transferOwnership(_multisig);
    console.log("ratio adapter transferred");

    console.log("SCRIPT FINISHED!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});