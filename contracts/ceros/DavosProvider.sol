// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.6;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IDex.sol";
import "./interfaces/IDao.sol";
import "./interfaces/ICerosRouter.sol";
import "./interfaces/IDavosProvider.sol";
import "./interfaces/ICertToken.sol";
import "../MasterVault/interfaces/IMasterVault.sol";

contract DavosProvider is
IDavosProvider,
OwnableUpgradeable,
PausableUpgradeable,
ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    /**
     * Variables
     */
    // Tokens
    // address private _certToken;
    address public _ceToken;
    ICertToken public _collateralToken; // (default dMATIC)
    IMasterVault public _masterVault;
    IDao public _dao;
    address public _proxy;
    IERC20 public _maticToken;
    /**
     * Modifiers
     */
    modifier onlyProxy() {
        require(
            msg.sender == owner() || msg.sender == _proxy,
            "AuctionProxy: not allowed"
        );
        _;
    }
    function initialize(
        address collateralToken,
        // address certToken,
        address masterVault,
        address daoAddress,
        address maticToken
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        _collateralToken = ICertToken(collateralToken);
        // _certToken = certToken;
        _ceToken = masterVault;
        _masterVault = IMasterVault(masterVault);
        _dao = IDao(daoAddress);
        _maticToken = IERC20(maticToken);
        // _pool = IMaticPool(pool);
        IERC20(masterVault).approve(masterVault, type(uint256).max);
        IERC20(_ceToken).approve(daoAddress, type(uint256).max);
        IERC20(_maticToken).approve(masterVault, type(uint256).max);
    }
    /**
     * DEPOSIT in Matic Token
     */
    function provide(uint256 amount)
    external
    override
    whenNotPaused
    nonReentrant
    returns (uint256 value)
    {
        _maticToken.safeTransferFrom(msg.sender, address(this), amount);
        value = _masterVault.depositMatic(amount);
        // deposit ceToken as collateral
        value = _provideCollateral(msg.sender, value);
        emit Deposit(msg.sender, value);
        return value;
    }
    /**
     * RELEASE in Matic Token
     */
    function release(address recipient, uint256 amount)
    external
    override
    whenNotPaused
    nonReentrant
    returns (uint256 realAmount)
    {
        require(recipient != address(0));
        realAmount = _withdrawCollateral(msg.sender, amount);
        realAmount = _masterVault.withdrawMatic(recipient, realAmount);
        emit Withdrawal(msg.sender, recipient, realAmount);
        return realAmount;
    }
    /**
     * DAO FUNCTIONALITY
     */
    function liquidation(address recipient, uint256 amount)
    external
    override
    onlyProxy
    nonReentrant
    {
        require(recipient != address(0));
        _masterVault.withdrawMatic(recipient, amount);
    }
    function daoBurn(address account, uint256 value)
    external
    override
    onlyProxy
    nonReentrant
    {
        require(account != address(0));
        _collateralToken.burn(account, value);
    }
    function daoMint(address account, uint256 value)
    external
    override
    onlyProxy
    nonReentrant
    {
        require(account != address(0));
        _collateralToken.mint(account, value);
    }
    function _provideCollateral(address account, uint256 amount) internal returns (uint256 deposited) {
        deposited = _dao.deposit(account, address(_ceToken), amount);
        _collateralToken.mint(account, deposited);
    }
    function _withdrawCollateral(address account, uint256 amount) internal returns (uint256 withdrawn) {
        withdrawn = _dao.withdraw(account, address(_ceToken), amount);
        _collateralToken.burn(account, withdrawn);
    }
    /**
     * PAUSABLE FUNCTIONALITY
     */
    function pause() external onlyOwner {
        _pause();
    }
    function unPause() external onlyOwner {
        _unpause();
    }
    /**
     * UPDATING FUNCTIONALITY
     */
    function changeDao(address dao) external onlyOwner {
        require(dao != address(0));
        IERC20(_ceToken).approve(address(_dao), 0);
        _dao = IDao(dao);
        IERC20(_ceToken).approve(address(_dao), type(uint256).max);
        emit ChangeDao(dao);
    }
    function changeCeToken(address ceToken) external onlyOwner {
        require(ceToken != address(0));
        IERC20(_ceToken).approve(address(_dao), 0);
        _ceToken = ceToken;
        IERC20(_ceToken).approve(address(_dao), type(uint256).max);
        emit ChangeCeToken(ceToken);
    }
    function changeProxy(address auctionProxy) external onlyOwner {
        require(auctionProxy != address(0));
        _proxy = auctionProxy;
        emit ChangeProxy(auctionProxy);
    }
    function changeCollateralToken(address collateralToken) external onlyOwner {
        require(collateralToken != address(0));
        _collateralToken = ICertToken(collateralToken);
        emit ChangeCollateralToken(collateralToken);
    }
}