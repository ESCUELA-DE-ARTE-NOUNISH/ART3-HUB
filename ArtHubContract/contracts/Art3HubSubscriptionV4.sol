// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title Art3Hub Subscription Manager V4
 * @dev Manages user subscriptions with gasless transactions, auto-enrollment, and Elite Creator plan
 */
contract Art3HubSubscriptionV4 is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    // Subscription Plans
    enum PlanType { FREE, MASTER, ELITE }
    
    struct Subscription {
        PlanType plan;
        uint256 expiresAt;
        uint256 nftsMinted;
        uint256 nftLimit;
        bool isActive;
        bool autoRenew;
    }

    struct MintVoucher {
        address user;
        uint256 amount;
        uint256 nonce;
        uint256 deadline;
        bytes signature;
    }

    // Plan configurations
    mapping(PlanType => uint256) public planPrices; // Monthly price in USDC (6 decimals)
    mapping(PlanType => uint256) public planLimits; // NFTs per month
    mapping(PlanType => bool) public planGasless;   // Whether plan includes gasless minting

    // User subscriptions
    mapping(address => Subscription) public subscriptions;
    mapping(address => uint256) public userNonces;

    // Payment configuration
    IERC20 public usdcToken;
    address public treasuryWallet;
    address public gaslessRelayer;
    address public factoryContract;

    // Events
    event SubscriptionCreated(address indexed user, PlanType plan, uint256 expiresAt);
    event SubscriptionRenewed(address indexed user, PlanType plan, uint256 expiresAt);
    event SubscriptionUpgraded(address indexed user, PlanType oldPlan, PlanType newPlan);
    event SubscriptionDowngraded(address indexed user, PlanType oldPlan, PlanType newPlan);
    event NFTMinted(address indexed user, uint256 amount, uint256 remaining);
    event PaymentReceived(address indexed user, PlanType plan, uint256 amount);
    event GaslessRelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event FactoryContractUpdated(address indexed oldFactory, address indexed newFactory);

    // Custom errors
    error NoActiveSubscription();
    error InsufficientQuota();
    error SubscriptionExpired();
    error InvalidPayment();
    error InvalidVoucher();
    error UnauthorizedRelayer();

    constructor(
        address _usdcToken,
        address _treasuryWallet,
        address _gaslessRelayer,
        address _factoryContract,
        address _initialOwner
    ) EIP712("Art3HubSubscriptionV4", "1") Ownable(_initialOwner) {
        usdcToken = IERC20(_usdcToken);
        treasuryWallet = _treasuryWallet;
        gaslessRelayer = _gaslessRelayer;
        factoryContract = _factoryContract;

        // Configure plan defaults
        planPrices[PlanType.FREE] = 0;
        planPrices[PlanType.MASTER] = 4_990_000; // $4.99 in USDC (6 decimals)
        planPrices[PlanType.ELITE] = 9_990_000;  // $9.99 in USDC (6 decimals)
        
        planLimits[PlanType.FREE] = 1;    // 1 NFT per month
        planLimits[PlanType.MASTER] = 10; // 10 NFTs per month
        planLimits[PlanType.ELITE] = 25;  // 25 NFTs per month
        
        planGasless[PlanType.FREE] = true;   // Free plan gets gasless minting
        planGasless[PlanType.MASTER] = true; // Master plan gets gasless minting
        planGasless[PlanType.ELITE] = true;  // Elite plan gets gasless minting
    }

    // ==================== SUBSCRIPTION MANAGEMENT ====================

    /**
     * @dev Auto-enroll new users in Free plan (called on first interaction)
     */
    function autoEnrollFreePlan(address user) external {
        require(msg.sender == gaslessRelayer || msg.sender == factoryContract || msg.sender == owner(), "Unauthorized");
        _autoEnrollFreePlan(user);
    }

    /**
     * @dev Internal function to auto-enroll users in Free plan
     */
    function _autoEnrollFreePlan(address user) internal {
        if (!subscriptions[user].isActive) {
            subscriptions[user] = Subscription({
                plan: PlanType.FREE,
                expiresAt: block.timestamp + 30 days, // 1 month
                nftsMinted: 0,
                nftLimit: planLimits[PlanType.FREE],
                isActive: true,
                autoRenew: false
            });
            
            emit SubscriptionCreated(user, PlanType.FREE, subscriptions[user].expiresAt);
        }
    }

    /**
     * @dev Subscribe to Free plan (public function)
     */
    function subscribeToFreePlan() external {
        address user = msg.sender;
        
        subscriptions[user] = Subscription({
            plan: PlanType.FREE,
            expiresAt: block.timestamp + 30 days, // 1 month
            nftsMinted: 0,
            nftLimit: planLimits[PlanType.FREE],
            isActive: true,
            autoRenew: false
        });
        
        emit SubscriptionCreated(user, PlanType.FREE, subscriptions[user].expiresAt);
    }

    /**
     * @dev Subscribe to Master plan with USDC payment
     */
    function subscribeToMasterPlan(bool autoRenew) external nonReentrant {
        address user = msg.sender;
        uint256 price = planPrices[PlanType.MASTER];
        
        // Transfer USDC payment
        require(usdcToken.transferFrom(user, treasuryWallet, price), "Payment failed");
        
        // Store old plan for event
        PlanType oldPlan = subscriptions[user].plan;
        bool wasActive = subscriptions[user].isActive;
        
        // Update or create subscription
        subscriptions[user] = Subscription({
            plan: PlanType.MASTER,
            expiresAt: block.timestamp + 30 days, // 1 month
            nftsMinted: 0,
            nftLimit: planLimits[PlanType.MASTER],
            isActive: true,
            autoRenew: autoRenew
        });
        
        if (wasActive && oldPlan != PlanType.MASTER) {
            emit SubscriptionUpgraded(user, oldPlan, PlanType.MASTER);
        } else {
            emit SubscriptionCreated(user, PlanType.MASTER, subscriptions[user].expiresAt);
        }
        emit PaymentReceived(user, PlanType.MASTER, price);
    }

    /**
     * @dev Subscribe to Elite plan with USDC payment
     */
    function subscribeToElitePlan(bool autoRenew) external nonReentrant {
        address user = msg.sender;
        uint256 price = planPrices[PlanType.ELITE];
        
        // Transfer USDC payment
        require(usdcToken.transferFrom(user, treasuryWallet, price), "Payment failed");
        
        // Store old plan for event
        PlanType oldPlan = subscriptions[user].plan;
        bool wasActive = subscriptions[user].isActive;
        
        // Update or create subscription
        subscriptions[user] = Subscription({
            plan: PlanType.ELITE,
            expiresAt: block.timestamp + 30 days, // 1 month
            nftsMinted: 0,
            nftLimit: planLimits[PlanType.ELITE],
            isActive: true,
            autoRenew: autoRenew
        });
        
        if (wasActive && oldPlan != PlanType.ELITE) {
            emit SubscriptionUpgraded(user, oldPlan, PlanType.ELITE);
        } else {
            emit SubscriptionCreated(user, PlanType.ELITE, subscriptions[user].expiresAt);
        }
        emit PaymentReceived(user, PlanType.ELITE, price);
    }

    /**
     * @dev Gasless subscription to Master plan - relayer pays gas, user pays USDC
     */
    function subscribeToMasterPlanGasless(address user, bool autoRenew) external nonReentrant {
        require(msg.sender == gaslessRelayer, "Only gasless relayer");
        
        uint256 price = planPrices[PlanType.MASTER];
        
        // Transfer USDC payment from user to treasury
        require(usdcToken.transferFrom(user, treasuryWallet, price), "Payment failed");
        
        // Store old plan for event
        PlanType oldPlan = subscriptions[user].plan;
        bool wasActive = subscriptions[user].isActive;
        
        // Update or create subscription
        subscriptions[user] = Subscription({
            plan: PlanType.MASTER,
            expiresAt: block.timestamp + 30 days, // 1 month
            nftsMinted: 0,
            nftLimit: planLimits[PlanType.MASTER],
            isActive: true,
            autoRenew: autoRenew
        });
        
        if (wasActive && oldPlan != PlanType.MASTER) {
            emit SubscriptionUpgraded(user, oldPlan, PlanType.MASTER);
        } else {
            emit SubscriptionCreated(user, PlanType.MASTER, subscriptions[user].expiresAt);
        }
        emit PaymentReceived(user, PlanType.MASTER, price);
    }

    /**
     * @dev Gasless subscription to Elite plan - relayer pays gas, user pays USDC
     */
    function subscribeToElitePlanGasless(address user, bool autoRenew) external nonReentrant {
        require(msg.sender == gaslessRelayer, "Only gasless relayer");
        
        uint256 price = planPrices[PlanType.ELITE];
        
        // Transfer USDC payment from user to treasury
        require(usdcToken.transferFrom(user, treasuryWallet, price), "Payment failed");
        
        // Store old plan for event
        PlanType oldPlan = subscriptions[user].plan;
        bool wasActive = subscriptions[user].isActive;
        
        // Update or create subscription
        subscriptions[user] = Subscription({
            plan: PlanType.ELITE,
            expiresAt: block.timestamp + 30 days, // 1 month
            nftsMinted: 0,
            nftLimit: planLimits[PlanType.ELITE],
            isActive: true,
            autoRenew: autoRenew
        });
        
        if (wasActive && oldPlan != PlanType.ELITE) {
            emit SubscriptionUpgraded(user, oldPlan, PlanType.ELITE);
        } else {
            emit SubscriptionCreated(user, PlanType.ELITE, subscriptions[user].expiresAt);
        }
        emit PaymentReceived(user, PlanType.ELITE, price);
    }

    /**
     * @dev Renew subscription (auto-renewal or manual)
     */
    function renewSubscription(address user) external nonReentrant {
        Subscription storage sub = subscriptions[user];
        require(sub.isActive, "No active subscription");
        
        if (sub.plan == PlanType.MASTER) {
            uint256 price = planPrices[PlanType.MASTER];
            require(usdcToken.transferFrom(user, treasuryWallet, price), "Payment failed");
            
            sub.expiresAt = block.timestamp + 30 days;
            sub.nftsMinted = 0; // Reset monthly quota
            
            emit SubscriptionRenewed(user, PlanType.MASTER, sub.expiresAt);
            emit PaymentReceived(user, PlanType.MASTER, price);
        } else if (sub.plan == PlanType.ELITE) {
            uint256 price = planPrices[PlanType.ELITE];
            require(usdcToken.transferFrom(user, treasuryWallet, price), "Payment failed");
            
            sub.expiresAt = block.timestamp + 30 days;
            sub.nftsMinted = 0; // Reset monthly quota
            
            emit SubscriptionRenewed(user, PlanType.ELITE, sub.expiresAt);
            emit PaymentReceived(user, PlanType.ELITE, price);
        } else if (sub.plan == PlanType.FREE) {
            // Free plan auto-renews without payment
            sub.expiresAt = block.timestamp + 30 days;
            sub.nftsMinted = 0; // Reset monthly quota
            
            emit SubscriptionRenewed(user, PlanType.FREE, sub.expiresAt);
        }
    }

    /**
     * @dev Downgrade subscription (Elite to Master, Master to Free)
     */
    function downgradeSubscription(PlanType newPlan) external {
        address user = msg.sender;
        Subscription storage sub = subscriptions[user];
        require(sub.isActive, "No active subscription");
        
        PlanType oldPlan = sub.plan;
        require(newPlan < oldPlan, "Can only downgrade to lower plan");
        
        // Update subscription
        sub.plan = newPlan;
        sub.nftLimit = planLimits[newPlan];
        // Keep existing expiry date and reset NFT count if needed
        if (sub.nftsMinted > planLimits[newPlan]) {
            sub.nftsMinted = planLimits[newPlan]; // Cap to new limit
        }
        
        emit SubscriptionDowngraded(user, oldPlan, newPlan);
    }

    // ==================== NFT MINTING QUOTA ====================

    /**
     * @dev Record NFT mint (called by factory/collection contracts)
     */
    function recordNFTMint(address user, uint256 amount) external {
        require(msg.sender == gaslessRelayer || msg.sender == factoryContract || msg.sender == owner(), "Unauthorized");
        
        Subscription storage sub = subscriptions[user];
        
        // Auto-enroll if no subscription
        if (!sub.isActive) {
            _autoEnrollFreePlan(user);
            sub = subscriptions[user];
        }
        
        require(sub.isActive, "No active subscription");
        require(block.timestamp <= sub.expiresAt, "Subscription expired");
        require(sub.nftsMinted + amount <= sub.nftLimit, "Insufficient quota");
        
        sub.nftsMinted += amount;
        
        emit NFTMinted(user, amount, sub.nftLimit - sub.nftsMinted);
    }

    /**
     * @dev Internal function to record NFT mint
     */
    function _recordNFTMint(address user, uint256 amount) internal {
        Subscription storage sub = subscriptions[user];
        
        // Auto-enroll if no subscription
        if (!sub.isActive) {
            _autoEnrollFreePlan(user);
            sub = subscriptions[user];
        }
        
        require(sub.isActive, "No active subscription");
        require(block.timestamp <= sub.expiresAt, "Subscription expired");
        require(sub.nftsMinted + amount <= sub.nftLimit, "Insufficient quota");
        
        sub.nftsMinted += amount;
        
        emit NFTMinted(user, amount, sub.nftLimit - sub.nftsMinted);
    }

    /**
     * @dev Record NFT mint with gasless voucher
     */
    function recordNFTMintGasless(MintVoucher calldata voucher) external {
        require(msg.sender == gaslessRelayer, "Unauthorized relayer");
        require(block.timestamp <= voucher.deadline, "Voucher expired");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            keccak256("MintVoucher(address user,uint256 amount,uint256 nonce,uint256 deadline)"),
            voucher.user,
            voucher.amount,
            voucher.nonce,
            voucher.deadline
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(voucher.signature);
        require(signer == voucher.user, "Invalid signature");
        require(userNonces[voucher.user] == voucher.nonce, "Invalid nonce");
        
        userNonces[voucher.user]++;
        
        // Record the mint
        _recordNFTMint(voucher.user, voucher.amount);
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @dev Get user subscription details
     */
    function getSubscription(address user) external view returns (
        PlanType plan,
        uint256 expiresAt,
        uint256 nftsMinted,
        uint256 nftLimit,
        bool isActive,
        bool hasGaslessMinting
    ) {
        Subscription memory sub = subscriptions[user];
        
        // If no subscription, return Free plan defaults
        if (!sub.isActive) {
            return (
                PlanType.FREE,
                0,
                0,
                planLimits[PlanType.FREE],
                false,
                planGasless[PlanType.FREE]
            );
        }
        
        // Check if expired
        bool active = sub.isActive && block.timestamp <= sub.expiresAt;
        
        return (
            sub.plan,
            sub.expiresAt,
            sub.nftsMinted,
            sub.nftLimit,
            active,
            planGasless[sub.plan]
        );
    }

    /**
     * @dev Check if user can mint NFTs
     */
    function canUserMint(address user, uint256 amount) external view returns (bool) {
        Subscription memory sub = subscriptions[user];
        
        // Auto-enrollment case
        if (!sub.isActive) {
            return amount <= planLimits[PlanType.FREE];
        }
        
        if (!sub.isActive || block.timestamp > sub.expiresAt) {
            return false;
        }
        
        return sub.nftsMinted + amount <= sub.nftLimit;
    }

    /**
     * @dev Check if user has an active subscription
     */
    function isUserActive(address user) external view returns (bool) {
        return subscriptions[user].isActive;
    }

    /**
     * @dev Get user's nonce for gasless transactions
     */
    function getUserNonce(address user) external view returns (uint256) {
        return userNonces[user];
    }

    /**
     * @dev Get plan name as string
     */
    function getPlanName(PlanType plan) external pure returns (string memory) {
        if (plan == PlanType.FREE) return "Free";
        if (plan == PlanType.MASTER) return "Master";
        if (plan == PlanType.ELITE) return "Elite Creator";
        return "Unknown";
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Update plan configuration
     */
    function updatePlanConfig(
        PlanType plan,
        uint256 price,
        uint256 limit,
        bool gasless
    ) external onlyOwner {
        planPrices[plan] = price;
        planLimits[plan] = limit;
        planGasless[plan] = gasless;
    }

    /**
     * @dev Update gasless relayer address
     */
    function updateGaslessRelayer(address newRelayer) external onlyOwner {
        address oldRelayer = gaslessRelayer;
        gaslessRelayer = newRelayer;
        emit GaslessRelayerUpdated(oldRelayer, newRelayer);
    }

    /**
     * @dev Update factory contract address
     */
    function updateFactoryContract(address newFactory) external onlyOwner {
        address oldFactory = factoryContract;
        factoryContract = newFactory;
        emit FactoryContractUpdated(oldFactory, newFactory);
    }

    /**
     * @dev Update treasury wallet
     */
    function updateTreasuryWallet(address newTreasury) external onlyOwner {
        treasuryWallet = newTreasury;
    }

    /**
     * @dev Emergency: Pause/unpause subscriptions
     */
    function setSubscriptionStatus(address user, bool isActive) external onlyOwner {
        subscriptions[user].isActive = isActive;
    }

    /**
     * @dev Get plan configuration
     */
    function getPlanConfig(PlanType plan) external view returns (
        uint256 price,
        uint256 limit,
        bool gasless
    ) {
        return (planPrices[plan], planLimits[plan], planGasless[plan]);
    }
}