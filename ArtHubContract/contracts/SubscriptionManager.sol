// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SubscriptionManager
 * @dev Manages artist subscriptions for Art3Hub platform
 * @author Art3Hub Team
 */
contract SubscriptionManager is Ownable, ReentrancyGuard {
    // Subscription plans
    enum PlanType { FREE, MASTER }
    
    // Subscription structure
    struct Subscription {
        PlanType plan;
        uint256 expiresAt;
        uint256 nftsMinted;
        bool isActive;
    }
    
    // Plan configuration
    struct PlanConfig {
        uint256 price;
        uint256 duration;
        uint256 nftLimit;
        bool gasless;
        string name;
    }
    
    // State variables
    mapping(address => Subscription) public subscriptions;
    mapping(PlanType => PlanConfig) public planConfigs;
    
    // Payment tokens (USDC, USDT, etc.)
    mapping(address => bool) public acceptedTokens;
    
    // Platform settings
    address public treasury;
    uint256 public totalSubscribers;
    
    // Events
    event SubscriptionCreated(address indexed user, PlanType plan, uint256 expiresAt);
    event SubscriptionRenewed(address indexed user, PlanType plan, uint256 newExpiresAt);
    event SubscriptionUpgraded(address indexed user, PlanType oldPlan, PlanType newPlan);
    event NFTMinted(address indexed user, uint256 nftCount);
    event PlanConfigUpdated(PlanType plan, uint256 price, uint256 duration, uint256 nftLimit);
    event PaymentTokenUpdated(address token, bool accepted);
    
    constructor(address _treasury) Ownable(msg.sender) {
        treasury = _treasury;
        
        // Initialize plan configurations
        planConfigs[PlanType.FREE] = PlanConfig({
            price: 0,
            duration: 365 days, // 1 year free access
            nftLimit: 1,
            gasless: true,
            name: "Plan Gratuito"
        });
        
        planConfigs[PlanType.MASTER] = PlanConfig({
            price: 4.99e6, // $4.99 in USDC (6 decimals)
            duration: 30 days,
            nftLimit: 10,
            gasless: true,
            name: "Plan Master"
        });
    }
    
    /**
     * @dev Subscribe to free plan (one-time activation)
     */
    function subscribeToFreePlan() external {
        require(!subscriptions[msg.sender].isActive, "Already has active subscription");
        
        Subscription storage sub = subscriptions[msg.sender];
        sub.plan = PlanType.FREE;
        sub.expiresAt = block.timestamp + planConfigs[PlanType.FREE].duration;
        sub.nftsMinted = 0;
        sub.isActive = true;
        
        totalSubscribers++;
        
        emit SubscriptionCreated(msg.sender, PlanType.FREE, sub.expiresAt);
    }
    
    /**
     * @dev Subscribe to master plan with payment
     * @param paymentToken Token address for payment (USDC, USDT, etc.)
     */
    function subscribeToMasterPlan(address paymentToken) external nonReentrant {
        require(acceptedTokens[paymentToken], "Payment token not accepted");
        
        PlanConfig memory masterPlan = planConfigs[PlanType.MASTER];
        IERC20 token = IERC20(paymentToken);
        
        // Transfer payment
        require(
            token.transferFrom(msg.sender, treasury, masterPlan.price),
            "Payment failed"
        );
        
        Subscription storage sub = subscriptions[msg.sender];
        bool wasActive = sub.isActive;
        PlanType oldPlan = sub.plan;
        
        // Set new subscription
        sub.plan = PlanType.MASTER;
        sub.expiresAt = block.timestamp + masterPlan.duration;
        sub.nftsMinted = 0; // Reset monthly counter
        sub.isActive = true;
        
        if (!wasActive) {
            totalSubscribers++;
            emit SubscriptionCreated(msg.sender, PlanType.MASTER, sub.expiresAt);
        } else if (oldPlan != PlanType.MASTER) {
            emit SubscriptionUpgraded(msg.sender, oldPlan, PlanType.MASTER);
        } else {
            emit SubscriptionRenewed(msg.sender, PlanType.MASTER, sub.expiresAt);
        }
    }
    
    /**
     * @dev Check if user can mint NFT
     * @param user Address to check
     * @return canMint Whether user can mint
     * @return remainingNFTs How many NFTs user can still mint
     */
    function canMintNFT(address user) external view returns (bool canMint, uint256 remainingNFTs) {
        Subscription storage sub = subscriptions[user];
        
        if (!sub.isActive || block.timestamp > sub.expiresAt) {
            return (false, 0);
        }
        
        PlanConfig memory config = planConfigs[sub.plan];
        
        if (sub.nftsMinted >= config.nftLimit) {
            return (false, 0);
        }
        
        remainingNFTs = config.nftLimit - sub.nftsMinted;
        canMint = true;
    }
    
    /**
     * @dev Record NFT mint (called by factory)
     * @param user Address that minted
     * @param amount Number of NFTs minted
     */
    function recordNFTMint(address user, uint256 amount) external {
        // Only authorized contracts can call this
        require(authorizedCallers[msg.sender], "Unauthorized caller");
        
        Subscription storage sub = subscriptions[user];
        sub.nftsMinted += amount;
        
        emit NFTMinted(user, amount);
    }
    
    /**
     * @dev Check if user has gasless minting capability
     */
    function hasGaslessMinting(address user) external view returns (bool) {
        Subscription storage sub = subscriptions[user];
        
        if (!sub.isActive || block.timestamp > sub.expiresAt) {
            return false;
        }
        
        return planConfigs[sub.plan].gasless;
    }
    
    /**
     * @dev Get user subscription details
     */
    function getSubscription(address user) external view returns (
        PlanType plan,
        uint256 expiresAt,
        uint256 nftsMinted,
        uint256 nftLimit,
        bool isActive,
        bool isExpired
    ) {
        Subscription storage sub = subscriptions[user];
        PlanConfig memory config = planConfigs[sub.plan];
        
        return (
            sub.plan,
            sub.expiresAt,
            sub.nftsMinted,
            config.nftLimit,
            sub.isActive,
            block.timestamp > sub.expiresAt
        );
    }
    
    // Authorized callers (Factory contracts)
    mapping(address => bool) public authorizedCallers;
    
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
    }
    
    /**
     * @dev Update plan configuration
     */
    function updatePlanConfig(
        PlanType plan,
        uint256 price,
        uint256 duration,
        uint256 nftLimit
    ) external onlyOwner {
        planConfigs[plan].price = price;
        planConfigs[plan].duration = duration;
        planConfigs[plan].nftLimit = nftLimit;
        
        emit PlanConfigUpdated(plan, price, duration, nftLimit);
    }
    
    /**
     * @dev Update accepted payment tokens
     */
    function setAcceptedToken(address token, bool accepted) external onlyOwner {
        acceptedTokens[token] = accepted;
        emit PaymentTokenUpdated(token, accepted);
    }
    
    /**
     * @dev Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
    
    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw(address token) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(address(this).balance);
        } else {
            IERC20(token).transfer(owner(), IERC20(token).balanceOf(address(this)));
        }
    }
}