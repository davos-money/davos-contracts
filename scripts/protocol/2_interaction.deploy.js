let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");
const {BN, ether} = require("@openzeppelin/test-helpers");
const fs = require("fs");

/////////////////////////////
// 4_interaction.deploy.js //
/////////////////////////////

async function main() {

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce
        
    // Config 
    let { _dgtRewardsPoolLimitInEth, _dgtTokenRewardsSupplyinEth, _dgtOracleInitialPriceInWei } = require(`./config_${hre.network.name}.json`);

    // Addresses
    let { _vat, _spot, _davos, _davosJoin, _jug, _dog } = require(`./addresses_${hre.network.name}_1.json`);

    // Fetching
    this.DgtRewards = await hre.ethers.getContractFactory("DGTRewards");
    this.AuctionProxy = await hre.ethers.getContractFactory("AuctionProxy");
    const auctionProxy = await this.AuctionProxy.deploy({nonce: _nonce}); _nonce += 1;
    this.Interaction = await hre.ethers.getContractFactory("Interaction", {
        unsafeAllow: ['external-library-linking'],
        libraries: {
            AuctionProxy: auctionProxy.address
        }
    });

    // Deployment
    console.log("Interaction...");

    let rewards = await upgrades.deployProxy(this.DgtRewards, [_vat, ether(_dgtRewardsPoolLimitInEth).toString(), "5"], {initializer: "initialize", nonce: _nonce}); _nonce += 1;
    await rewards.deployed();
    rewardsImp = await upgrades.erc1967.getImplementationAddress(rewards.address);
    console.log("Rewards         :", rewards.address);
    console.log("Imp             :", rewardsImp);

    let interaction = await upgrades.deployProxy(this.Interaction, [_vat, _spot, _davos, _davosJoin, _jug, _dog, rewards.address], {
            initializer: "initialize",
            unsafeAllowLinkedLibraries: true,
            nonce: _nonce
        }
    ); _nonce += 1;
    await interaction.deployed();
    interactionImplAddress = await upgrades.erc1967.getImplementationAddress(interaction.address);
    console.log("interaction     : " + interaction.address);
    console.log("Imp             : " + interactionImplAddress);
    console.log("AuctionProxy    : " + auctionProxy.address);

    // Store Deployed Contracts
    const addresses = {
        _rewards         : rewards.address,
        _rewardsImp      : rewardsImp,
        _interaction     : interaction.address,
        _interactionImp  : interactionImplAddress,
        _auctionProxy    : auctionProxy.address,
        _initialNonce    : initialNonce
    }

    const json_addresses = JSON.stringify(addresses);
    fs.writeFileSync(`./scripts/protocol/addresses_${hre.network.name}_2.json`, json_addresses);
    console.log("Addresses Recorded to: " + `./scripts/protocol/addresses_${hre.network.name}_2.json`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});