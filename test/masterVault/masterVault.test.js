const { expect, assert } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers, upgrades } = require("hardhat");
const { parse } = require("path");
const ethUtils = ethers.utils;
const NetworkSnapshotter = require("../helpers/networkSnapshotter");
const { sign } = require("crypto");

async function deploy() {
  const { MaxUint256 } = ethers.constants;
  const mintAmount = ethUtils.parseEther("10000000");
  const addAmount = ethUtils.parseEther("30");

  [deployer, user1] = await ethers.getSigners();

  // const LPFactory = await ethers.getContractFactory("LP");
  // const SwapPoolFactory = await ethers.getContractFactory("SwapPool");
  const WNativeFactory = await ethers.getContractFactory("Token");
  const CerosTokenFactory = await ethers.getContractFactory("Token");

  // lp = await LPFactory.connect(deployer).deploy();
  // await lp.deployed();
  wNative = await WNativeFactory.connect(deployer).deploy();
  await wNative.deployed();
  cerosToken = await CerosTokenFactory.connect(deployer).deploy();
  await cerosToken.deployed();

  // swapPool = await upgrades.deployProxy(
  //   SwapPoolFactory,
  //   [wNative.address,
  //   cerosToken.address,
  //   lp.address,
  //   false,
  //   false],
  //   {initializer: "initialize"}
  // );
  // await swapPool.deployed();

  await wNative.connect(user1).mint(user1.address, mintAmount);
  await cerosToken.connect(user1).mint(user1.address, mintAmount);

  // await wNative.connect(user1).approve(swapPool.address, MaxUint256);
  // await cerosToken.connect(user1).approve(swapPool.address, MaxUint256);
  
  await cerosToken.setRatio(ethUtils.parseEther("0.6"));
  
  // await swapPool.setFee(100, 3);
  // await swapPool.setFee(100, 4);
  // Initialize Contracts
  // await lp.setSwapPool(swapPool.address);
  // await swapPool.connect(user1).addLiquidity(addAmount, addAmount);
  return [/**swapPool,*/ wNative, cerosToken];
} 

describe("MasterVault", function () {

  // Variables
  let masterVault, cerosStrategy, wMatic, aMaticc, swapPool,
      destination, feeRecipient , underlyingToken , certToekn, wNative, cerosToken;

  let wMaticAddress,
      aMATICcAddress,
      swapPoolAddress,
      ceRouterAddress,
      dex = "0xE592427A0AEce92De3Edee1F18E0157C05861564", 
      dexPairFee = 3000,
      // priceGetterAddress = "0xc82e5792F393a1D90681773B75d7a408010ade2c",
      priceGetterAddress = ethers.constants.AddressZero,
      maxDepositFee = 500000, 
      maxWithdrawalFee = 500000,
      maxStrategies = 10,
      waitingPoolCapLimit = 10;

  async function getTokenBalance(account, token) {
    const tokenContract = await ethers.getContractAt("ERC20Upgradeable", token);
    return await tokenContract.balanceOf(account);
  }

  async function depositAndAllocate(masterVault, signer, depositAmount) {
    await wMatic.connect(signer).approve(masterVault.address, depositAmount);
    tx = await masterVault.connect(signer).deposit(depositAmount, signer1.address);  
    await masterVault.allocate();
  }

  async function impersonateAccount(address) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [address],
    });
    let signer = await ethers.provider.getSigner(address);
    signer.address = signer._address;
    return signer;
  };

  const networkSnapshotter = new NetworkSnapshotter();

  // Deploy and Initialize contracts
  before(async function () {

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    signer1 =  accounts[1];
    // deployer = await impersonateAccount("0x57f9672ba603251c9c03b36cabdbbca7ca8cfcf4");
    // signer1 = await impersonateAccount("0x57f9672ba603251c9c03b36cabdbbca7ca8cfcf4");
    signer2 =  accounts[2];
    signer3 =  accounts[3];

    [/**swapPool,*/ wNative, cerosToken] = await deploy();
    wMaticAddress = wNative.address
    aMATICcAddress = cerosToken.address
    // swapPoolAddress = swapPool.address

    // Get Contracts
    MasterVault = await ethers.getContractFactory("MasterVault");
    CerosStrategy = await ethers.getContractFactory("CerosYieldConverterStrategyLs");
    WaitingPool = await ethers.getContractFactory("WaitingPool");
    CeRouter = await ethers.getContractFactory("CerosRouterLs");
    Token = await ethers.getContractFactory("Token");
    CeaMATICc = await ethers.getContractFactory("CeToken");
    CeVault = await ethers.getContractFactory("CeVault");
    PriceGetter = await ethers.getContractFactory("PriceGetter");
    Pool = await ethers.getContractFactory("PolygonPool");
    
    // Deploy Contracts
    wMatic = await Token.attach(wMaticAddress);
    aMaticc = await Token.attach(aMATICcAddress);
    // swapPool = await ethers.getContractAt("SwapPool", swapPoolAddress);
    // ceRouter = await CeRouter.attach(ceRouterAddress);
    
    pool = await Pool.deploy(aMaticc.address, wMatic.address);
    await pool.deployed();

    ceaMATICc = await upgrades.deployProxy(CeaMATICc, ["CEROS aMATICc Vault Token", "ceaMATICc"], {initializer: "initialize"});
    await ceaMATICc.deployed();

    ceVault = await upgrades.deployProxy(CeVault, ["CEROS aMATICc Vault", ceaMATICc.address, aMATICcAddress], {initializer: "initialize"});
    await ceVault.deployed();
    ceVaultImp = await upgrades.erc1967.getImplementationAddress(ceVault.address);

    cerosRouter = await upgrades.deployProxy(CeRouter, [aMATICcAddress, wMaticAddress, wMaticAddress, ceVault.address, dex, dexPairFee, pool.address, priceGetterAddress], {initializer: "initialize"}, {gasLimit: 2000000});
    await cerosRouter.deployed();
    cerosRouterImp = await upgrades.erc1967.getImplementationAddress(cerosRouter.address);

    await ceaMATICc.changeVault(ceVault.address);
    await ceVault.changeRouter(cerosRouter.address);

    masterVault = await upgrades.deployProxy(
      MasterVault,
      [wMaticAddress, "CEROS MATIC Vault Token", "ceMATIC", maxDepositFee, maxWithdrawalFee, maxStrategies]
    );
    await masterVault.deployed();
    waitingPool = await upgrades.deployProxy(WaitingPool,
      [masterVault.address, wMaticAddress, waitingPoolCapLimit]
      );
    await waitingPool.deployed();
    await masterVault.setWaitingPool(waitingPool.address);
    await masterVault.changeProvider(signer1.address)
      destination = cerosRouter.address,
      feeRecipient = deployer.address,
      underlyingToken = wMaticAddress,
      certToekn = aMATICcAddress;
      // rewardsPool = deployer.address;
    cerosStrategy = await upgrades.deployProxy(CerosStrategy,
      [destination, feeRecipient, underlyingToken, masterVault.address]
    );
    await cerosStrategy.deployed();
    await networkSnapshotter.firstSnapshot();
  });

  afterEach("revert", async () => await networkSnapshotter.revert());

  describe('Basic functionality', async () => {
    it("reverts:: Deposit 0 amount", async function () {
      await expect(
        masterVault
          .connect(signer1)
          .deposit(0, signer1.address)
      ).to.be.revertedWith("MasterVault/invalid-amount");
    });

    it("Deposit: valid amount", async function () {
      depositAmount = ethUtils.parseEther("1");
      maticBalanceBefore = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      receipt = await tx.wait(1);
      txFee = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      maticBalanceAfter = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);
      assert.equal(Number(vaultTokenBalanceAfter), Number(vaultTokenBalanceBefore) + Number(depositAmount));
    });

    it("Deposit: valid amount(when swapFee is set in swapPool)", async function () {
      depositAmount = ethUtils.parseEther("1");
      maticBalanceBefore = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      receipt = await tx.wait(1);
      txFee = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      maticBalanceAfter = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);
      assert.equal(Number(vaultTokenBalanceAfter), Number(vaultTokenBalanceBefore) + Number(depositAmount));
    });

    it("Deposit: wMatic balance of master vault should increase by deposit amount", async function () {
      depositAmount = ethUtils.parseEther("1");
      maticBalanceBefore = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address)
      wMaticTokenBalanceBefore = await getTokenBalance(masterVault.address, wMaticAddress)
      await masterVault.changeProvider(deployer.address);
      await expect(
        masterVault
          .connect(signer1)
          .deposit(depositAmount, signer1.address)
      ).to.be.revertedWith("MasterVault/not-owner-or-provider");
      await masterVault.changeProvider(signer1.address);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      receipt = await tx.wait(1);
      txFee = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      maticBalanceAfter = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);
      wMaticTokenBalanceAfter = await getTokenBalance(masterVault.address, wMaticAddress);
      assert.equal(Number(vaultTokenBalanceAfter), Number(vaultTokenBalanceBefore) + Number(depositAmount));
      assert.equal(Number(wMaticTokenBalanceAfter), Number(wMaticTokenBalanceBefore) + Number(depositAmount));
    });

    it("Deposit: wMatic balance of master vault should increase by deposit amount(deposit fee: 0)", async function () {
      depositAmount = ethUtils.parseEther("1");
      maticBalanceBefore = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address)
      wMaticTokenBalanceBefore = await getTokenBalance(masterVault.address, wMaticAddress);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      receipt = await tx.wait(1);
      txFee = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      maticBalanceAfter = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);
      wMaticTokenBalanceAfter = await getTokenBalance(masterVault.address, wMaticAddress);
      assert.equal(Number(vaultTokenBalanceAfter), Number(vaultTokenBalanceBefore) + Number(depositAmount));
      assert.equal(Number(wMaticTokenBalanceAfter), Number(wMaticTokenBalanceBefore) + Number(depositAmount));
    });

    it("Deposit: totalsupply of master vault should increase by amount(deposit fee: 0)", async function () {
      depositAmount = ethUtils.parseEther("1");
      maticBalanceBefore = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address)
      wMaticTokenBalanceBefore = await getTokenBalance(masterVault.address, wMaticAddress);
      totalSupplyBefore = await masterVault.totalSupply()
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      receipt = await tx.wait(1);
      txFee = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      maticBalanceAfter = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);
      wMaticTokenBalanceAfter = await getTokenBalance(masterVault.address, wMaticAddress);
      totalSupplyAfter = await masterVault.totalSupply();

      assert.equal(Number(vaultTokenBalanceAfter), Number(vaultTokenBalanceBefore) + Number(depositAmount));
      assert.equal(Number(wMaticTokenBalanceAfter), Number(wMaticTokenBalanceBefore) + Number(depositAmount));
      assert.equal(Number(totalSupplyAfter), Number(totalSupplyBefore) + Number(depositAmount));
    });

    it("Deposit: totalsupply of master vault should increase by amount(deposit fee: 0.1%)", async function () {
      let fee = 1000 // 0.1%
      depositAmount = ethUtils.parseEther("1");
      await masterVault
        .connect(deployer)
        .setDepositFee(fee);
      maticBalanceBefore = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address)
      wMaticTokenBalanceBefore = await getTokenBalance(masterVault.address, wMaticAddress)
      totalSupplyBefore = await masterVault.totalSupply()
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      receipt = await tx.wait(1);
      txFee = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      maticBalanceAfter = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);
      wMaticTokenBalanceAfter = await getTokenBalance(masterVault.address, wMaticAddress);
      totalSupplyAfter = await masterVault.totalSupply();
      feeEarned = await masterVault.feeEarned();
      assert.equal(Number(wMaticTokenBalanceAfter), Number(wMaticTokenBalanceBefore) + Number(depositAmount));
      assert.equal(Number(vaultTokenBalanceAfter), Number(vaultTokenBalanceBefore) + Number(depositAmount) - Number(((Number(depositAmount)) * fee) / 1e6));
      assert.equal(Number(totalSupplyAfter), Number(totalSupplyBefore) + Number(depositAmount) - Number(((Number(depositAmount)) * fee) / 1e6));
      assert.equal(Number(feeEarned), Number(((depositAmount) * fee) / 1e6));
    });

    it("Allocate: wMatic balance should match allocation ratios", async function () {
      let depositAmount = ethUtils.parseEther("1");
          allocation = 80 * 10000   // 80%
      availableToWithdrawBefore = await masterVault.availableToWithdraw();
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      receipt = await tx.wait(1);
      
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await masterVault.allocate();
      availableToWithdrawAfter = await masterVault.availableToWithdraw();
      strategyDebt = await masterVault.strategyParams(cerosStrategy.address);
      assert.equal(depositAmount.toString(), Number(availableToWithdrawAfter) + Number(strategyDebt.debt) );
    });

    it("Allocate: wMatic balance should match allocation ratios", async function () {
      depositAmount = ethUtils.parseEther("1");
      allocation = 80 * 10000   // 80%
      availableToWithdrawBefore = await masterVault.availableToWithdraw();
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await depositAndAllocate(masterVault, signer1, depositAmount);
      availableToWithdrawAfter = await masterVault.availableToWithdraw();
      strategyDebt = await masterVault.strategyParams(cerosStrategy.address);
      assert.equal(Number(depositAmount) + Number(depositAmount), Number(availableToWithdrawAfter) + Number(strategyDebt.debt));
    });

    it("Allocate: wMatic balance should match allocation ratios(deposit fee: 0.1%)", async function () {
      let fee = 1000 // 0.1%
      allocation = 80 * 10000   // 80%
      depositAmount = ethUtils.parseEther("1");
      await masterVault.connect(deployer).setDepositFee(fee);
      
      availableToWithdrawBefore = await masterVault.availableToWithdraw();
      
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await depositAndAllocate(masterVault, signer1, depositAmount);
      
      availableToWithdrawAfter = await masterVault.availableToWithdraw();
      strategyDebt = await masterVault.strategyParams(cerosStrategy.address);

      totalSupplyAfter = await masterVault.totalSupply();

      let depositFee = (Number(depositAmount) * fee) / 1e6;
      let depositedAmount = Number(depositAmount) -depositFee;
      assert.equal(Number(totalSupplyAfter), depositedAmount);

      assert.equal(Number(depositAmount), Number(availableToWithdrawAfter) + Number(strategyDebt.debt) + depositFee);
    });

    it("revert:: withdraw: should revert if withdrawal amount is more than vault-token balance(depositAmount)", async function () {
      depositAmount = ethUtils.parseEther("1");
      withdrawAmount = ethUtils.parseEther("1.1");
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await expect(masterVault.connect(signer1).redeem(withdrawAmount, signer1.address, masterVault.address)).to.be.revertedWith("ERC20: burn amount exceeds balance");

      await expect(masterVault.connect(signer1).redeem(0, signer1.address, masterVault.address)).to.be.revertedWith("MasterVault/invalid-amount");
    });

    it("withdraw: should let user withdraw (withdrawal fee: 0)", async function () {
      depositAmount = ethUtils.parseEther("1");

      maticBalanceBefore = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      receipt = await tx.wait(1);
      txFee = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      maticBalanceAfter = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);
      assert.equal(Number(vaultTokenBalanceAfter), Number(vaultTokenBalanceBefore) + Number(depositAmount));
      await masterVault.connect(signer1).redeem((depositAmount).toString(), signer1.address, signer1.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);

      assert.equal(Number(vaultTokenBalanceAfter), 0);
    });

    it("withdrawFromStrategy(): should let owner withdraw from strategy", async function () {
      depositAmount = ethUtils.parseEther("1");
      allocation = 80 * 10000   // 80%
      availableToWithdrawBefore = await masterVault.availableToWithdraw();
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await depositAndAllocate(masterVault, signer1, depositAmount);
      availableToWithdrawAfter = await masterVault.availableToWithdraw();
      strategyDebt = await masterVault.strategyParams(cerosStrategy.address);
      assert.equal(Number(depositAmount) + Number(depositAmount), Number(availableToWithdrawAfter) + Number(strategyDebt.debt));

      await cerosRouter.changeStrategy(cerosStrategy.address);
      await masterVault.withdrawFromStrategy(cerosStrategy.address, strategyDebt.debt);
      strategyDebt = await masterVault.strategyParams(cerosStrategy.address);
      assert.equal(Number(strategyDebt.debt), 0);
    });

    it("revert:: withdrawFromStrategy(): only manager can withdraw from strategy", async function () {
      depositAmount = ethUtils.parseEther("1");
      allocation = 80 * 10000   // 80%
      availableToWithdrawBefore = await masterVault.availableToWithdraw();
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await depositAndAllocate(masterVault, signer1, depositAmount);
      availableToWithdrawAfter = await masterVault.availableToWithdraw();
      strategyDebt = await masterVault.strategyParams(cerosStrategy.address);
      assert.equal(Number(depositAmount) + Number(depositAmount), Number(availableToWithdrawAfter) + Number(strategyDebt.debt));
      
      await expect(
        masterVault
        .connect(signer1)
        .withdrawFromStrategy(cerosStrategy.address, strategyDebt.debt)
        ).to.be.revertedWith("MasterVault/not-owner-or-manager");
    });

    it("revert:: withdrawFromStrategy(): only manager can withdraw from strategy", async function () {
      depositAmount = ethUtils.parseEther("1");
      allocation = 80 * 10000   // 80%
      availableToWithdrawBefore = await masterVault.availableToWithdraw();
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await depositAndAllocate(masterVault, signer1, depositAmount);
      availableToWithdrawAfter = await masterVault.availableToWithdraw();
      strategyDebt = await masterVault.strategyParams(cerosStrategy.address);
      assert.equal(Number(depositAmount) + Number(depositAmount), Number(availableToWithdrawAfter) + Number(strategyDebt.debt));
      
      await expect(
        masterVault
        .withdrawFromStrategy(cerosStrategy.address, 0)
        ).to.be.revertedWith("MasterVault/invalid-amount");
    });

    it("revert:: withdrawFromStrategy(): only owner can withdraw from strategy", async function () {
      depositAmount = ethUtils.parseEther("1");
      allocation = 80 * 10000   // 80%
      availableToWithdrawBefore = await masterVault.availableToWithdraw();
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await depositAndAllocate(masterVault, signer1, depositAmount);
      availableToWithdrawAfter = await masterVault.availableToWithdraw();
      strategyDebt = await masterVault.strategyParams(cerosStrategy.address);
      assert.equal(Number(depositAmount) + Number(depositAmount), Number(availableToWithdrawAfter) + Number(strategyDebt.debt));
      
      await expect(
        masterVault
        .withdrawFromStrategy(cerosStrategy.address, strategyDebt.debt + 1000)
        ).to.be.revertedWith("MasterVault/insufficient-assets-in-strategy");
    });

    it("withdrawAllFromStrategy(): should let owner withdraw all from strategy", async function () {
      depositAmount = ethUtils.parseEther("1");
      allocation = 80 * 10000   // 80%
      availableToWithdrawBefore = await masterVault.availableToWithdraw();

      await cerosRouter.changeStrategy(cerosStrategy.address);
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await depositAndAllocate(masterVault, signer1, depositAmount);
      availableToWithdrawAfter = await masterVault.availableToWithdraw();
      strategyDebt = await masterVault.strategyParams(cerosStrategy.address);
      assert.equal(Number(depositAmount) + Number(depositAmount), Number(availableToWithdrawAfter) + Number(strategyDebt.debt));

      await masterVault.withdrawAllFromStrategy(cerosStrategy.address);
      strategyDebt = await masterVault.strategyParams(cerosStrategy.address);
      assert.equal(Number(strategyDebt.debt), 0);
    });
    
    it("withdraw: should let user withdraw (withdrawal fee: 0.1%)", async function () {
      let fee = 1000 // 0.1%
          depositAmount = ethUtils.parseEther("1");
      await masterVault.connect(deployer).setWithdrawalFee(fee);
      await cerosRouter.changeStrategy(cerosStrategy.address);
      
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      receipt = await tx.wait(1);
      txFee1 = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);
      assert.equal(Number(vaultTokenBalanceAfter), Number(vaultTokenBalanceBefore) + Number(depositAmount));

      maticBalanceBefore = await ethers.provider.getBalance(signer1.address);
      let withdrawAmount = depositAmount;
      tx = await masterVault.connect(signer1).redeem((withdrawAmount).toString(), signer1.address, signer1.address);
      receipt = await tx.wait(1);
      txFee2 = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      
      maticBalanceAfter = await ethers.provider.getBalance(signer1.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);

      let event = (receipt.events?.filter((x) => {return x.event === "Withdraw"}));
      assert.equal(Number(event[0].args.assets), withdrawAmount - (Number(withdrawAmount) * fee / 1e6));
      // assert.equal(Number(maticBalanceAfter), Number(maticBalanceBefore) + Number(event[0].args.shares) - txFee2);
      expect(maticBalanceAfter).eq(maticBalanceBefore.sub(txFee2));

    });

    it("withdraw: should let user withdraw when funds are allocated to strategy (withdrawal fee: 0.1%)", async function () {
      let fee = 1000, // 0.1%
          allocation = 80 * 10000,   // 80%
          depositAmount = ethUtils.parseEther("1");
          // withdrawalAmount = ethUtils.parseEther("1");
      await masterVault.connect(deployer).setWithdrawalFee(fee);
      
      await cerosRouter.changeStrategy(cerosStrategy.address);
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address);
      // tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await aMaticc.mint(cerosRouter.address, parseEther("1"))
      await depositAndAllocate(masterVault, signer1, depositAmount);

      // receipt = await tx.wait(1);
      // txFee1 = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);
      assert.equal(Number(vaultTokenBalanceAfter), Number(vaultTokenBalanceBefore) + Number(depositAmount));

      maticBalanceBefore = await getTokenBalance(signer1.address, wMatic.address);
      let withdrawAmount = depositAmount;
      let wethBal = await masterVault.totalAssetInVault();
      
      await wMatic.mint(masterVault.address, parseEther("100"));
      tx = await masterVault.connect(signer1).redeem(withdrawAmount.toString(), signer1.address, signer1.address);
      let receipt = await tx.wait(1);
      txFee2 = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      
      maticBalanceAfter = await getTokenBalance(signer1.address, wMatic.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);

      let event = (receipt.events?.filter((x) => {return x.event === "Withdraw"}));

      assert.equal(Number(event[0].args.assets), withdrawAmount - (Number(withdrawAmount) * fee / 1e6));
      // assert.equal(Number(vaultTokenBalanceAfter), 0);
      // // assert.equal(Number(maticBalanceAfter), Number(maticBalanceBefore) + Number(event[0].args.shares) - txFee2);
      // expect(maticBalanceAfter, maticBalanceBefore.add(event[0].args.shares).sub(txFee2));
    });

    it("withdrawFee: should let user withdraw when funds are allocated to strategy (withdrawal fee: 0.1%)", async function () {
      let fee = 1000, // 0.1%
          allocation = 80 * 10000,   // 80%
          depositAmount = ethUtils.parseEther("1");
          // withdrawalAmount = ethUtils.parseEther("1");
      await masterVault.connect(deployer).setWithdrawalFee(fee);
      
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address);
      // tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await cerosRouter.changeStrategy(cerosStrategy.address);
      await depositAndAllocate(masterVault, signer1, depositAmount);

      // receipt = await tx.wait(1);
      // txFee1 = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);
      assert.equal(Number(vaultTokenBalanceAfter), Number(vaultTokenBalanceBefore) + Number(depositAmount));

      maticBalanceBefore = await getTokenBalance(signer1.address, wMatic.address);
      let withdrawAmount = depositAmount;
      let wMaticBal = await masterVault.totalAssetInVault();
      
      userBalBefore = await getTokenBalance(signer1.address, wMatic.address);
      tx = await masterVault.connect(signer1).redeem(withdrawAmount.toString(), signer1.address, signer1.address);
      userBalAfter = await getTokenBalance(signer1.address, wMatic.address);
      console.log(userBalBefore)
      console.log(userBalAfter)

      let receipt = await tx.wait(1);
      txFee2 = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      
      maticBalanceAfter = await getTokenBalance(signer1.address, wMatic.address);
      vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);

      let event = (receipt.events?.filter((x) => {return x.event === "Withdraw"}));
      assert.equal(Number(event[0].args.assets), depositAmount - (Number(depositAmount) * fee / 1e6));
      assert.equal(Number(vaultTokenBalanceAfter), 0);
      expect(maticBalanceBefore.add(event[0].args.assets)).to.be.equal(maticBalanceAfter);
      maticBalanceBefore = await getTokenBalance(deployer.address, wMatic.address);
      feeEarned = await masterVault.feeEarned();
      expect(Number(feeEarned)).to.be.equal((Number(depositAmount) * fee / 1e6));
      
      // tx = await masterVault.withdrawFee();
      receipt = await tx.wait(1);
      txFee3 = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      
      maticBalanceAfter = await getTokenBalance(deployer.address, wMatic.address);
      // assert.equal(Number(maticBalanceAfter), Number(maticBalanceBefore.add(feeEarned).sub(txFee3)));
    });

    it("payDebt: should pay the pending withdrawal (withdrawal fee: 0)", async function () {
      let allocation = 80 * 10000,   // 80%
          depositAmount = ethUtils.parseEther("6");
          withdrawalAmount = ethUtils.parseEther("5");
      await cerosRouter.changeStrategy(cerosStrategy.address);
      
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);  

      await wMatic.burn(masterVault.address, depositAmount);

      vaultTokenBalanceAfterDeposit = await getTokenBalance(signer1.address, masterVault.address);
      assert.equal(vaultTokenBalanceAfterDeposit.toString(), vaultTokenBalanceAfterDeposit.toString());

      maticBalanceBefore = await getTokenBalance(signer1.address, wMatic.address);
      await masterVault.connect(signer1).redeem(withdrawalAmount, signer1.address, signer1.address);
      
      maticBalanceAfter = await getTokenBalance(signer1.address, wMatic.address);
      assert.equal(maticBalanceBefore.toString(), maticBalanceAfter.toString());

      pendingWithdrawal = await waitingPool.people(0);
     
      assert.equal(pendingWithdrawal[0], signer1.address);
      assert.equal(Number(pendingWithdrawal[1]), Number(withdrawalAmount));

      waitingPoolBalBefore = await getTokenBalance(waitingPool.address, wMatic.address);
      await wMatic.connect(signer1).approve(masterVault.address, withdrawalAmount);
      await masterVault.connect(signer1).deposit(withdrawalAmount, signer1.address); 
      // balanceOfWithdrawerBefore = await ethers.provider.getBalance(signer1.address)
      await masterVault.connect(signer1).redeem(parseEther("1"), signer1.address, signer1.address);
      await masterVault.connect(deployer).cancelDebt(0);
      waitingPoolBalAfter = await getTokenBalance(waitingPool.address, wMatic.address);

      expect(Number(waitingPoolBalBefore)).to.be.lessThan(Number(waitingPoolBalAfter));

      await masterVault.connect(deployer).tryRemove();
      waitingPoolBalAfterTryRemove = await getTokenBalance(waitingPool.address, wMatic.address);

      expect(Number(waitingPoolBalAfter)).to.be.greaterThan(Number(waitingPoolBalAfterTryRemove));
    });

    it("revert:: waitingPool: withdrawUnsettled(): cannot withdraw already settled debt", async function () {
      let allocation = 80 * 10000,   // 80%
          depositAmount = ethUtils.parseEther("6");
          withdrawalAmount = ethUtils.parseEther("5");
      await cerosRouter.changeStrategy(cerosStrategy.address);
      
      vaultTokenBalanceBefore = await getTokenBalance(signer1.address, masterVault.address);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);  

      await wMatic.burn(masterVault.address, depositAmount);

      vaultTokenBalanceAfterDeposit = await getTokenBalance(signer1.address, masterVault.address);
      assert.equal(vaultTokenBalanceAfterDeposit.toString(), vaultTokenBalanceAfterDeposit.toString());

      maticBalanceBefore = await ethers.provider.getBalance(signer1.address);
      await masterVault.connect(signer1).redeem(withdrawalAmount, signer1.address, signer1.address);
      
      maticBalanceAfter = await ethers.provider.getBalance(signer1.address);
      // vaultTokenBalanceAfter = await getTokenBalance(signer1.address, masterVault.address);

      pendingWithdrawal = await waitingPool.people(0);
     
      assert.equal(pendingWithdrawal[0], signer1.address);
      assert.equal(Number(pendingWithdrawal[1]), Number(withdrawalAmount));
      // assert.equal(Number(vaultTokenBalanceAfter), Number(0));

      await wMatic.connect(signer1).approve(masterVault.address, withdrawalAmount);
      await masterVault.connect(signer1).deposit(withdrawalAmount,signer1.address);
      balanceOfWithdrawerBefore = await ethers.provider.getBalance(signer1.address)
      await masterVault.connect(deployer).cancelDebt(0);
      balanceOfWithdrawerAfter = await ethers.provider.getBalance(signer1.address)

      expect(Number(balanceOfWithdrawerAfter)).to.be.equal(Number(balanceOfWithdrawerBefore));

      // await expect(
      //   waitingPool
      //     .connect(signer1)
      //     .withdrawUnsettled(0)
      // ).to.be.revertedWith("WaitingPool/already-settled");

      await expect(upgrades.deployProxy(WaitingPool,
        [masterVault.address, wMaticAddress, 0]
        )).to.be.revertedWith("WaitingPool/invalid-cap");
    });

    it("retireStrat(): should withdraw all the assets from given strategy", async function () {
      let depositAmount = ethUtils.parseEther("1"),
          allocation = 80 * 10000;
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await cerosRouter.changeStrategy(cerosStrategy.address);
      await depositAndAllocate(masterVault, signer1, depositAmount);

      totalDebtBefore = await masterVault.totalDebt();
      await masterVault.retireStrat(cerosStrategy.address);
      totalDebtAfter = await masterVault.totalDebt();
      strategyParams = await masterVault.strategyParams(cerosStrategy.address);

      assert.equal(Number(totalDebtAfter), 0)
      assert.equal(strategyParams[1], false)
    });

    it("retireStrat(): should mark strategy inactive if debt is less than 10", async function () {
      let depositAmount = ethUtils.parseEther("1"),
          allocation = 80 * 10000;
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await depositAndAllocate(masterVault, signer1, depositAmount);

      await cerosRouter.changeStrategy(cerosStrategy.address);
      await masterVault.withdrawAllFromStrategy(cerosStrategy.address);

      totalDebtBefore = await masterVault.totalDebt();
      assert.equal(Number(totalDebtBefore), 0)

      await masterVault.retireStrat(cerosStrategy.address);
      totalDebtAfter = await masterVault.totalDebt();
      strategyParams = await masterVault.strategyParams(cerosStrategy.address);

      assert.equal(Number(totalDebtAfter), 0)
      assert.equal(strategyParams[1], false)
    });

    it("migrateStrategy(): should withdraw all the assets from given strategy", async function () {
      let depositAmount = ethUtils.parseEther("1"),
          allocation = 80 * 10000,
          newAllocation = 50 * 10000;

      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await aMaticc.mint(cerosRouter.address, parseEther("10"));

      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.changeAllocateOnDeposit(1);
      tx = await masterVault.connect(signer1).deposit(depositAmount, signer1.address);  

      newStrategy = await upgrades.deployProxy(CerosStrategy,
        [destination, feeRecipient, underlyingToken, masterVault.address]
      );
      await newStrategy.deployed();

      totalDebtBefore = await masterVault.totalDebt();
      await expect(
        masterVault
          .migrateStrategy(cerosStrategy.address, ethers.constants.AddressZero, newAllocation, 0)
      ).to.be.revertedWith("");
      await expect(
        masterVault
          .migrateStrategy(ethers.constants.AddressZero, cerosStrategy.address, newAllocation, 0)
      ).to.be.revertedWith("");
      await expect(
        masterVault
          .migrateStrategy(signer1.address, newStrategy.address, newAllocation, 0)
      ).to.be.revertedWith("");
      await cerosRouter.changeStrategy(cerosStrategy.address);
      await expect(
        masterVault
          .migrateStrategy(cerosStrategy.address, newStrategy.address, "10000000", 0)
      ).to.be.revertedWith("MasterVault/>100%");
      await masterVault.migrateStrategy(cerosStrategy.address, newStrategy.address, newAllocation, 0);
      totalDebtAfter = await masterVault.totalDebt();
      assert.equal(Number(totalDebtAfter), 0);
      let assetInVault = await masterVault.totalAssetInVault();
      await masterVault.allocate();
      totalDebtAfter = await masterVault.totalDebt();
      assert.equal(Number(totalDebtAfter), (assetInVault / 2));
    });

    it("depositAllToStrategy(): should deposit all the assets to given strategy", async function () {
      let depositAmount = ethUtils.parseEther("1"),
          allocation = 80 * 10000;
      await expect(
        masterVault
          .addStrategy(ethers.constants.AddressZero, allocation, 0)
      ).to.be.revertedWith("");
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      wMaticBalanceBefore = await getTokenBalance(masterVault.address, wMaticAddress);
      assert.equal(Number(wMaticBalanceBefore), Number(depositAmount))
      
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await masterVault.depositAllToStrategy(cerosStrategy.address);
      wMaticBalanceAfter = await getTokenBalance(masterVault.address, wMaticAddress);
      assert.equal(Number(wMaticBalanceAfter), 0);
    });

    it("depositToStrategy(): should deposit given amount of assets to given strategy", async function () {
      let depositAmount = ethUtils.parseEther("1");
          allocation = 80 * 10000;
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      wMaticBalanceBefore = await getTokenBalance(masterVault.address, wMaticAddress);
      assert.equal(Number(wMaticBalanceBefore), Number(depositAmount))
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await expect(
        masterVault.depositToStrategy(cerosStrategy.address, "0")
      ).to.be.revertedWith("MasterVault/invalid-amount");

      await expect(
        masterVault.depositToStrategy(cerosStrategy.address, depositAmount.add(parseEther("100")))
      ).to.be.revertedWith("MasterVault/insufficient-balance");
      await masterVault.depositToStrategy(cerosStrategy.address, depositAmount.div(ethers.BigNumber.from("2")));
      wMaticBalanceAfter = await getTokenBalance(masterVault.address, wMaticAddress);
      assert.equal(Number(wMaticBalanceAfter), Number(wMaticBalanceBefore) / 2);
    });

    it("depositAllToStrategy(): should deposit all the assets to given strategy", async function () {
      let depositAmount = ethUtils.parseEther("1");
          allocation = 80 * 10000;
      await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
      await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
      await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
      wMaticBalanceBefore = await getTokenBalance(masterVault.address, wMaticAddress);
      assert.equal(Number(wMaticBalanceBefore), Number(depositAmount))
      
      await aMaticc.mint(cerosRouter.address, parseEther("10"))
      await masterVault.depositAllToStrategy(cerosStrategy.address);
      wMaticBalanceAfter = await getTokenBalance(masterVault.address, wMaticAddress);
      assert.equal(Number(wMaticBalanceAfter), 0);
    });

    it("revert:: deposit(): should revert", async function () {
      await expect(
        masterVault
          .connect(deployer)
          .deposit(1, deployer.address)
      ).to.be.revertedWith("");
    });

    it("revert:: mint(): should revert", async function () {
      await expect(
        masterVault
          .connect(deployer)
          .mint(1, deployer.address)
      ).to.be.revertedWith("");
    });

    it("revert:: withdraw(): should revert", async function () {
      await expect(
        masterVault
          .connect(deployer)
          .withdraw(1, deployer.address, deployer.address)
      ).to.be.revertedWith("");
    });

    it("revert:: redeem(): should revert", async function () {
      await expect(
        masterVault
          .connect(deployer)
          .redeem(1, deployer.address, deployer.address)
      ).to.be.revertedWith("");
    });

    describe("setters", async () => {
      it("revert:: setDepositFee(): cannot set more than max", async function () {
        let fee = 51 * 10000;
        await expect(
          masterVault
            .connect(deployer)
            .setDepositFee(fee)
        ).to.be.revertedWith("MasterVault/more-than-maxDepositFee");
      });

      it("setDepositFee(): should let owner set new fee", async function () {
        let fee = 20 * 10000;
        await masterVault
            .connect(deployer)
            .setDepositFee(fee);
        assert.equal(fee, await masterVault.depositFee())
      });

      it("revert:: setWithdrawalFee(): cannot set more than max", async function () {
        let fee = 51 * 10000;
        await expect(
          masterVault
            .connect(deployer)
            .setWithdrawalFee(fee)
        ).to.be.revertedWith("MasterVault/more-than-maxWithdrawalFee");
      });

      it("setWithdrawalFee(): should let owner set new fee", async function () {
        let fee = 40 * 10000;
        await masterVault
            .connect(deployer)
            .setWithdrawalFee(fee);
        assert.equal(fee, await masterVault.withdrawalFee())
      });

      it("revert:: setWaitingPool(): cannot set zero address", async function () {
        await expect(
          masterVault
            .connect(deployer)
            .setWaitingPool(ethers.constants.AddressZero)
        ).to.be.revertedWith("");
      });

      it("revert:: setWaitingPool(): onlyOwner can call", async function () {
        await expect(
          masterVault
            .connect(signer1)
            .setWaitingPool(ethers.constants.AddressZero)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("setWaitingPool(): should let set new waiting pool", async function () {
        await masterVault
            .connect(deployer)
            .setWaitingPool(signer2.address)
        assert.equal(signer2.address, await masterVault.waitingPool())
      });

      it("revert:: addManager(): onlyOwner can call", async function () {
        await expect(
          masterVault
            .connect(signer1)
            .addManager(ethers.constants.AddressZero)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("revert:: addManager(): cannot set zero address", async function () {
        await expect(
          masterVault
            .connect(deployer)
            .addManager(ethers.constants.AddressZero)
        ).to.be.revertedWith("");
      });

      it("addManager(): should let add new manager", async function () {
        await masterVault
            .connect(deployer)
            .addManager(signer2.address)
        assert.equal(await masterVault.manager(signer2.address), true)
      });

      it("revert:: removeManager(): cannot set zero address", async function () {
        await expect(
          masterVault
            .connect(deployer)
            .removeManager(ethers.constants.AddressZero)
        ).to.be.revertedWith("");
      });

      it("removeManager(): should let owner remove manager", async function () {
        await masterVault
            .connect(deployer)
            .addManager(deployer.address)
        await masterVault
          .connect(deployer)
          .removeManager(deployer.address)
        assert.equal(await masterVault.manager(deployer.address), false)
      });

      it("revert:: changeProvider(): cannot set zero address", async function () {
        await expect(
          masterVault
            .connect(deployer)
            .changeProvider(ethers.constants.AddressZero)
        ).to.be.revertedWith("");
      });

      it("changeProvider(): should let owner change provider address", async function () {
        await expect(masterVault.changeProvider(signer2.address))
          .to.emit(masterVault, "ProviderChanged")
          .withArgs(signer2.address);
      });

      it("revert:: changeStrategyAllocation(): cannot change allocation of zero address", async function () {
        await expect(
          masterVault
            .connect(deployer)
            .changeStrategyAllocation(ethers.constants.AddressZero, 0)
        ).to.be.revertedWith("");
      });

      it("changeStrategyAllocation(): should let owner change allocation", async function () {
        await masterVault
          .connect(deployer)
          .changeStrategyAllocation(cerosStrategy.address, 50 * 10000) // 50%
      });

      it("revert:: changeStrategyAllocation(): cannot change allocation to more than 100%", async function () {
        let allocation = 80 * 10000;   // 80%
        await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
        await expect(
          masterVault
            .connect(deployer)
            .changeStrategyAllocation(cerosStrategy.address, 101 * 10000)
        ).to.be.revertedWith("MasterVault/>100%");         
      });

      it("revert:: addStrategy(): cannot set already existing strategy", async function () {
        let allocation = 80 * 10000;   // 80%
        await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
        await expect(
          masterVault
            .connect(deployer)
            .addStrategy(cerosStrategy.address, allocation, 0)
        ).to.be.revertedWith("MasterVault/already-exists");         
      });

      it("revert:: addStrategy(): cannot set already existing strategy", async function () {
        let allocation = 80 * 10000;   // 80%
        await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
        await expect(
          masterVault
            .connect(deployer)
            .addStrategy(signer1.address, 101 * 10000, 0)
        ).to.be.revertedWith("MasterVault/>100%");         
      });

      it("revert:: setWaitingPoolCap(): onlyOwner can call", async function() {
        await expect(
          masterVault
            .connect(signer1)
            .setWaitingPoolCap(12)
        ).to.be.revertedWith("Ownable: caller is not the owner"); 
      });

      it("revert:: setWaitingPoolCap(): should let owner set waiting pool cap limit", async function() {
        let capLimit = 12
        await masterVault.connect(deployer).setWaitingPoolCap(capLimit);
        let waitingPoolCapLimit = await waitingPool.capLimit();
        assert.equal(waitingPoolCapLimit, capLimit)
      });

      it("revert:: setCapLimit(): onlyMasterVault can call", async function() {
        await expect(
          masterVault
            .connect(signer1)
            .setWaitingPoolCap(12)
        ).to.be.revertedWith(""); 
      });

      it("revert:: setCapLimit(): cannot be zero", async function() {
        await expect(
          masterVault
            .connect(deployer)
            .setWaitingPoolCap(0)
        ).to.be.revertedWith("WaitingPool/invalid-cap"); 
      });

      it("revert:: setCapLimit(): onlyMasterVault can call", async function() {
        await expect(
          waitingPool
            .connect(signer1)
            .setCapLimit(12)
        ).to.be.revertedWith(""); 
      });

      it("revert:: changeFeeReceiver(): onlyOwner can call", async function() {
        await expect(
          masterVault
            .connect(signer1)
            .changeFeeReceiver(signer2.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");  
      });

      it("revert:: changeFeeReceiver(): cannot set zero address", async function() {
        await expect(
          masterVault
            .connect(deployer)
            .changeFeeReceiver(ethers.constants.AddressZero)
        ).to.be.revertedWith("");  
      });

      it("revert:: initialize(): cannot set maxDeposit more than 1e6", async function() {
        m__asterVault = await ethers.getContractFactory("MasterVault");
        let _masterVault = await expect(upgrades.deployProxy(m__asterVault, [wMaticAddress, "CEROS MATIC Vault Token", "ceMATIC", "10000000", maxWithdrawalFee, maxStrategies], {initializer: "initialize"})).to.be.revertedWith("MasterVault/invalid-maxDepositFee");
      });

      it("rrevert:: initialize(): cannot set maxWithdrawal more than 1e6", async function() {
        m__asterVault = await ethers.getContractFactory("MasterVault");
        let _masterVault = await expect(upgrades.deployProxy(m__asterVault, [wMaticAddress, "CEROS MATIC Vault Token", "ceMATIC", maxDepositFee, "10000000", maxStrategies], {initializer: "initialize"})).to.be.revertedWith("MasterVault/invalid-maxWithdrawalFees");
      });

      it("changeFeeReceiver(): should let owner change swapPool", async function() {
        expect(await masterVault.connect(deployer).changeFeeReceiver(signer2.address))
          .to.emit(masterVault, "FeeReceiverChanged")
          .withArgs(signer2.address);
      });

      it("pause()/unpause(): should change pause and unpause flag", async function() {
        expect(await masterVault.paused()).to.be.equal(false);
        await masterVault.pause();
        expect(await masterVault.paused()).to.be.equal(true);
        await masterVault.unpause();
        expect(await masterVault.paused()).to.be.equal(false);
      });

      it("changeAllocationOnDeposit: should change deposit allocation flag", async function() {
        expect(await masterVault.allocateOnDeposit()).to.be.equal(0);
        await masterVault.changeAllocateOnDeposit(1);
        expect(await masterVault.allocateOnDeposit()).to.be.equal(1);
        await masterVault.changeAllocateOnDeposit(0);
        expect(await masterVault.allocateOnDeposit()).to.be.equal(0);

        await expect(masterVault.changeAllocateOnDeposit(3)).to.be.revertedWith("MasterVault/range-0-or-1");
      });
      
    });

    describe("CerosYieldConverterStrategy: setters", async () => {

      it("revert:: changeCeRouter(): onlyOwner can call", async function() {
        await expect(
          cerosStrategy
            .connect(signer1)
            .changeDestination(signer2.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");  
      });

      it("revert:: changeCeRouter(): cannot set zero address", async function() {
        await expect(
          cerosStrategy
            .connect(deployer)
            .changeDestination(ethers.constants.AddressZero)
        ).to.be.revertedWith("");  
      });

      it("changeCeRouter(): should let owner change ceRouter", async function() {
        expect(await cerosStrategy.connect(deployer).changeDestination(signer2.address))
          .to.emit(cerosStrategy, "DestinationChanged")
          .withArgs(signer2.address);
      });

      it("revert:: setStrategist(): onlyOwner can call", async function() {
        await expect(
          cerosStrategy
            .connect(signer1)
            .setStrategist(signer2.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");  
      });

      it("revert:: setStrategist(): cannot set zero address", async function() {
        await expect(
          cerosStrategy
            .connect(deployer)
            .setStrategist(ethers.constants.AddressZero)
        ).to.be.revertedWith("");  
      });

      it("setStrategist(): should let owner change Strategist", async function() {
        expect(await cerosStrategy.connect(deployer).setStrategist(signer2.address))
          .to.emit(cerosStrategy, "UpdatedStrategist")
          .withArgs(signer2.address);
      });

      it("revert:: setStrategist(): onlyOwner can call", async function() {
        await expect(
          cerosStrategy
            .connect(signer1)
            .setStrategist(signer2.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");  
      });

      it("revert:: setFeeRecipient(): cannot set zero address", async function() {
        await expect(
          cerosStrategy
            .connect(deployer)
            .setFeeRecipient(ethers.constants.AddressZero)
        ).to.be.revertedWith("");  
      });

      it("setFeeRecipient(): should let owner change feeRecipient", async function() {
        expect(await cerosStrategy.connect(deployer).setFeeRecipient(signer2.address))
          .to.emit(cerosStrategy, "UpdatedFeeRecipient")
          .withArgs(signer2.address);
      });

      it("revert:: withdraw(): only masterVault can withdraw funds", async function() {
        await expect(
          cerosStrategy
            .connect(deployer)
            .withdraw(signer1.address, "100")
        ).to.be.revertedWith("Strategy/not-masterVault");
      });

      it("revert:: pause(): onlyStrategist can call", async function() {
        await expect(
          cerosStrategy
            .connect(signer1)
            .pause()
        ).to.be.revertedWith("");  
      });

      it("pause(): should let Strategist pause deposits", async function() {
        await cerosStrategy.connect(deployer).pause()
        let depositPaused = await cerosStrategy.paused();
        assert.equal(depositPaused, true);
      });

      it("pause(): cannot deposit when paused", async function() {
        let allocation = 80 * 10000   // 80%
          depositAmount = ethUtils.parseEther("1");
          
        await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
        await cerosStrategy.connect(deployer).pause()
        await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
        await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
        await expect(
          masterVault
            .depositToStrategy(cerosStrategy.address, depositAmount.div(2))
        ).to.be.revertedWith("Pausable: paused");        
      });

      it("unpause(): should let Strategist unpause deposits", async function() {
        await cerosStrategy.connect(deployer).pause()
        await cerosStrategy.connect(deployer).unpause()
        let depositPaused = await cerosStrategy.paused();
        assert.equal(depositPaused, false);
      });

      it("harvest(): should let strategiest harvest(claim yeild)", async function() {

        let depositAmount = ethUtils.parseEther("1"),
            allocation = 80 * 10000   // 80%
            availableToWithdrawBefore = await masterVault.availableToWithdraw();
        await masterVault.addStrategy(cerosStrategy.address, allocation, 0);
        await wMatic.connect(signer1).approve(masterVault.address, depositAmount);
        await masterVault.connect(signer1).deposit(depositAmount, signer1.address);
        await cerosStrategy.connect(deployer).harvest(); 
        await aMaticc.mint(cerosRouter.address, parseEther("10"))
        await depositAndAllocate(masterVault, signer1, depositAmount);
        availableToWithdrawAfter = await masterVault.availableToWithdraw();
        strategyDebt = await masterVault.strategyParams(cerosStrategy.address);
        assert.equal(Number(depositAmount) + Number(depositAmount), Number(availableToWithdrawAfter) + Number(strategyDebt.debt));

        await cerosToken.setRatio(ethUtils.parseEther("0.5"));

        certTokenBalanceBefore = await cerosToken.balanceOf(deployer.address);
        await cerosStrategy.connect(deployer).harvest();
        certTokenBalanceAfter = await cerosToken.balanceOf(deployer.address);
        assert(certTokenBalanceBefore < certTokenBalanceAfter)
      });
    });
  });
});
