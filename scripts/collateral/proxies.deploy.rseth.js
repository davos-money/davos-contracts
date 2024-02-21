let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const fs = require("fs");
const TransparentUpgradeableProxy = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json");

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    let masterVault, dMatic, davosProvider, gemJoin, clip;

    // Fetching
    this.TUP = await hre.ethers.getContractFactory(TransparentUpgradeableProxy.abi, TransparentUpgradeableProxy.bytecode);
    
    // Deployment
    console.log("Deploying...");

    if (hre.network.name == "ethereum") {
        // _logic / admin_ / _data
        masterVault = await this.TUP.deploy("0x3D2C623FC32Bff59606CDB11E6086f44206d3cEf", "0x2B42585E7930FaB52696f7b853e6097B1Df7ED4E", "0x", {nonce: _nonce}); _nonce += 1; await masterVault.deployed(); console.log("1");
        dMatic = await this.TUP.deploy("0xc8afCc8262023Be0fF5063b74057fB74AfdB7Db7", "0x2B42585E7930FaB52696f7b853e6097B1Df7ED4E", "0x", {nonce: _nonce}); _nonce += 1; await dMatic.deployed(); console.log("2");
        davosProvider = await this.TUP.deploy("0x214Da5898F07C24EB050c89472Bc130cB543fE03", "0x2B42585E7930FaB52696f7b853e6097B1Df7ED4E", "0x", {nonce: _nonce}); _nonce += 1; await davosProvider.deployed(); console.log("3");
        gemJoin = await this.TUP.deploy("0x8464BCAb4Bb9B086BfF0150753d9451cf6388576", "0x2B42585E7930FaB52696f7b853e6097B1Df7ED4E", "0x", {nonce: _nonce}); _nonce += 1; await gemJoin.deployed(); console.log("4");
        clip = await this.TUP.deploy("0x0Fb82DB5676330644ACD26a21FD00c749715066d", "0x2B42585E7930FaB52696f7b853e6097B1Df7ED4E", "0x", {nonce: _nonce}); _nonce += 1; await clip.deployed(); console.log("5");
    } else if (hre.network.name == "ethereumTestnet") {
        // _logic / admin_ / _data
        masterVault = await this.TUP.deploy("0xD6df23227f730aaB4C8eFa17268B694de75240Ca", "0x4D82a5D7f9D539ce9A88C7FB074ef6B68e54a2b4", "0x", {nonce: _nonce}); _nonce += 1; await masterVault.deployed(); console.log("1");
        dMatic = await this.TUP.deploy("0x110C7dc503Abe9E5771A2FC0cAd77b26203be3FA", "0x4D82a5D7f9D539ce9A88C7FB074ef6B68e54a2b4", "0x", {nonce: _nonce}); _nonce += 1; await dMatic.deployed(); console.log("2");
        davosProvider = await this.TUP.deploy("0x425CeC952837478C3ccb6e0aff92645E6d51cD7a", "0x4D82a5D7f9D539ce9A88C7FB074ef6B68e54a2b4", "0x", {nonce: _nonce}); _nonce += 1; await davosProvider.deployed(); console.log("3");
        gemJoin = await this.TUP.deploy("0x0168e703acd8fE52B2Be3d908CfA92400e9A5fD8", "0x4D82a5D7f9D539ce9A88C7FB074ef6B68e54a2b4", "0x", {nonce: _nonce}); _nonce += 1; await gemJoin.deployed(); console.log("4");
        clip = await this.TUP.deploy("0x86BFDE6F6E34Fd0F0Bd75e371909002053028B80", "0x4D82a5D7f9D539ce9A88C7FB074ef6B68e54a2b4", "0x", {nonce: _nonce}); _nonce += 1; await clip.deployed(); console.log("5");
    } else throw("NOT ALLOWED")

    // Store Deployed Contracts
    const addresses = {
        _masterVault     : masterVault.address,
        _dMatic          : dMatic.address,
        _davosProvider   : davosProvider.address,
        _gemJoin         : gemJoin.address,
        _clip            : clip.address,
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/addresses_${network.name}_collateral_rseth.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/addresses_${network.name}_collateral_rseth.json`);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});