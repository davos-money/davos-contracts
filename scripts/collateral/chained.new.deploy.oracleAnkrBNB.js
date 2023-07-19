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
    let _ilk = ethers.utils.formatBytes32String("MVT_ankrBNB");
    // let { _cl_eth_usd, _cl_reth_eth, _cl_bnb_usd, _underlying, _wsteth, _master_vault_v2 } = require(`./config_${hre.network.name}.json`);
    let { _masterVault } = require(`./addresses_${hre.network.name}.json`);
    let { _spot } = require(`../deployment/addresses_${hre.network.name}_3.json`);

    let _cl_reth_eth, _cl_eth_usd, rateProvider, _underlying, _cl_bnb_usd;
    if (hre.network.name == "bsc") {
        _cl_bnb_usd = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE";
        _underlying = "0x52F24a5e03aee338Da5fd9Df68D2b6FAe1178827";
    } else if (hre.network.name == "bscTestnet") {
        _cl_bnb_usd = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";
        _underlying = "0x4f9406bd3582A877Ec0e33cA1b1FD31E778345B6";
    } else {
        throw "STOPPED";
    }
    
    // Fetching
    this.MasterVault = await hre.ethers.getContractFactory("MasterVault_V2");
    this.RatioAdapter = await hre.ethers.getContractFactory("RatioAdapter");
    this.RethOracle = await hre.ethers.getContractFactory("RethOracle");
    this.WstETHOracle = await hre.ethers.getContractFactory("WstETHOracle");
    this.AnkrBNBOracle = await hre.ethers.getContractFactory("AnkrBNBOracle");
    this.AnkrETHOracle = await hre.ethers.getContractFactory("AnkrETHOracle");
    this.Spot = await hre.ethers.getContractFactory("Spotter");

    let masterVaultV2 = await this.MasterVault.attach(_masterVault);
    let spot = await this.Spot.attach(_spot);

    // Deployment
    console.log("Deploying...");

    let ratioAdapter = await upgrades.deployProxy(this.RatioAdapter, [], {initializer: "initialize", nonce: _nonce}); _nonce += 1
    await ratioAdapter.deployed();
    let ratioAdapterImp = await upgrades.erc1967.getImplementationAddress(ratioAdapter.address);
    console.log("RatioAdapter      : " + ratioAdapter.address);
    console.log("Imp              : " + ratioAdapterImp);

    // let rethOracleArgs = [_cl_reth_eth, _cl_eth_usd, _masterVault];
    // let rethOracle = await upgrades.deployProxy(this.RethOracle, rethOracleArgs, {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await rethOracle.deployed();
    // let rethOracleImp = await upgrades.erc1967.getImplementationAddress(rethOracle.address);
    // console.log("RethOracle      : " + rethOracle.address);
    // console.log("Imp             : " + rethOracleImp);

    // let wstEthOracle = await upgrades.deployProxy(this.WstETHOracle, [_cl_eth_usd, _underlying, _masterVault, "0x6E726D8925e4CD1eDD510C2f1F8ECdB3F5D8491C"], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await wstEthOracle.deployed();
    // let wstEthOracleImp = await upgrades.erc1967.getImplementationAddress(wstEthOracle.address);
    // console.log("WstETHOracle     : " + wstEthOracle.address);
    // console.log("Imp              : " + wstEthOracleImp);

    let ankrBNBOracle = await upgrades.deployProxy(this.AnkrBNBOracle, [_cl_bnb_usd, _underlying, _masterVault, ratioAdapter.address], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await ankrBNBOracle.deployed();
    let ankrBNBOracleImp = await upgrades.erc1967.getImplementationAddress(ankrBNBOracle.address);
    console.log("ankrBNBOracle    : " + ankrBNBOracle.address);
    console.log("Imp              : " + ankrBNBOracleImp);

    // let ankrETHOracle = await upgrades.deployProxy(this.AnkrETHOracle, [_cl_eth_usd, _underlying, _masterVault, "0xa17d1Aac3CE85a8D7531c181289599bB7c0c6b9b"], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    // await ankrETHOracle.deployed();
    // let ankrETHOracleImp = await upgrades.erc1967.getImplementationAddress(ankrETHOracle.address);
    // console.log("ankrETHOracle    : " + ankrETHOracle.address);
    // console.log("Imp              : " + ankrETHOracleImp);

    // let masterVaultImp = await this.MasterVault.deploy();
    // await masterVaultImp.deployed();
    // console.log("Master Vault Imp     : " + masterVaultImp.address);

    // console.log("Upgrading master vault v2...");
    // const proxyAddress = await ethers.provider.getStorageAt(_master_vault_v2, admin_slot);

    // const proxyAdminAddress = parseAddress(proxyAddress);
    // let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);

    // if (proxyAdminAddress != ethers.constants.AddressZero) {
    //     await (await proxyAdmin.upgrade(_master_vault_v2, masterVaultImp.address)).wait();
    //     console.log("Upgraded Successfully...")
    // } else {
    //     console.log("Invalid proxyAdmin address");
    // }

    // console.log("Verifying MasterVaultImp...");
    // await hre.run("verify:verify", {address: masterVaultImp.address});

    // console.log("Setup contracts...");
    // ratioAdapter = await ethers.getContractAt("RatioAdapter", "0xa17d1Aac3CE85a8D7531c181289599bB7c0c6b9b")
    // // await ratioAdapter.setToken(_underlying, 'getStETHByWstETH(uint256)', 'getWstETHByStETH(uint256)', '', false);
    await ratioAdapter.setToken(_underlying, '', '', "ratio()", false, {nonce: _nonce}); _nonce += 1;
    // await ratioAdapter.setProviderForToken(_underlying, rateProvider, {nonce: _nonce}); _nonce += 1;
    await masterVaultV2.changeAdapter(ratioAdapter.address, {nonce: _nonce}); _nonce += 1;
    await spot["file(bytes32,bytes32,address)"](_ilk, ethers.utils.formatBytes32String("pip"), ankrBNBOracle.address, {nonce: _nonce}); _nonce += 1;

    // Store Deployed Contracts
    const addresses = {
        _ratioAdapter    : ratioAdapter.address,
        _ratioAdapterImp : ratioAdapterImp,
        // _rethOracle      : rethOracle.address,
        // _rethOracleImp   : rethOracleImp,
        // _wstEthOracle    : wstEthOracle.address,
        // _wstEthOracleImp : wstEthOracleImp,
        _ankrBnbOracle      : ankrBNBOracle.address,
        _ankrBnbOracleImp   : ankrBNBOracleImp,
        // _ankrEthOracle      : ankrETHOracle.address,
        // _ankrEthOracleImp   : ankrETHOracleImp,
        // _master_vault_v2 : masterVaultImp,
        // _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/collateral/addressesOracle_${hre.network.name}.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/collateral/addressesOracle_${hre.network.name}.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});