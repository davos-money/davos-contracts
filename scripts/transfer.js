let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");

const reth = require("./collateral/addressesRETH_zkevm.json");
const wsteth = require("./collateral/addressesWSTETH_zkevm.json");
const ankreth = require("./collateral/addressesANKRETH_zkevm.json");
const oracles = require("./collateral/addressesOralces_zkevm.json");
const { deploy } = require("@openzeppelin/hardhat-upgrades/dist/utils");

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
    let multisig = "0xE52AbC30A80fC6133c2B866d903142464005AD07";
    let brige = "0x2304CE6B42D505141A286B7382d4D515950b1890";

    if (deployer.address.toLowerCase() == multisig.toLowerCase()) throw "Deployer and multisig are same";

    // Selectors
    let abiTran = ["function transferOwnership(address) external"]

    // Data
    let {_vat, _spot, _davos, _davosJoin, _jug, _vow, _dog, _abacus } = require(`./protocol/addresses_${hre.network.name}_1.json`);
    let {_rewards, _interaction }  = require(`./protocol/addresses_${hre.network.name}_2.json`);
    let {_jar }  = require(`./protocol/addresses_${hre.network.name}_3.json`);

    // Core Relies
    let vat = await ethers.getContractAt("Vat", _vat);
    let spot = await ethers.getContractAt("Spotter", _spot);
    let davos = await ethers.getContractAt("Davos", _davos);
    let davosJoin = await ethers.getContractAt("DavosJoin", _davosJoin);
    let jug = await ethers.getContractAt("Jug", _jug);
    let vow = await ethers.getContractAt("Vow", _vow);
    let dog = await ethers.getContractAt("Dog", _dog);
    let abacus = await ethers.getContractAt("LinearDecrease", _abacus);
    let rewards = await ethers.getContractAt("DGTRewards", _rewards);
    let interaction = await ethers.getContractAt("Interaction", _interaction);
    let jar = await ethers.getContractAt("Jar", _jar);

    console.log("Core Relies")
    if(await vat.wards(multisig) == 0) await vat.rely(multisig); console.log("1")
    if(await spot.wards(multisig) == 0) await spot.rely(multisig); console.log("2")
    if(await davos.wards(multisig) == 0) await davos.rely(multisig); console.log("3")
    if(await davosJoin.wards(multisig) == 0) await davosJoin.rely(multisig); console.log("4")
    if(await jug.wards(multisig) == 0) await jug.rely(multisig); console.log("5")
    if(await vow.wards(multisig) == 0) await vow.rely(multisig); console.log("6")
    if(await dog.wards(multisig) == 0) await dog.rely(multisig); console.log("7")
    if(await abacus.wards(multisig) == 0) await abacus.rely(multisig); console.log("8")
    if(await rewards.wards(multisig) == 0) await rewards.rely(multisig); console.log("9")
    if(await interaction.wards(multisig) == 0) await interaction.rely(multisig); console.log("10")
    if(await jar.wards(multisig) == 0) await jar.rely(multisig); console.log("11")

    // // Core Denies
    // console.log("Core Denies");
    // if(await vat.wards(deployer.address) == 1 && await vat.wards(multisig) == 1) await vat.deny(deployer.address); console.log("1");
    // if(await spot.wards(deployer.address) == 1 && await spot.wards(multisig) == 1) await spot.deny(deployer.address); console.log("2");
    // if(await davos.wards(deployer.address) == 1 && await davos.wards(multisig) == 1) await davos.deny(deployer.address); console.log("3");
    // if(await davosJoin.wards(deployer.address) == 1 && await davosJoin.wards(multisig) == 1) await davosJoin.deny(deployer.address); console.log("4");
    // if(await jug.wards(deployer.address) == 1 && await jug.wards(multisig) == 1) await jug.deny(deployer.address); console.log("5");
    // if(await vow.wards(deployer.address) == 1 && await vow.wards(multisig) == 1) await vow.deny(deployer.address); console.log("6");
    // if(await dog.wards(deployer.address) == 1 && await dog.wards(multisig) == 1) await dog.deny(deployer.address); console.log("7");
    // if(await abacus.wards(deployer.address) == 1 && await abacus.wards(multisig) == 1) await abacus.deny(deployer.address); console.log("8");
    // if(await rewards.wards(deployer.address) == 1 && await rewards.wards(multisig) == 1) await rewards.deny(deployer.address); console.log("9");
    // if(await interaction.wards(deployer.address) == 1 && await interaction.wards(multisig) == 1) await interaction.deny(deployer.address); console.log("10");
    // if(await jar.wards(deployer.address) == 1 && await jar.wards(multisig) == 1) await jar.deny(deployer.address); console.log("11");

    // RETH rely/deny/transfer
    let mastervault = await ethers.getContractAt("MasterVault_V2", reth._masterVaultR);
    let dcol = await ethers.getContractAt("dCol", reth._dMatic);
    let davosprovider = await ethers.getContractAt("DavosProvider", reth._davosProvider);
    let clipper = await ethers.getContractAt("Clipper", reth._clip);
    let gemjoin = await ethers.getContractAt("GemJoin", reth._gemJoin);

    console.log("RETH");
    if(await mastervault.owner() != multisig) await mastervault.transferOwnership(multisig); console.log("1");
    if(await dcol.owner() != multisig) await dcol.transferOwnership(multisig); console.log("2");
    if(await davosprovider.owner() != multisig) await davosprovider.transferOwnership(multisig); console.log("3");
    if(await clipper.wards(multisig) == 0) await clipper.rely(multisig); console.log("4");
    if(await gemjoin.wards(multisig) == 0) await gemjoin.rely(multisig); console.log("5");
    // if(await clipper.wards(deployer.address) == 1 && await clipper.wards(multisig) == 1) await clipper.deny(deployer.address); console.log("6");
    // if(await gemjoin.wards(deployer.address) == 1 && await gemjoin.wards(multisig) == 1) await gemjoin.deny(deployer.address); console.log("7");

    // WSTETH rely/deny/transfer
    mastervault = await ethers.getContractAt("MasterVault_V2", wsteth._masterVaultW);
    dcol = await ethers.getContractAt("dCol", wsteth._dMatic);
    davosprovider = await ethers.getContractAt("DavosProvider", wsteth._davosProvider);
    clipper = await ethers.getContractAt("Clipper", wsteth._clip);
    gemjoin = await ethers.getContractAt("GemJoin", wsteth._gemJoin);

    console.log("WSTETH");
    if(await mastervault.owner() != multisig) await mastervault.transferOwnership(multisig); console.log("1");
    if(await dcol.owner() != multisig) await dcol.transferOwnership(multisig); console.log("2");
    if(await davosprovider.owner() != multisig) await davosprovider.transferOwnership(multisig); console.log("3");
    if(await clipper.wards(multisig) == 0) await clipper.rely(multisig); console.log("4");
    if(await gemjoin.wards(multisig) == 0) await gemjoin.rely(multisig); console.log("5");
    // if(await clipper.wards(deployer.address) == 1 && await clipper.wards(multisig) == 1) await clipper.deny(deployer.address); console.log("6");
    // if(await gemjoin.wards(deployer.address) == 1 && await gemjoin.wards(multisig) == 1) await gemjoin.deny(deployer.address); console.log("7");

    // ANKRETH rely/deny/transfer
    mastervault = await ethers.getContractAt("MasterVault_V2", ankreth._masterVaultA);
    dcol = await ethers.getContractAt("dCol", ankreth._dMatic);
    davosprovider = await ethers.getContractAt("DavosProvider", ankreth._davosProvider);
    clipper = await ethers.getContractAt("Clipper", ankreth._clip);
    gemjoin = await ethers.getContractAt("GemJoin", ankreth._gemJoin);

    console.log("ANKRETH");
    if(await mastervault.owner() != multisig) await mastervault.transferOwnership(multisig); console.log("1");
    if(await dcol.owner() != multisig) await dcol.transferOwnership(multisig); console.log("2");
    if(await davosprovider.owner() != multisig) await davosprovider.transferOwnership(multisig); console.log("3");
    if(await clipper.wards(multisig) == 0) await clipper.rely(multisig); console.log("4");
    if(await gemjoin.wards(multisig) == 0) await gemjoin.rely(multisig); console.log("5");
    // if(await clipper.wards(deployer.address) == 1 && await clipper.wards(multisig) == 1) await clipper.deny(deployer.address); console.log("6");
    // if(await gemjoin.wards(deployer.address) == 1 && await gemjoin.wards(multisig) == 1) await gemjoin.deny(deployer.address); console.log("7");

    // RatioAdapter transfer
    console.log("RatioAdater");
    let ratioadapter = await ethers.getContractAt("RatioAdapter", oracles._ratioAdapter);
    if(await ratioadapter.owner() != multisig) await ratioadapter.setToken("0x12D8CE035c5DE3Ce39B1fDD4C1d5a745EAbA3b8C", '', '', 'ratio()', false);
    if(await ratioadapter.owner() != multisig) await ratioadapter.transferOwnership(multisig); console.log("1")

    // Bridge transfer
    console.log("Bridge");
    let ownerABI = ["function owner() external view returns(address)"]
    let bridge = await ethers.getContractAt(abiTran, brige);
    let b = await ethers.getContractAt(ownerABI, brige);
    if(await b.owner() != multisig) await bridge.transferOwnership(multisig); console.log("1")

    // ProxyAdmins
    console.log("ProxyAdmins");
    let proxyAdminAddress1 = parseAddress(await ethers.provider.getStorageAt(ankreth._masterVaultA, admin_slot));
    let proxyAdminAddress2 = parseAddress(await ethers.provider.getStorageAt(_davos, admin_slot));
    let proxyAdminAddress3 = parseAddress(await ethers.provider.getStorageAt(brige, admin_slot));

    let PROXY_ADMIN_ABI = ["function owner() public view returns (address)"];
    let proxyAdmin1 = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress1);
    let proxyAdmin2 = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress2);
    let proxyAdmin3 = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress3);

    let owner1 = await proxyAdmin1.owner();
    let owner2 = await proxyAdmin2.owner();
    let owner3 = await proxyAdmin3.owner();

    console.log("New Owner   : ", owner1);
    console.log("DUSD Owner  : ", owner2);
    console.log("Bridge Owner: ", owner3);
    console.log("Destination : ", multisig);

    if (owner1 != ethers.constants.AddressZero && owner1 != multisig) {
        proxyAdmin1 = await ethers.getContractAt(abiTran, proxyAdminAddress1);
        await proxyAdmin1.transferOwnership(multisig);
        console.log("proxyAdmin transferred");
    } else {
        console.log("Already owner of proxyAdmin")
    }

    if (owner2 != ethers.constants.AddressZero && owner2 != multisig) {
        proxyAdmin2 = await ethers.getContractAt(abiTran, proxyAdminAddress2);
        await proxyAdmin2.transferOwnership(multisig);
        console.log("proxyAdmin transferred");
    } else {
        console.log("Already owner of proxyAdmin")
    }

    if (owner3 != ethers.constants.AddressZero && owner3 != multisig) {
        proxyAdmin3 = await ethers.getContractAt(abiTran, proxyAdminAddress3);
        await proxyAdmin3.transferOwnership(multisig);
        console.log("proxyAdmin transferred");
    } else {
        console.log("Already owner of proxyAdmin")
    }

    console.log("Complete !!!");

    console.log("Optional Step for poking");
    await interaction.poke("0x93402F1908dD009C857962b45278E71C7F63647f");
    await interaction.poke("0x687B069759b053866715542f22877DA9091f20f5");
    await interaction.poke("0x24318b8a0CBaCc61cAdE47e5457Eea7237EB2c0E");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});