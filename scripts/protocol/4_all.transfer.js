let hre = require("hardhat");
let { ethers } = require("hardhat");

function parseAddress(addressString){
    const buf = Buffer.from(addressString.replace(/^0x/, ''), 'hex');
    if (!buf.slice(0, 12).equals(Buffer.alloc(12, 0))) {
        return undefined;
    }
    const address = '0x' + buf.toString('hex', 12, 32); // grab the last 20 bytes
    return ethers.utils.getAddress(address);
}

async function main() {

    let { _multisig } = require(`./config_${hre.network.name}.json`);
    let { _vat, _spot, _davos, _davosJoin, _jug, _vow, _dog, _abacus } = require(`./addresses_${hre.network.name}_1.json`);
    let { _rewards, _interaction } = require(`./addresses_${hre.network.name}_2.json`);

    // Signer
    [deployer] = await ethers.getSigners();
    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    console.log("Transfering Contracts Ownership");

    let interaction = await ethers.getContractAt("Vat", _interaction);
    let rewards = await ethers.getContractAt("Vat", _rewards);
    let vat = await ethers.getContractAt("Vat", _vat);
    let spot = await ethers.getContractAt("Vat", _spot);
    let davos = await ethers.getContractAt("Vat", _davos);
    let davosJoin = await ethers.getContractAt("Vat", _davosJoin);
    let jug = await ethers.getContractAt("Vat", _jug);
    let vow = await ethers.getContractAt("Vat", _vow);
    let dog = await ethers.getContractAt("Vat", _dog);
    let abacus = await ethers.getContractAt("Vat", _abacus);

    await interaction.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("1");
    await rewards.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("2");
    await vat.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("3");
    await spot.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("4");
    await davos.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("5");
    await davosJoin.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("6");
    await jug.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("7");
    await vow.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("8");
    await dog.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("9");
    await abacus.rely(_multisig, {nonce: _nonce}); _nonce += 1; console.log("10");

    console.log("Transfering Proxy Admin Ownership");
    
    let abi = ["function owner() external view returns (address)"];
    let proxyAdmin = await ethers.getContractAt(abi, parseAddress(await ethers.provider.getStorageAt(_vat, "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103")));

    let owner = await proxyAdmin.owner();

    console.log("Owner: ", owner);
    console.log("Multi: ", _multisig);

    if (owner != ethers.constants.AddressZero && owner != _multisig) {
        abi = ["function transferOwnership(address) external"];
        proxyAdmin = await ethers.getContractAt(abi, proxyAdmin.address);
        await proxyAdmin.transferOwnership(_multisig); console.log("1");
    } else {
        console.log("Already Owner")
    }

    console.log("Transfer Complete !!!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});