const { ethers } = require('hardhat');
const TransparentUpgradeableProxy = require("@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json");
const ProxyAdmin = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json");
const ether = require('@openzeppelin/test-helpers/src/ether');
const { increase } = require('@openzeppelin/test-helpers/src/time');
const { EDIT_DISTANCE_THRESHOLD } = require('hardhat/internal/constants');

let wad = "000000000000000000", // 18 Decimals
    ray = "000000000000000000000000000", // 27 Decimals
    rad = "000000000000000000000000000000000000000000000"; // 45 Decimals

describe('===Gas Calculation===', function () {
    let deployer;

    beforeEach(async function () {
        [deployer, _multisig] = await ethers.getSigners();
    });

    describe('--- calculate()', function () {
        it('calculates: gasCost', async function () {

            var total = Number(0);

            this.Vat = await ethers.getContractFactory("Vat");
            this.Spot = await ethers.getContractFactory("Spotter");
            this.Davos = await ethers.getContractFactory("Davos");
            this.DavosJoin = await ethers.getContractFactory("DavosJoin");
            this.Jug = await ethers.getContractFactory("Jug");
            this.Vow = await ethers.getContractFactory("Vow");
            this.Dog = await ethers.getContractFactory("Dog");
            this.Abacus = await ethers.getContractFactory("LinearDecrease");

            this.PA = await hre.ethers.getContractFactory(ProxyAdmin.abi, ProxyAdmin.bytecode);
            this.TUP = await hre.ethers.getContractFactory(TransparentUpgradeableProxy.abi, TransparentUpgradeableProxy.bytecode);

            this.DgtRewards = await hre.ethers.getContractFactory("DGTRewards");
            this.AuctionProxy = await hre.ethers.getContractFactory("AuctionProxy");
            const auctionProxy = await this.AuctionProxy.deploy();
            this.Interaction = await hre.ethers.getContractFactory("Interaction", {
                unsafeAllow: ['external-library-linking'],
                libraries: {
                    AuctionProxy: auctionProxy.address
                }
            });

            // Core
            let vatImp = await this.Vat.deploy();
            let spotImp = await this.Spot.deploy();
            let davosImp = await this.Davos.deploy();
            let davosJoinImp = await this.DavosJoin.deploy();
            let jugImp = await this.Jug.deploy();
            let vowImp = await this.Vow.deploy();
            let dogImp = await this.Dog.deploy();
            let abacusImp = await this.Abacus.deploy();

            total += Number(vatImp.deployTransaction.gasLimit);
            total += Number(spotImp.deployTransaction.gasLimit);
            total += Number(davosImp.deployTransaction.gasLimit);
            total += Number(davosJoinImp.deployTransaction.gasLimit);
            total += Number(jugImp.deployTransaction.gasLimit);
            total += Number(vowImp.deployTransaction.gasLimit);
            total += Number(dogImp.deployTransaction.gasLimit);
            total += Number(abacusImp.deployTransaction.gasLimit);

            console.log("Vat---------------------------------" + vatImp.deployTransaction.gasLimit)
            console.log("Spot--------------------------------" + spotImp.deployTransaction.gasLimit)
            console.log("Davos-------------------------------" + davosImp.deployTransaction.gasLimit)
            console.log("DJoin-------------------------------" + davosJoinImp.deployTransaction.gasLimit)
            console.log("Jug---------------------------------" + jugImp.deployTransaction.gasLimit)
            console.log("Vow---------------------------------" + vowImp.deployTransaction.gasLimit)
            console.log("Dog---------------------------------" + dogImp.deployTransaction.gasLimit)
            console.log("Aba---------------------------------" + abacusImp.deployTransaction.gasLimit)
            console.log("TOTAL-------------------------------" + total);

            // Proxy Admin
            let proxyAdmin = await this.PA.deploy();
            console.log("ProxyAdmin--------------------------" + proxyAdmin.deployTransaction.gasLimit)
            total += Number(proxyAdmin.deployTransaction.gasLimit);
            console.log("TOTAL-------------------------------" + total);

            // Logic, Admin, Data
            let vat = await this.TUP.deploy(vatImp.address, proxyAdmin.address, "0x");
            let spot = await this.TUP.deploy(spotImp.address, proxyAdmin.address, "0x");
            let davos = await this.TUP.deploy(davosImp.address, proxyAdmin.address, "0x");
            let davosJoin = await this.TUP.deploy(davosJoinImp.address, proxyAdmin.address, "0x");
            let jug = await this.TUP.deploy(jugImp.address, proxyAdmin.address, "0x");
            let vow = await this.TUP.deploy(vowImp.address, proxyAdmin.address, "0x");
            let dog = await this.TUP.deploy(dogImp.address, proxyAdmin.address, "0x");
            let abacus = await this.TUP.deploy(abacusImp.address, proxyAdmin.address, "0x");

            total += Number(vat.deployTransaction.gasLimit) * 8;
            console.log("8 Proxies---------------------------" + Number(vat.deployTransaction.gasLimit)*8)
            console.log("TOTAL-------------------------------" + total)

            let dgtRewardsImp = await this.DgtRewards.deploy();
            let interactionImp = await this.Interaction.deploy();
            total += Number(dgtRewardsImp.deployTransaction.gasLimit)
            total += Number(auctionProxy.deployTransaction.gasLimit)
            total += Number(interactionImp.deployTransaction.gasLimit)

            console.log("Rewards-----------------------------" + dgtRewardsImp.deployTransaction.gasLimit)
            console.log("AuctionProxy------------------------" + auctionProxy.deployTransaction.gasLimit)
            console.log("Interaction-------------------------" + interactionImp.deployTransaction.gasLimit)
            console.log("TOTAL-------------------------------" + total);

            let rewards = await this.TUP.deploy(dgtRewardsImp.address, proxyAdmin.address, "0x");
            let interaction = await this.TUP.deploy(interactionImp.address, proxyAdmin.address, "0x");

            total += Number(vat.deployTransaction.gasLimit) * 2;
            console.log("2 Proxies---------------------------" + Number(vat.deployTransaction.gasLimit)*2)
            console.log("TOTAL-------------------------------" + total);

            vat = await ethers.getContractAt("Vat", vat.address);
            spot = await ethers.getContractAt("Spotter", spot.address);
            davos = await ethers.getContractAt("Davos", davos.address);
            davosJoin = await ethers.getContractAt("DavosJoin", davosJoin.address);
            jug = await ethers.getContractAt("Jug", jug.address);
            vow = await ethers.getContractAt("Vow", vow.address);
            dog = await ethers.getContractAt("Dog", dog.address);
            abacus = await ethers.getContractAt("LinearDecrease", abacus.address);
            rewards = await ethers.getContractAt("DGTRewards", rewards.address);
            interaction = await ethers.getContractAt("Interaction", interaction.address);

            let receipt;
            receipt = await (await vat.initialize()).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await spot.initialize(vat.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davos.initialize(1, "DUSD", "5000000" + wad)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davosJoin.initialize(vat.address, davos.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await jug.initialize(vat.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vow.initialize(vat.address, davosJoin.address, deployer.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dog.initialize(vat.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await abacus.initialize()).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await rewards.initialize(vat.address, ether("100000000").toString(), "5")).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await interaction.initialize(vat.address, spot.address, davos.address, davosJoin.address, jug.address, dog.address, rewards.address)).wait(); total += Number(receipt.cumulativeGasUsed);

            receipt = await (await vat.rely(spot.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat.rely(davosJoin.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat.rely(jug.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat.rely(dog.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Line"), 5000000 + rad)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davos.rely(davosJoin.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davos.setSupplyCap("5000000" + wad)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await spot.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await spot["file(bytes32,uint256)"](ethers.utils.formatBytes32String("par"), 1 + ray)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await rewards.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davosJoin.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davosJoin.rely(vow.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dog.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dog["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dog["file(bytes32,uint256)"](ethers.utils.formatBytes32String("Hole"), 50000000 + rad)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await jug.rely(interaction.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await jug["file(bytes32,address)"](ethers.utils.formatBytes32String("vow"), vow.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vow.rely(dog.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vow["file(bytes32,address)"](ethers.utils.formatBytes32String("davos"), davos.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await abacus.connect(deployer)["file(bytes32,uint256)"](ethers.utils.formatBytes32String("tau"), 36000)).wait(); total += Number(receipt.cumulativeGasUsed);

            console.log("TOTAL ALL INITIALIZE ---------------" + total);

            receipt = await (await interaction.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await rewards.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vat.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await spot.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davos.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await davosJoin.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await jug.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await vow.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await dog.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);
            receipt = await (await abacus.rely(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);

            proxyAdmin = await ethers.getContractAt(["function transferOwnership(address) external"], proxyAdmin.address);
            receipt = await (await proxyAdmin.transferOwnership(_multisig.address)).wait(); total += Number(receipt.cumulativeGasUsed);

            console.log("TOTAL ALL TRANSFERS ----------------" + total);
        });
    });
});