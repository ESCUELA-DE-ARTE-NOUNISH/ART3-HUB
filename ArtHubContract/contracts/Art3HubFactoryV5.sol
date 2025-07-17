// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./Art3HubCollectionV5.sol";
import "./Art3HubSubscriptionV4.sol";

/**
 * @title Art3Hub Factory V5
 * @dev Enhanced factory for Base-only deployment with comprehensive on-chain data storage
 * @dev Integrates with V5 collections for database-minimized architecture
 */
contract Art3HubFactoryV5 is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    // ==================== ENHANCED VOUCHER STRUCTURES ====================

    struct CollectionVoucherV5 {
        string name;
        string symbol;
        string description;
        string image;
        string externalUrl;
        address artist;
        address royaltyRecipient;
        uint96 royaltyFeeNumerator;
        // Creator profile data
        string creatorName;
        string creatorUsername;
        string creatorEmail;
        string creatorProfilePicture;
        string creatorSocialLinks;
        uint256 nonce;
        uint256 deadline;
    }

    struct MintVoucherV5 {
        address collection;
        address to;
        string tokenURI;
        // NFT extended data
        string category;
        string[] tags;
        string ipfsImageHash;
        string ipfsMetadataHash;
        uint256 royaltyBPS;
        string additionalMetadata;
        uint256 nonce;
        uint256 deadline;
    }

    // ==================== STATE VARIABLES ====================

    // Contract references
    Art3HubSubscriptionV4 public subscriptionManager;
    address public collectionImplementation;
    address public gaslessRelayer;

    // State tracking
    uint256 public totalCollections;
    mapping(address => uint256) public userNonces;
    mapping(address => address[]) public userCollections;
    mapping(address => bool) public isArt3HubCollection;
    
    // Enhanced tracking for V5
    mapping(string => address) public collectionByName; // Unique collection names
    mapping(address => string[]) public creatorCollectionNames;
    mapping(string => bool) public nameExists;
    
    // Analytics and discovery
    string[] public allCollectionCategories;
    mapping(string => bool) public collectionCategoryExists;
    mapping(string => address[]) public collectionsByCategory;

    // ==================== EVENTS ====================

    event CollectionCreatedV5(
        address indexed collection,
        address indexed artist,
        string name,
        string symbol,
        string category,
        uint256 indexed collectionId
    );
    
    event NFTMintedV5(
        address indexed collection,
        address indexed to,
        uint256 indexed tokenId,
        string category,
        string[] tags,
        bool gasless
    );

    event CreatorProfileLinked(
        address indexed creator,
        address indexed collection,
        string username
    );

    // ==================== CONSTRUCTOR ====================

    constructor(
        address _subscriptionManager,
        address _gaslessRelayer,
        address _initialOwner
    ) EIP712("Art3HubFactoryV5", "1") Ownable(_initialOwner) {
        subscriptionManager = Art3HubSubscriptionV4(_subscriptionManager);
        gaslessRelayer = _gaslessRelayer;
        
        // Deploy the V5 collection implementation
        collectionImplementation = address(new Art3HubCollectionV5());
    }

    // ==================== COLLECTION CREATION V5 ====================

    /**
     * @dev Create V5 collection with enhanced metadata and creator profile
     */
    function createCollectionV5(
        string memory name,
        string memory symbol,
        string memory description,
        string memory image,
        string memory externalUrl,
        address royaltyRecipient,
        uint96 royaltyFeeNumerator,
        string memory category,
        // Creator profile data
        string memory creatorName,
        string memory creatorUsername,
        string memory creatorEmail,
        string memory creatorProfilePicture,
        string memory creatorSocialLinks
    ) external nonReentrant returns (address) {
        address artist = msg.sender;
        
        // Check subscription
        require(subscriptionManager.canUserMint(artist, 0), "No active subscription");
        require(!nameExists[name], "Collection name exists");
        require(bytes(category).length > 0, "Category required");
        
        address collection = _createCollectionV5(
            name, symbol, description, image, externalUrl,
            artist, royaltyRecipient, royaltyFeeNumerator, category,
            creatorName, creatorUsername, creatorEmail, creatorProfilePicture, creatorSocialLinks
        );
        
        return collection;
    }

    /**
     * @dev Create V5 collection with gasless transaction
     */
    function createCollectionV5Gasless(
        CollectionVoucherV5 calldata voucher, 
        bytes calldata signature
    ) external nonReentrant returns (address) {
        require(msg.sender == gaslessRelayer, "Unauthorized relayer");
        require(block.timestamp <= voucher.deadline, "Voucher expired");
        require(!nameExists[voucher.name], "Collection name exists");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            keccak256("CollectionVoucherV5(string name,string symbol,string description,string image,string externalUrl,address artist,address royaltyRecipient,uint96 royaltyFeeNumerator,string creatorName,string creatorUsername,string creatorEmail,string creatorProfilePicture,string creatorSocialLinks,uint256 nonce,uint256 deadline)"),
            keccak256(bytes(voucher.name)),
            keccak256(bytes(voucher.symbol)),
            keccak256(bytes(voucher.description)),
            keccak256(bytes(voucher.image)),
            keccak256(bytes(voucher.externalUrl)),
            voucher.artist,
            voucher.royaltyRecipient,
            voucher.royaltyFeeNumerator,
            keccak256(bytes(voucher.creatorName)),
            keccak256(bytes(voucher.creatorUsername)),
            keccak256(bytes(voucher.creatorEmail)),
            keccak256(bytes(voucher.creatorProfilePicture)),
            keccak256(bytes(voucher.creatorSocialLinks)),
            voucher.nonce,
            voucher.deadline
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == voucher.artist, "Invalid signature");
        require(userNonces[voucher.artist] == voucher.nonce, "Invalid nonce");
        
        userNonces[voucher.artist]++;
        
        // Auto-enroll if needed
        if (!subscriptionManager.isUserActive(voucher.artist)) {
            subscriptionManager.autoEnrollFreePlan(voucher.artist);
        }
        
        address collection = _createCollectionV5(
            voucher.name, voucher.symbol, voucher.description, voucher.image, voucher.externalUrl,
            voucher.artist, voucher.royaltyRecipient, voucher.royaltyFeeNumerator, "Digital Art", // Default category
            voucher.creatorName, voucher.creatorUsername, voucher.creatorEmail, 
            voucher.creatorProfilePicture, voucher.creatorSocialLinks
        );
        
        return collection;
    }

    /**
     * @dev Internal function to create V5 collection with enhanced features
     */
    function _createCollectionV5(
        string memory name,
        string memory symbol,
        string memory description,
        string memory image,
        string memory externalUrl,
        address artist,
        address royaltyRecipient,
        uint96 royaltyFeeNumerator,
        string memory category,
        string memory creatorName,
        string memory creatorUsername,
        string memory creatorEmail,
        string memory creatorProfilePicture,
        string memory creatorSocialLinks
    ) internal returns (address) {
        // Clone the V5 implementation
        address collection = Clones.clone(collectionImplementation);
        
        // Initialize the V5 collection
        Art3HubCollectionV5(collection).initialize(
            name, symbol, description, image, externalUrl,
            artist, royaltyRecipient, royaltyFeeNumerator,
            address(this), address(subscriptionManager)
        );
        
        // Create creator profile if username is provided
        if (bytes(creatorUsername).length > 0) {
            try Art3HubCollectionV5(collection).createCreatorProfile(
                creatorName, creatorUsername, creatorEmail,
                creatorProfilePicture, "", creatorSocialLinks
            ) {
                emit CreatorProfileLinked(artist, collection, creatorUsername);
            } catch {
                // Profile creation failed, continue without it
            }
        }
        
        // Update state tracking
        totalCollections++;
        userCollections[artist].push(collection);
        isArt3HubCollection[collection] = true;
        
        // Enhanced V5 tracking
        nameExists[name] = true;
        collectionByName[name] = collection;
        creatorCollectionNames[artist].push(name);
        
        // Category tracking
        if (!collectionCategoryExists[category]) {
            allCollectionCategories.push(category);
            collectionCategoryExists[category] = true;
        }
        collectionsByCategory[category].push(collection);
        
        emit CollectionCreatedV5(collection, artist, name, symbol, category, totalCollections);
        
        return collection;
    }

    // ==================== NFT MINTING V5 ====================

    /**
     * @dev Mint NFT to V5 collection with enhanced metadata
     */
    function mintNFTV5(
        address collection,
        address to,
        string memory tokenURI,
        string memory category,
        string[] memory tags,
        string memory ipfsImageHash,
        string memory ipfsMetadataHash,
        uint256 royaltyBPS,
        string memory additionalMetadata
    ) external nonReentrant {
        require(isArt3HubCollection[collection], "Invalid collection");
        require(subscriptionManager.canUserMint(to, 1), "Insufficient quota");
        
        // Mint the NFT
        uint256 tokenId = Art3HubCollectionV5(collection).mint(to, tokenURI);
        
        // Set extended data
        Art3HubCollectionV5(collection).setNFTExtendedData(
            tokenId, category, tags, ipfsImageHash, ipfsMetadataHash,
            royaltyBPS, additionalMetadata
        );
        
        // Record in subscription
        subscriptionManager.recordNFTMint(to, 1);
        
        emit NFTMintedV5(collection, to, tokenId, category, tags, false);
    }

    /**
     * @dev Mint NFT to V5 collection with gasless transaction
     */
    function mintNFTV5Gasless(
        MintVoucherV5 calldata voucher, 
        bytes calldata signature
    ) external nonReentrant {
        require(msg.sender == gaslessRelayer, "Unauthorized relayer");
        require(block.timestamp <= voucher.deadline, "Voucher expired");
        require(isArt3HubCollection[voucher.collection], "Invalid collection");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            keccak256("MintVoucherV5(address collection,address to,string tokenURI,string category,string[] tags,string ipfsImageHash,string ipfsMetadataHash,uint256 royaltyBPS,string additionalMetadata,uint256 nonce,uint256 deadline)"),
            voucher.collection,
            voucher.to,
            keccak256(bytes(voucher.tokenURI)),
            keccak256(bytes(voucher.category)),
            keccak256(abi.encode(voucher.tags)),
            keccak256(bytes(voucher.ipfsImageHash)),
            keccak256(bytes(voucher.ipfsMetadataHash)),
            voucher.royaltyBPS,
            keccak256(bytes(voucher.additionalMetadata)),
            voucher.nonce,
            voucher.deadline
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == voucher.to, "Invalid signature");
        require(userNonces[voucher.to] == voucher.nonce, "Invalid nonce");
        
        userNonces[voucher.to]++;
        
        // Auto-enroll if needed
        if (!subscriptionManager.isUserActive(voucher.to)) {
            subscriptionManager.autoEnrollFreePlan(voucher.to);
        }
        
        require(subscriptionManager.canUserMint(voucher.to, 1), "Insufficient quota");
        
        // Mint the NFT
        uint256 tokenId = Art3HubCollectionV5(voucher.collection).mint(voucher.to, voucher.tokenURI);
        
        // Set extended data
        Art3HubCollectionV5(voucher.collection).setNFTExtendedData(
            tokenId, voucher.category, voucher.tags, voucher.ipfsImageHash, voucher.ipfsMetadataHash,
            voucher.royaltyBPS, voucher.additionalMetadata
        );
        
        // Record in subscription
        subscriptionManager.recordNFTMint(voucher.to, 1);
        
        emit NFTMintedV5(voucher.collection, voucher.to, tokenId, voucher.category, voucher.tags, true);
    }

    // ==================== DISCOVERY AND SEARCH ====================

    /**
     * @dev Get collections by category
     */
    function getCollectionsByCategory(string memory category) external view returns (address[] memory) {
        return collectionsByCategory[category];
    }

    /**
     * @dev Get all collection categories
     */
    function getAllCollectionCategories() external view returns (string[] memory) {
        return allCollectionCategories;
    }

    /**
     * @dev Get collection by name
     */
    function getCollectionByName(string memory name) external view returns (address) {
        return collectionByName[name];
    }

    /**
     * @dev Get creator's collection names
     */
    function getCreatorCollectionNames(address creator) external view returns (string[] memory) {
        return creatorCollectionNames[creator];
    }

    /**
     * @dev Search collections by multiple criteria
     */
    function searchCollections(
        string memory category,
        address creator,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory) {
        address[] memory candidates;
        
        if (creator != address(0)) {
            candidates = userCollections[creator];
        } else if (bytes(category).length > 0) {
            candidates = collectionsByCategory[category];
        } else {
            // Return all collections (expensive, consider pagination)
            candidates = new address[](totalCollections);
            uint256 index = 0;
            for (uint256 i = 0; i < allCollectionCategories.length; i++) {
                address[] memory categoryCollections = collectionsByCategory[allCollectionCategories[i]];
                for (uint256 j = 0; j < categoryCollections.length; j++) {
                    if (index < totalCollections) {
                        candidates[index] = categoryCollections[j];
                        index++;
                    }
                }
            }
        }
        
        // Apply pagination
        if (offset >= candidates.length) {
            return new address[](0);
        }
        
        uint256 end = offset + limit;
        if (end > candidates.length) {
            end = candidates.length;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = candidates[i];
        }
        
        return result;
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @dev Enhanced user subscription info for V5
     */
    function getUserSubscriptionInfoV5(address user) external view returns (
        string memory planName,
        uint256 nftsMinted,
        uint256 nftLimit,
        bool isActive,
        uint256 collectionsCreated,
        string[] memory collectionNames
    ) {
        (Art3HubSubscriptionV4.PlanType plan, , uint256 minted, uint256 limit, bool active,) = 
            subscriptionManager.getSubscription(user);
        
        return (
            subscriptionManager.getPlanName(plan),
            minted,
            limit,
            active,
            userCollections[user].length,
            creatorCollectionNames[user]
        );
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalCollectionsCount,
        uint256 totalCategories,
        uint256 totalCreators,
        uint256 baseNetworkId
    ) {
        uint256 creatorCount = 0;
        // Count unique creators (simplified implementation)
        
        return (
            totalCollections,
            allCollectionCategories.length,
            creatorCount,
            block.chainid
        );
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Update gasless relayer
     */
    function updateGaslessRelayer(address newRelayer) external onlyOwner {
        gaslessRelayer = newRelayer;
    }

    /**
     * @dev Update subscription manager
     */
    function updateSubscriptionManager(address newManager) external onlyOwner {
        subscriptionManager = Art3HubSubscriptionV4(newManager);
    }

    /**
     * @dev Update collection implementation for new deployments
     */
    function updateCollectionImplementation(address newImplementation) external onlyOwner {
        collectionImplementation = newImplementation;
    }

    /**
     * @dev Check if collection name is available
     */
    function isNameAvailable(string memory name) external view returns (bool) {
        return !nameExists[name];
    }

    /**
     * @dev Get contract version
     */
    function version() external pure returns (string memory) {
        return "V5";
    }
}