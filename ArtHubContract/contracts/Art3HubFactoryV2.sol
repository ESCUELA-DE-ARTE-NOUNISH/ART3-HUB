// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./Art3HubCollectionV2.sol";
import "./SubscriptionManager.sol";

/**
 * @title Art3HubFactoryV2
 * @dev Factory contract for creating Art3Hub NFT collections with subscription features
 * @author Art3Hub Team
 */
contract Art3HubFactoryV2 is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;
    using Clones for address;
    
    // Collection creation voucher for gasless deployment
    struct CollectionVoucher {
        address artist;
        string name;
        string symbol;
        string description;
        string image;
        string externalUrl;
        uint96 royaltyFeeNumerator;
        uint256 nonce;
        uint256 deadline;
    }
    
    // State variables
    address public immutable implementation;
    SubscriptionManager public immutable subscriptionManager;
    address public immutable proxyRegistry;
    
    // Platform configuration
    address public platformFeeRecipient;
    uint96 public platformFeePercentage;
    
    // Collection tracking
    mapping(address => address[]) public artistCollections;
    mapping(address => address) public collectionToArtist;
    address[] public allCollections;
    
    // Gasless deployment nonces
    mapping(address => uint256) public deploymentNonces;
    
    // Events
    event CollectionCreated(
        address indexed collection,
        address indexed artist,
        string name,
        string symbol,
        uint256 indexed collectionId
    );
    
    event GaslessCollectionCreated(
        address indexed collection,
        address indexed artist,
        string name,
        address indexed deployer
    );
    
    // Custom errors
    error SubscriptionRequired();
    error InvalidSignature();
    error DeadlineExpired();
    error NonceUsed();
    error InvalidRoyalty();
    
    constructor(
        address _implementation,
        address _subscriptionManager,
        address _proxyRegistry,
        address _platformFeeRecipient,
        uint96 _platformFeePercentage
    ) Ownable(msg.sender) EIP712("Art3HubFactoryV2", "1") {
        implementation = _implementation;
        subscriptionManager = SubscriptionManager(_subscriptionManager);
        proxyRegistry = _proxyRegistry;
        platformFeeRecipient = _platformFeeRecipient;
        platformFeePercentage = _platformFeePercentage;
    }
    
    /**
     * @dev Create a new NFT collection
     * @param name Collection name
     * @param symbol Collection symbol
     * @param description Collection description
     * @param image Collection image URL
     * @param externalUrl Collection external URL
     * @param royaltyRecipient Address to receive royalties
     * @param royaltyFeeNumerator Royalty fee in basis points (max 5000 = 50%)
     */
    function createCollection(
        string memory name,
        string memory symbol,
        string memory description,
        string memory image,
        string memory externalUrl,
        address royaltyRecipient,
        uint96 royaltyFeeNumerator
    ) external nonReentrant returns (address) {
        // Validate royalty
        if (royaltyFeeNumerator > 5000) revert InvalidRoyalty(); // Max 50%
        
        // Check subscription
        (bool canMint,) = subscriptionManager.canMintNFT(msg.sender);
        if (!canMint) revert SubscriptionRequired();
        
        return _deployCollection(
            msg.sender,
            name,
            symbol,
            description,
            image,
            externalUrl,
            royaltyRecipient,
            royaltyFeeNumerator
        );
    }
    
    /**
     * @dev Create collection with gasless deployment
     * @param voucher Signed collection voucher
     * @param signature Signature from platform
     */
    function gaslessCreateCollection(
        CollectionVoucher calldata voucher,
        bytes calldata signature
    ) external nonReentrant returns (address) {
        // Verify deadline
        if (block.timestamp > voucher.deadline) revert DeadlineExpired();
        
        // Verify nonce
        if (deploymentNonces[voucher.artist] != voucher.nonce) revert NonceUsed();
        
        // Verify signature
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            keccak256("CollectionVoucher(address artist,string name,string symbol,string description,string image,string externalUrl,uint96 royaltyFeeNumerator,uint256 nonce,uint256 deadline)"),
            voucher.artist,
            keccak256(bytes(voucher.name)),
            keccak256(bytes(voucher.symbol)),
            keccak256(bytes(voucher.description)),
            keccak256(bytes(voucher.image)),
            keccak256(bytes(voucher.externalUrl)),
            voucher.royaltyFeeNumerator,
            voucher.nonce,
            voucher.deadline
        )));
        
        address signer = digest.recover(signature);
        if (signer != owner()) revert InvalidSignature();
        
        // Validate royalty
        if (voucher.royaltyFeeNumerator > 5000) revert InvalidRoyalty();
        
        // Check subscription
        (bool canMint,) = subscriptionManager.canMintNFT(voucher.artist);
        if (!canMint) revert SubscriptionRequired();
        
        // Increment nonce
        deploymentNonces[voucher.artist]++;
        
        address collection = _deployCollection(
            voucher.artist,
            voucher.name,
            voucher.symbol,
            voucher.description,
            voucher.image,
            voucher.externalUrl,
            voucher.artist, // Artist as royalty recipient
            voucher.royaltyFeeNumerator
        );
        
        emit GaslessCollectionCreated(collection, voucher.artist, voucher.name, msg.sender);
        
        return collection;
    }
    
    /**
     * @dev Internal function to deploy collection
     */
    function _deployCollection(
        address artist,
        string memory name,
        string memory symbol,
        string memory description,
        string memory image,
        string memory externalUrl,
        address royaltyRecipient,
        uint96 royaltyFeeNumerator
    ) internal returns (address) {
        // Deploy clone
        address collection = implementation.clone();
        
        // Initialize collection
        Art3HubCollectionV2(collection).initialize(
            name,
            symbol,
            description,
            image,
            externalUrl,
            artist,
            royaltyRecipient,
            royaltyFeeNumerator,
            address(subscriptionManager),
            platformFeeRecipient,
            platformFeePercentage
        );
        
        // Track collection
        artistCollections[artist].push(collection);
        collectionToArtist[collection] = artist;
        allCollections.push(collection);
        
        emit CollectionCreated(
            collection,
            artist,
            name,
            symbol,
            allCollections.length - 1
        );
        
        return collection;
    }
    
    /**
     * @dev Get collections by artist
     * @param artist Artist address
     * @return collections Array of collection addresses
     */
    function getArtistCollections(address artist) external view returns (address[] memory) {
        return artistCollections[artist];
    }
    
    /**
     * @dev Get artist collections with pagination
     * @param artist Artist address
     * @param offset Starting index
     * @param limit Number of collections to return
     * @return collections Array of collection addresses
     * @return total Total number of collections for artist
     */
    function getArtistCollectionsPaginated(
        address artist,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory collections, uint256 total) {
        address[] storage allArtistCollections = artistCollections[artist];
        total = allArtistCollections.length;
        
        if (offset >= total) {
            return (new address[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        collections = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            collections[i - offset] = allArtistCollections[i];
        }
    }
    
    /**
     * @dev Get all collections with pagination
     * @param offset Starting index
     * @param limit Number of collections to return
     * @return collections Array of collection addresses
     * @return total Total number of collections
     */
    function getAllCollectionsPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory collections, uint256 total) {
        total = allCollections.length;
        
        if (offset >= total) {
            return (new address[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        collections = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            collections[i - offset] = allCollections[i];
        }
    }
    
    /**
     * @dev Get total number of collections
     */
    function totalCollections() external view returns (uint256) {
        return allCollections.length;
    }
    
    /**
     * @dev Get artist for a collection
     * @param collection Collection address
     * @return artist Artist address
     */
    function getArtist(address collection) external view returns (address) {
        return collectionToArtist[collection];
    }
    
    /**
     * @dev Update platform fee recipient (owner only)
     */
    function setPlatformFeeRecipient(address _platformFeeRecipient) external onlyOwner {
        platformFeeRecipient = _platformFeeRecipient;
    }
    
    /**
     * @dev Update platform fee percentage (owner only)
     */
    function setPlatformFeePercentage(uint96 _platformFeePercentage) external onlyOwner {
        require(_platformFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = _platformFeePercentage;
    }
}