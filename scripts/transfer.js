let hre = require("hardhat");
let {ethers, upgrades} = require("hardhat");

const reth = require("./collateral/addressesRETH_zkevm.json");
const wsteth = require("./collateral/addressesWSTETH_zkevm.json");
const ankreth = require("./collateral/addressesANKRETH_zkevm.json");
const oracles = require("./collateral/addressesOralces_zkevm.json");

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

    // Selectors
    let abiRely = ["function rely(address) external"]
    let abiDeny = ["function deny(address) external"]
    let abiTran = ["function transferOwnership(address) external"]

    // Data
    let {_vat, _spot, _davos, _davosJoin, _jug, _vow, _dog, _abacus } = require(`./protocol/addresses_${hre.network.name}_1.json`);
    let {_rewards, _interaction }  = require(`./protocol/addresses_${hre.network.name}_2.json`);
    let {_jar }  = require(`./protocol/addresses_${hre.network.name}_3.json`);

    // Core Relies
    let vat = await ethers.getContractAt(abiRely, _vat);
    let spot = await ethers.getContractAt(abiRely, _spot);
    let davos = await ethers.getContractAt(abiRely, _davos);
    let davosJoin = await ethers.getContractAt(abiRely, _davosJoin);
    let jug = await ethers.getContractAt(abiRely, _jug);
    let vow = await ethers.getContractAt(abiRely, _vow);
    let dog = await ethers.getContractAt(abiRely, _dog);
    let abacus = await ethers.getContractAt(abiRely, _abacus);
    let rewards = await ethers.getContractAt(abiRely, _rewards);
    let interaction = await ethers.getContractAt(abiRely, _interaction);
    let jar = await ethers.getContractAt(abiRely, _jar);

    console.log("Core Relies")
    await vat.rely(multisig); console.log("1")
    await spot.rely(multisig); console.log("2")
    await davos.rely(multisig); console.log("3")
    await davosJoin.rely(multisig); console.log("4")
    await jug.rely(multisig); console.log("5")
    await vow.rely(multisig); console.log("6")
    await dog.rely(multisig); console.log("7")
    await abacus.rely(multisig); console.log("8")
    await rewards.rely(multisig); console.log("9")
    await interaction.rely(multisig); console.log("10")
    await jar.rely(multisig); console.log("11")

    // Core Denies
    vat = await ethers.getContractAt(abiDeny, _vat);
    spot = await ethers.getContractAt(abiDeny, _spot);
    davos = await ethers.getContractAt(abiDeny, _davos);
    davosJoin = await ethers.getContractAt(abiDeny, _davosJoin);
    jug = await ethers.getContractAt(abiDeny, _jug);
    vow = await ethers.getContractAt(abiDeny, _vow);
    dog = await ethers.getContractAt(abiDeny, _dog);
    abacus = await ethers.getContractAt(abiDeny, _abacus);
    rewards = await ethers.getContractAt(abiDeny, _rewards);
    interaction = await ethers.getContractAt(abiDeny, _interaction);
    jar = await ethers.getContractAt(abiDeny, _jar);

    console.log("Core Denies");
    await vat.deny(deployer.address); console.log("1");
    await spot.deny(deployer.address); console.log("2");
    await davos.deny(deployer.address); console.log("3");
    await davosJoin.deny(deployer.address); console.log("4");
    await jug.deny(deployer.address); console.log("5");
    await vow.deny(deployer.address); console.log("6");
    await dog.deny(deployer.address); console.log("7");
    await abacus.deny(deployer.address); console.log("8");
    await rewards.deny(deployer.address); console.log("9");
    await interaction.deny(deployer.address); console.log("10");
    await jar.deny(deployer.address); console.log("11");

    // RETH rely/deny/transfer
    let mastervault = await ethers.getContractAt(abiTran, reth._masterVaultR);
    let dcol = await ethers.getContractAt(abiTran, reth._dMatic);
    let davosprovider = await ethers.getContractAt(abiTran, reth._davosProvider);
    let clipper = await ethers.getContractAt(abiRely, reth._clip);
    let gemjoin = await ethers.getContractAt(abiRely, reth._gemJoin);

    console.log("RETH");
    await mastervault.transferOwnership(multisig); console.log("1");
    await dcol.transferOwnership(multisig); console.log("2");
    await davosprovider.transferOwnership(multisig); console.log("3");
    await clipper.rely(multisig); console.log("4");
    await gemjoin.rely(multisig); console.log("5");
    clipper = await ethers.getContractAt(abiDeny, reth._clip);
    gemjoin = await ethers.getContractAt(abiDeny, reth._gemJoin);
    await clipper.deny(deployer.address); console.log("6");
    await gemjoin.deny(deployer.address); console.log("7");

    // WSTETH rely/deny/transfer
    mastervault = await ethers.getContractAt(abiTran, wsteth._masterVaultW);
    dcol = await ethers.getContractAt(abiTran, wsteth._dMatic);
    davosprovider = await ethers.getContractAt(abiTran, wsteth._davosProvider);
    clipper = await ethers.getContractAt(abiRely, wsteth._clip);
    gemjoin = await ethers.getContractAt(abiRely, wsteth._gemJoin);

    console.log("WSTETH");
    await mastervault.transferOwnership(multisig); console.log("1");
    await dcol.transferOwnership(multisig); console.log("2");
    await davosprovider.transferOwnership(multisig); console.log("3");
    await clipper.rely(multisig); console.log("4");
    await gemjoin.rely(multisig); console.log("5");
    clipper = await ethers.getContractAt(abiDeny, wsteth._clip);
    gemjoin = await ethers.getContractAt(abiDeny, wsteth._gemJoin);
    await clipper.deny(deployer.address); console.log("6");
    await gemjoin.deny(deployer.address); console.log("7");

    // ANKRETH rely/deny/transfer
    mastervault = await ethers.getContractAt(abiTran, ankreth._masterVaultA);
    dcol = await ethers.getContractAt(abiTran, ankreth._dMatic);
    davosprovider = await ethers.getContractAt(abiTran, ankreth._davosProvider);
    clipper = await ethers.getContractAt(abiRely, ankreth._clip);
    gemjoin = await ethers.getContractAt(abiRely, ankreth._gemJoin);

    console.log("ANKRETH");
    await mastervault.transferOwnership(multisig); console.log("1");
    await dcol.transferOwnership(multisig); console.log("2");
    await davosprovider.transferOwnership(multisig); console.log("3");
    await clipper.rely(multisig); console.log("4");
    await gemjoin.rely(multisig); console.log("5");
    clipper = await ethers.getContractAt(abiDeny, ankreth._clip);
    gemjoin = await ethers.getContractAt(abiDeny, ankreth._gemJoin);
    await clipper.deny(deployer.address); console.log("6");
    await gemjoin.deny(deployer.address); console.log("7");

    // RatioAdapter transfer
    console.log("RatioAdater");
    let ratioadapter = await ethers.getContractAt(abiTran, oracles._ratioAdapter);
    await ratioadapter.transferOwnership(multisig); console.log("1")

    // Bridge transfer
    console.log("Bridge");
    let bridge = await ethers.getContractAt(abiTran, brige);
    await bridge.transferOwnership(multisig); console.log("1")

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
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});