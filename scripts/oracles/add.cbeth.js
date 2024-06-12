let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    let { _cl_eth_usd, _cl_cbeth_eth, _cbeth_master_vault_v2, _cbeth, _ratio_adapter } = require(`./config_${hre.network.name}.json`);
    
    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");

    let ratioAdapter = await this.RatioAdapter.attach(_ratio_adapter);

    // Deployment
    console.log("Deploying...");

    let oracleArgs;
    if (_cl_cbeth_eth) {
        this.CbEthOracle = await hre.ethers.getContractFactory("CbEthOracle");
        oracleArgs = [_cl_cbeth_eth, _cl_eth_usd, _cbeth_master_vault_v2];
    } else {
        this.CbEthOracle = await hre.ethers.getContractFactory("CbEthOracleTestnet");
        oracleArgs = [_cl_eth_usd, _cbeth, _ratio_adapter, _cbeth_master_vault_v2]
    }

    let cbEthOracle = await upgrades.deployProxy(this.CbEthOracle, oracleArgs, {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await cbEthOracle.deployed();
    let cbEthOracleImp = await upgrades.erc1967.getImplementationAddress(cbEthOracle.address);
    console.log("cbEthOracle     : " + cbEthOracle.address);
    console.log("Imp             : " + cbEthOracleImp);

    console.log("Setup contracts...");
    await ratioAdapter.setToken(_cbeth, '', '', 'exchangeRate()', true);

    // Store Deployed Contracts
    const addresses = {
        _cbEthOracle     : cbEthOracle.address,
        _cbEthOracleImp  : cbEthOracleImp,
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