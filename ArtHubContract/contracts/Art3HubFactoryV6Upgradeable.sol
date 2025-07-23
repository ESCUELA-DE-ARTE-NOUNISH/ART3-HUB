// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Art3HubCollectionV6.sol";
import "./Art3HubSubscriptionV4.sol";

/**
 * @title Art3HubFactoryV6Upgradeable
 * @dev Upgradeable factory contract for creating NFT collections with owner/relayer separation
 */
contract Art3HubFactoryV6Upgradeable is 
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    EIP712Upgradeable
{
    using Clones for address;

    // State variables
    address public collectionImplementation;
    address public subscriptionManager;
    address public gaslessRelayer;
    
    uint256 public totalCollectionsCount;
    mapping(address => address[]) public userCollections;
    mapping(address => bool) public isCollection;
    
    // Events
    event CollectionCreated(
        address indexed collection,
        address indexed creator,
        string name,
        string symbol
    );
    
    event GaslessRelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event SubscriptionManagerUpdated(address indexed oldManager, address indexed newManager);
    event CollectionImplementationUpdated(address indexed oldImpl, address indexed newImpl);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract with owner and gasless relayer separation
     * @param _owner Admin wallet address (from NEW_CONTRACT_OWNER env var)
     * @param _gaslessRelayer Gasless relayer address (operational access)
     * @param _subscriptionManager Subscription manager contract address
     * @param _collectionImplementation Collection implementation contract address
     */
    function initialize(
        address _owner,
        address _gaslessRelayer,
        address _subscriptionManager,
        address _collectionImplementation
    ) public initializer {
        require(_owner != address(0), "Owner cannot be zero address");
        require(_gaslessRelayer != address(0), "Gasless relayer cannot be zero address");
        require(_subscriptionManager != address(0), "Subscription manager cannot be zero address");
        require(_collectionImplementation != address(0), "Collection implementation cannot be zero address");
        
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __EIP712_init("Art3HubFactoryV6", "1");
        
        gaslessRelayer = _gaslessRelayer;
        subscriptionManager = _subscriptionManager;
        collectionImplementation = _collectionImplementation;
    }

    /**
     * @dev Modifier to allow only gasless relayer for operational functions
     */
    modifier onlyGaslessRelayer() {
        require(msg.sender == gaslessRelayer, "Only gasless relayer can call this function");
        _;
    }

    /**
     * @dev Modifier to allow gasless relayer OR owner for hybrid functions
     */
    modifier onlyGaslessRelayerOrOwner() {
        require(
            msg.sender == gaslessRelayer || msg.sender == owner(),
            "Only gasless relayer or owner can call this function"
        );
        _;
    }

    /**
     * @dev Create collection gaslessly - Only gasless relayer can call
     * @param creator The address of the NFT creator
     * @param name Collection name
     * @param symbol Collection symbol
     * @param description Collection description
     * @param image Collection image URL
     * @param externalUrl Collection external URL
     * @param royaltyRecipient Royalty recipient address
     * @param royaltyFeeNumerator Royalty fee numerator (out of 10000)
     */
    function createCollectionV6Gasless(
        address creator,
        string memory name,
        string memory symbol,
        string memory description,
        string memory image,
        string memory externalUrl,
        address royaltyRecipient,
        uint96 royaltyFeeNumerator
    ) external onlyGaslessRelayer nonReentrant returns (address) {
        // Clone the collection implementation
        address newCollection = collectionImplementation.clone();
        
        // Initialize the new collection
        Art3HubCollectionV6(newCollection).initialize(
            name,
            symbol,
            description,
            image,
            externalUrl,
            creator,
            royaltyRecipient,
            royaltyFeeNumerator,
            address(this),
            subscriptionManager
        );
        
        // Record the collection
        userCollections[creator].push(newCollection);
        isCollection[newCollection] = true;
        totalCollectionsCount++;
        
        emit CollectionCreated(newCollection, creator, name, symbol);
        
        return newCollection;
    }

    /**
     * @dev Mint NFT to existing collection gaslessly - Only gasless relayer can call
     * @param collection Collection address
     * @param to Recipient address
     * @param tokenURI Token metadata URI
     */
    function mintNFTV6Gasless(
        address collection,
        address to,
        string memory tokenURI
    ) external onlyGaslessRelayer nonReentrant returns (uint256) {
        require(isCollection[collection], "Invalid collection address");
        
        // Call mint function on the collection
        uint256 tokenId = Art3HubCollectionV5(collection).mint(to, tokenURI);
        
        return tokenId;
    }

    // Admin functions - Only owner can call
    
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
     * @dev Update subscription manager - Only owner
     * @param newSubscriptionManager New subscription manager address
     */
    function updateSubscriptionManager(address newSubscriptionManager) external onlyOwner {
        require(newSubscriptionManager != address(0), "New subscription manager cannot be zero address");
        address oldManager = subscriptionManager;
        subscriptionManager = newSubscriptionManager;
        emit SubscriptionManagerUpdated(oldManager, newSubscriptionManager);
    }

    /**
     * @dev Update collection implementation - Only owner
     * @param newCollectionImplementation New collection implementation address
     */
    function updateCollectionImplementation(address newCollectionImplementation) external onlyOwner {
        require(newCollectionImplementation != address(0), "New collection implementation cannot be zero address");
        address oldImpl = collectionImplementation;
        collectionImplementation = newCollectionImplementation;
        emit CollectionImplementationUpdated(oldImpl, newCollectionImplementation);
    }

    // View functions
    
    /**
     * @dev Get user collections
     * @param user User address
     * @return Array of collection addresses
     */
    function getUserCollections(address user) external view returns (address[] memory) {
        return userCollections[user];
    }

    /**
     * @dev Get platform statistics
     * @return totalCollectionsCount Total number of collections created
     * @return baseNetworkId Current network chain ID
     */
    function getPlatformStats() external view returns (uint256, uint256) {
        return (totalCollectionsCount, block.chainid);
    }

    /**
     * @dev Get contract version
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return "V6-Upgradeable";
    }

    // UUPS upgrade authorization - Only owner can authorize upgrades
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Storage gap for future upgrades
    uint256[44] private __gap;
}