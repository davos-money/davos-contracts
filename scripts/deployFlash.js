const hre = require("hardhat");
const {ethers, upgrades} = require("hardhat");
const {ether} = require("@openzeppelin/test-helpers");

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

  [deployer] = await ethers.getSigners();

  let vat, davos, davosJoin, vow;
  let _multisig;

  /** Load Addresses */ 
  if (hre.network.name == "polygon") {
        vat = "0xA983f4b5137B89f82B2Eb5DAC415e6490F06f639";
        davos = "0xEC38621e72D86775a89C7422746de1f52bbA5320";
        davosJoin = "0x8FCD9542a6Ee0F05f470230da5B8cB41033da6Df";
        vow = "0x58CF68493BC178a17b43b270DDBB8d4c1A271429";
        _multisig = "0x8b4b8581d0FA0E4b7FF840531eC914f1B9498B41";
    } else if (hre.network.name == "ethereum") {
        vat = "0x1c539E755A1BdaBB168aA9ad60B31548991981F9";
        davos = "0xa48F322F8b3edff967629Af79E027628b9Dd1298";
        davosJoin = "0xec348813A94c2873E4D2372ae40955392A12ACFF";
        vow = "0xb2565e05816963CFD957d8baEab95033470352bb";
        _multisig = "0x42bA6167ac1e5a37bA2B773EC3b7e4761cBC821C";
    } else if (hre.network.name == "arbitrum") {
        vat = "0x2304CE6B42D505141A286B7382d4D515950b1890";
        davos = "0x8EC1877698ACF262Fe8Ad8a295ad94D6ea258988";
        davosJoin = "0x92E77bA6ceCb46733aE482ba1d7E011Aa872Ad7e";
        vow = "0xe84d3029feDd3CbE3d30c5245679CBD9B30118bC";
        _multisig = "0x39355FFAfC47E54E7d7e786b1Df0fa0e222FBd06";
    } else if (hre.network.name == "optimism") {
        vat = "0xf2393EEAdD67bf68a60f39992113775966F34E1e";
        davos = "0xb396b31599333739A97951b74652c117BE86eE1D";
        davosJoin = "0xe84d3029feDd3CbE3d30c5245679CBD9B30118bC";
        vow = "0x74FB5adf4eBA704c42f5974B83E53BBDA46F0C96";
        _multisig = "0xd41773c62c84f828D5Db0F9B8B0274cB5aB352Bd";
    } else if (hre.network.name == "bsc") {
        vat = "0x2304CE6B42D505141A286B7382d4D515950b1890";
        davos = "0x8EC1877698ACF262Fe8Ad8a295ad94D6ea258988";
        davosJoin = "0x92E77bA6ceCb46733aE482ba1d7E011Aa872Ad7e";
        vow = "0xe84d3029feDd3CbE3d30c5245679CBD9B30118bC";
        _multisig = "0x0567E328D0E23be8B8cB8c3004bEAc39fbD11082";
    } else if (hre.network.name == "bscTestnet") {
        vat = "0xCB947cE60716a1B633188175FD1377115D9D6cf8";
        davos = "0xb1592cde087605AF4588D55630C620Fe7A1B8c73";
        davosJoin = "0xE21151F7eB56d469306bBE546F232847BB6Adb78";
        vow = "0x6ae8eCaD3F0711fd6d648cDaf58AE08D6692c342";
        _multisig = "0x2850C2929B33BCE33b8aa81B0A9D1d3632118896";
    } else {
        throw "STOPPED";
    }
    let args = [vat, davos, davosJoin, vow];

    this.Flash = await hre.ethers.getContractFactory("Flash");
  
    let flash = await upgrades.deployProxy(this.Flash, args, {initializer: "initialize"});
    await flash.deployed();
    let flashImp = await upgrades.erc1967.getImplementationAddress(flash.address);
    console.log("Flash       : " + flash.address);
    console.log("imp         : " + flashImp);

    let initialNonce = await ethers.provider.getTransactionCount(deployer.address);
    let _nonce = initialNonce

    await flash["file(bytes32,uint256)"]("0x6d61780000000000000000000000000000000000000000000000000000000000", "50000000000000000000000", {nonce: _nonce}); _nonce += 1;
    console.log("1")
    await flash["file(bytes32,uint256)"]("0x746f6c6c00000000000000000000000000000000000000000000000000000000", "10000000000000000", {nonce: _nonce}); _nonce += 1;
    
    console.log("Ownership");
    await flash.rely(_multisig, {nonce: _nonce}); _nonce += 1;

    console.log("=== Try proxyAdmin transfer...");
    const proxyAdminAddress = parseAddress(await ethers.provider.getStorageAt(flash.address, admin_slot));

    let PROXY_ADMIN_ABI = ["function owner() public view returns (address)"];
    let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);

    let owner = await proxyAdmin.owner();
    console.log("Owner: ", owner);
    console.log("Multi: ", _multisig);

    if (owner != ethers.constants.AddressZero && owner != _multisig) {
        console.log("Transfering")
        PROXY_ADMIN_ABI = ["function transferOwnership(address newOwner) public"];
        let proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);
        await proxyAdmin.transferOwnership(_multisig, {nonce: _nonce}); _nonce += 1;
        console.log("proxyAdmin transferred");
    } else {
        console.log("Already owner of proxyAdmin")
    }

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });