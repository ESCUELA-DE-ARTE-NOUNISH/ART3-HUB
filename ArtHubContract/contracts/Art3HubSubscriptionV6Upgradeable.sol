// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Art3HubSubscriptionV6Upgradeable
 * @dev Upgradeable subscription management contract with owner/relayer separation
 */
contract Art3HubSubscriptionV6Upgradeable is 
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    EIP712Upgradeable
{
    // Subscription plans
    enum SubscriptionPlan { FREE, MASTER, ELITE }
    
    // Plan configuration
    struct PlanConfig {
        uint256 priceUSDC;      // Price in USDC (6 decimals)
        uint256 monthlyLimit;   // Monthly NFT creation limit
        bool isActive;          // Plan availability
    }
    
    // User subscription data
    struct UserSubscription {
        SubscriptionPlan plan;
        uint256 expiresAt;
        uint256 monthlyUsage;
        uint256 lastResetMonth;
        bool autoRenew;
    }
    
    // State variables
    IERC20 public usdcToken;
    address public treasuryWallet;
    address public gaslessRelayer;
    address public factoryContract;
    
    mapping(SubscriptionPlan => PlanConfig) public planConfigs;
    mapping(address => UserSubscription) public userSubscriptions;
    
    // Events
    event SubscriptionUpgraded(address indexed user, SubscriptionPlan indexed plan);
    event SubscriptionDowngraded(address indexed user, SubscriptionPlan indexed plan);
    event NFTMintRecorded(address indexed user, uint256 currentUsage, uint256 limit);
    event GaslessRelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event TreasuryWalletUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PlanConfigUpdated(SubscriptionPlan indexed plan, uint256 price, uint256 limit);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract with owner and gasless relayer separation
     * @param _owner Admin wallet address (from NEW_CONTRACT_OWNER env var)
     * @param _gaslessRelayer Gasless relayer address (operational access)
     * @param _usdcToken USDC token contract address
     * @param _treasuryWallet Treasury wallet for receiving payments
     * @param _factoryContract Factory contract address
     */
    function initialize(
        address _owner,
        address _gaslessRelayer,
        address _usdcToken,
        address _treasuryWallet,
        address _factoryContract
    ) public initializer {
        require(_owner != address(0), "Owner cannot be zero address");
        require(_gaslessRelayer != address(0), "Gasless relayer cannot be zero address");
        require(_usdcToken != address(0), "USDC token cannot be zero address");
        require(_treasuryWallet != address(0), "Treasury wallet cannot be zero address");
        require(_factoryContract != address(0), "Factory contract cannot be zero address");
        
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __EIP712_init("Art3HubSubscriptionV6", "1");
        
        gaslessRelayer = _gaslessRelayer;
        usdcToken = IERC20(_usdcToken);
        treasuryWallet = _treasuryWallet;
        factoryContract = _factoryContract;
        
        // Initialize plan configurations
        _initializePlanConfigs();
    }

    /**
     * @dev Initialize default plan configurations
     */
    function _initializePlanConfigs() private {
        // Free plan: 1 NFT/month, $0
        planConfigs[SubscriptionPlan.FREE] = PlanConfig({
            priceUSDC: 0,
            monthlyLimit: 1,
            isActive: true
        });
        
        // Master plan: 10 NFTs/month, $4.99
        planConfigs[SubscriptionPlan.MASTER] = PlanConfig({
            priceUSDC: 4990000, // $4.99 with 6 decimals
            monthlyLimit: 10,
            isActive: true
        });
        
        // Elite plan: 25 NFTs/month, $9.99
        planConfigs[SubscriptionPlan.ELITE] = PlanConfig({
            priceUSDC: 9990000, // $9.99 with 6 decimals
            monthlyLimit: 25,
            isActive: true
        });
    }

    /**
     * @dev Modifier to allow only gasless relayer for operational functions
     */
    modifier onlyGaslessRelayer() {
        require(msg.sender == gaslessRelayer, "Only gasless relayer can call this function");
        _;
    }

    /**
     * @dev Modifier to allow gasless relayer OR owner OR factory for hybrid functions
     */
    modifier onlyGaslessRelayerOrOwnerOrFactory() {
        require(
            msg.sender == gaslessRelayer || 
            msg.sender == owner() || 
            msg.sender == factoryContract,
            "Only gasless relayer, owner, or factory can call this function"
        );
        _;
    }

    /**
     * @dev Auto-enroll user in free plan - Gasless relayer, owner, or factory can call
     * @param user User address to enroll
     */
    function autoEnrollFreePlan(address user) external onlyGaslessRelayerOrOwnerOrFactory {
        require(user != address(0), "User cannot be zero address");
        
        UserSubscription storage subscription = userSubscriptions[user];
        
        // Only enroll if user doesn't have an active subscription
        if (subscription.expiresAt <= block.timestamp) {
            subscription.plan = SubscriptionPlan.FREE;
            subscription.expiresAt = block.timestamp + 30 days;
            subscription.monthlyUsage = 0;
            subscription.lastResetMonth = _getCurrentMonth();
            subscription.autoRenew = false;
            
            emit SubscriptionUpgraded(user, SubscriptionPlan.FREE);
        }
    }

    /**
     * @dev Subscribe to Master plan gaslessly - Only gasless relayer can call
     * @param user User address
     * @param autoRenew Auto-renewal preference
     */
    function subscribeToMasterPlanGasless(
        address user,
        bool autoRenew
    ) external onlyGaslessRelayer nonReentrant {
        _upgradePlan(user, SubscriptionPlan.MASTER, autoRenew);
    }

    /**
     * @dev Subscribe to Elite plan gaslessly - Only gasless relayer can call
     * @param user User address
     * @param autoRenew Auto-renewal preference
     */
    function subscribeToElitePlanGasless(
        address user,
        bool autoRenew
    ) external onlyGaslessRelayer nonReentrant {
        _upgradePlan(user, SubscriptionPlan.ELITE, autoRenew);
    }

    /**
     * @dev Internal function to upgrade user plan
     * @param user User address
     * @param plan New subscription plan
     * @param autoRenew Auto-renewal preference
     */
    function _upgradePlan(address user, SubscriptionPlan plan, bool autoRenew) private {
        require(user != address(0), "User cannot be zero address");
        require(planConfigs[plan].isActive, "Plan is not active");
        
        PlanConfig memory config = planConfigs[plan];
        
        // Transfer USDC payment to treasury (if not free plan)
        if (config.priceUSDC > 0) {
            require(
                usdcToken.transferFrom(user, treasuryWallet, config.priceUSDC),
                "USDC transfer failed"
            );
        }
        
        UserSubscription storage subscription = userSubscriptions[user];
        
        // Update subscription
        subscription.plan = plan;
        subscription.expiresAt = block.timestamp + 30 days;
        subscription.autoRenew = autoRenew;
        
        // Reset monthly usage if new month
        uint256 currentMonth = _getCurrentMonth();
        if (subscription.lastResetMonth != currentMonth) {
            subscription.monthlyUsage = 0;
            subscription.lastResetMonth = currentMonth;
        }
        
        emit SubscriptionUpgraded(user, plan);
    }

    /**
     * @dev Record NFT mint - Gasless relayer, owner, or factory can call
     * @param user User who minted the NFT
     */
    function recordNFTMint(address user) external onlyGaslessRelayerOrOwnerOrFactory {
        UserSubscription storage subscription = userSubscriptions[user];
        
        // Reset monthly usage if new month
        uint256 currentMonth = _getCurrentMonth();
        if (subscription.lastResetMonth != currentMonth) {
            subscription.monthlyUsage = 0;
            subscription.lastResetMonth = currentMonth;
        }
        
        subscription.monthlyUsage++;
        
        PlanConfig memory config = planConfigs[subscription.plan];
        emit NFTMintRecorded(user, subscription.monthlyUsage, config.monthlyLimit);
    }

    /**
     * @dev Check if user can mint NFT
     * @param user User address
     * @return canMint Whether user can mint
     * @return currentUsage Current monthly usage
     * @return limit Monthly limit
     */
    function canUserMint(address user) external view returns (bool canMint, uint256 currentUsage, uint256 limit) {
        UserSubscription memory subscription = userSubscriptions[user];
        
        // Check if subscription is expired
        if (subscription.expiresAt <= block.timestamp) {
            return (false, 0, 0);
        }
        
        // Reset usage if new month
        uint256 currentMonth = _getCurrentMonth();
        currentUsage = subscription.lastResetMonth == currentMonth ? subscription.monthlyUsage : 0;
        
        PlanConfig memory config = planConfigs[subscription.plan];
        limit = config.monthlyLimit;
        canMint = currentUsage < limit;
    }

    // Admin functions - Only owner can call
    
    /**
     * @dev Update plan configuration - Only owner
     * @param plan Subscription plan to update
     * @param priceUSDC New price in USDC (6 decimals)
     * @param monthlyLimit New monthly NFT limit
     * @param isActive Plan availability
     */
    function updatePlanConfig(
        SubscriptionPlan plan,
        uint256 priceUSDC,
        uint256 monthlyLimit,
        bool isActive
    ) external onlyOwner {
        planConfigs[plan] = PlanConfig({
            priceUSDC: priceUSDC,
            monthlyLimit: monthlyLimit,
            isActive: isActive
        });
        
        emit PlanConfigUpdated(plan, priceUSDC, monthlyLimit);
    }

    /**
     * @dev Update gasless relayer address - Only owner
     * @param newGaslessRelayer New gasless relayer address
     */
    function updateGaslessRelayer(address newGaslessRelayer) external onlyOwner {
        require(newGaslessRelayer != address(0), "New gasless relayer cannot be zero address");
        address oldRelayer = gaslessRelayer;
        gaslessRelayer = newGaslessRelayer;
        emit GaslessRelayerUpdated(oldRelayer, newGaslessRelayer);
    }

    /**
     * @dev Update treasury wallet - Only owner
     * @param newTreasuryWallet New treasury wallet address
     */
    function updateTreasuryWallet(address newTreasuryWallet) external onlyOwner {
        require(newTreasuryWallet != address(0), "New treasury wallet cannot be zero address");
        address oldTreasury = treasuryWallet;
        treasuryWallet = newTreasuryWallet;
        emit TreasuryWalletUpdated(oldTreasury, newTreasuryWallet);
    }

    /**
     * @dev Update factory contract address - Only owner
     * @param newFactoryContract New factory contract address
     */
    function updateFactoryContract(address newFactoryContract) external onlyOwner {
        require(newFactoryContract != address(0), "New factory contract cannot be zero address");
        factoryContract = newFactoryContract;
    }

    // View functions
    
    /**
     * @dev Get user subscription details
     * @param user User address
     * @return subscription User subscription data
     */
    function getUserSubscription(address user) external view returns (UserSubscription memory) {
        return userSubscriptions[user];
    }

    /**
     * @dev Get plan configuration
     * @param plan Subscription plan
     * @return config Plan configuration data
     */
    function getPlanConfig(SubscriptionPlan plan) external view returns (PlanConfig memory) {
        return planConfigs[plan];
    }

    /**
     * @dev Get contract version
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return "V6-Upgradeable";
    }

    /**
     * @dev Get current month timestamp
     * @return Current month as timestamp
     */
    function _getCurrentMonth() private view returns (uint256) {
        return block.timestamp / 30 days;
    }

    // UUPS upgrade authorization - Only owner can authorize upgrades
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Storage gap for future upgrades
    uint256[44] private __gap;
}