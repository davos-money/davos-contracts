let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    // Config
    let {
        _cl_matic_usd,
        _stmatic_master_vault,
        _ratio_adapter,
        _stmatic,
        _stmatic_rate_provider,
        _stmatic_fx_tunnel
    } = require(`./config_${hre.network.name}.json`);

    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");
    this.StMaticOracle = await hre.ethers.getContractFactory("StMaticOracle");
    this.FxRateProvider = await hre.ethers.getContractFactory("FxRateProvider");

    let ratioAdapter = await this.RatioAdapter.attach(_ratio_adapter);

    // Deployment
    console.log("Deploying...");

    if (_stmatic_fx_tunnel && !_stmatic_rate_provider) {
        console.log('Deploying our own RateProvider based on fx-portal channel');
        const fxRateProvider = await this.FxRateProvider.deploy(_stmatic_fx_tunnel);
        await fxRateProvider.deployed();
        console.log("Verifying FxRateProvider...");
        await hre.run("verify:verify", {
            address: fxRateProvider.address,
            constructorArguments: [_stmatic_fx_tunnel]
        });
        _stmatic_rate_provider = fxRateProvider.address;
        console.log("FxRateProvider  : " + _stmatic_rate_provider);
    }

    let stMaticOracle = await upgrades.deployProxy(this.StMaticOracle, [_cl_matic_usd, _stmatic, _stmatic_master_vault, _ratio_adapter], {
        initializer: "initialize",
        nonce: _nonce
    });
    _nonce += 1;
    await stMaticOracle.deployed();
    let stMaticOracleImp = await upgrades.erc1967.getImplementationAddress(stMaticOracle.address);
    console.log("StMaticOracle      : " + stMaticOracle.address);
    console.log("Imp             : " + stMaticOracleImp);

    console.log("Setup contracts...");
    await ratioAdapter.setToken(_stmatic, "", "", "getRate()", true);
    await ratioAdapter.setProviderForToken(_stmatic, _stmatic_rate_provider);

    // Store Deployed Contracts
    const addresses = {
        _stMaticOracle: stMaticOracle.address,
        _stMaticOracleImp: stMaticOracleImp,
        _rateProvider: _stmatic_rate_provider,
        _initialNonce: initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/ratio/addresses_${hre.network.name}.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/ratio/addresses_${hre.network.name}.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });