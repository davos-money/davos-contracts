let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    let { _cl_eth_usd, _sfrxeth, _sfrxeth_master_vault_v2, _ratio_adapter } = require(`./config_${hre.network.name}.json`);
    
    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");
    this.SfrxEthOracle = await hre.ethers.getContractFactory("SfrxEthOracle");

    let masterVaultV2 = await this.MasterVault.attach(_master_vault_v2);
    let ratioAdapter = await this.RatioAdapter.attach(_ratio_adapter);

    // Deployment
    console.log("Deploying...");

    let sfrxEthOracle = await upgrades.deployProxy(this.SfrxEthOracle, [_cl_eth_usd, _sfrxeth, _sfrxeth_master_vault_v2, _ratio_adapter], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await sfrxEthOracle.deployed();
    let sfrxEthOracleImp = await upgrades.erc1967.getImplementationAddress(sfrxEthOracle.address);
    console.log("sfrxEthOracle      : " + sfrxEthOracle.address);
    console.log("Imp             : " + sfrxEthOracleImp);

    console.log("Setup contracts...");
    await ratioAdapter.setToken(_sfrxeth, 'convertToAssets(uint256)', 'convertToShares(uint256)', '', true);

    // Store Deployed Contracts
    const addresses = {
        _sfrxEthOracle    : sfrxEthOracle.address,
        _sfrxEthOracleImp : sfrxEthOracleImp,
        _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/oracles/addresses_${hre.network.name}.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/oracles/addresses_${hre.network.name}.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});