// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./Art3HubCollectionV3.sol";
import "./Art3HubSubscriptionV3.sol";

/**
 * @title Art3Hub Factory V3
 * @dev Factory for creating collections with gasless transactions and subscription integration
 */
contract Art3HubFactoryV3 is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    struct CollectionVoucher {
        string name;
        string symbol;
        string description;
        string image;
        string externalUrl;
        address artist;
        address royaltyRecipient;
        uint96 royaltyFeeNumerator;
        uint256 nonce;
        uint256 deadline;
        bytes signature;
    }

    struct MintVoucher {
        address collection;
        address to;
        string tokenURI;
        uint256 nonce;
        uint256 deadline;
        bytes signature;
    }

    // Contract references
    Art3HubSubscriptionV3 public subscriptionManager;
    address public collectionImplementation;
    address public gaslessRelayer;

    // State
    uint256 public totalCollections;
    mapping(address => uint256) public userNonces;
    mapping(address => address[]) public userCollections;
    mapping(address => bool) public isArt3HubCollection;

    // Events
    event CollectionCreated(
        address indexed collection,
        address indexed artist,
        string name,
        string symbol,
        uint256 indexed collectionId
    );
    
    event NFTMinted(
        address indexed collection,
        address indexed to,
        uint256 indexed tokenId,
        string tokenURI,
        bool gasless
    );

    event GaslessRelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    // Custom errors
    error NoActiveSubscription();
    error InsufficientQuota();
    error InvalidVoucher();
    error UnauthorizedRelayer();
    error VoucherExpired();

    constructor(
        address _subscriptionManager,
        address _gaslessRelayer,
        address _initialOwner
    ) EIP712("Art3HubFactoryV3", "1") Ownable(_initialOwner) {
        subscriptionManager = Art3HubSubscriptionV3(_subscriptionManager);
        gaslessRelayer = _gaslessRelayer;
        
        // Deploy the collection implementation
        collectionImplementation = address(new Art3HubCollectionV3());
    }

    // ==================== COLLECTION CREATION ====================

    /**
     * @dev Create collection with regular transaction (user pays gas)
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
        address artist = msg.sender;
        
        // Check subscription
        require(subscriptionManager.canUserMint(artist, 0), "No active subscription");
        
        return _createCollection(
            name,
            symbol,
            description,
            image,
            externalUrl,
            artist,
            royaltyRecipient,
            royaltyFeeNumerator
        );
    }

    /**
     * @dev Create collection with gasless transaction (relayer pays gas)
     */
    function createCollectionGasless(CollectionVoucher calldata voucher) external nonReentrant returns (address) {
        require(msg.sender == gaslessRelayer, "Unauthorized relayer");
        require(block.timestamp <= voucher.deadline, "Voucher expired");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            keccak256("CollectionVoucher(string name,string symbol,string description,string image,string externalUrl,address artist,address royaltyRecipient,uint96 royaltyFeeNumerator,uint256 nonce,uint256 deadline)"),
            keccak256(bytes(voucher.name)),
            keccak256(bytes(voucher.symbol)),
            keccak256(bytes(voucher.description)),
            keccak256(bytes(voucher.image)),
            keccak256(bytes(voucher.externalUrl)),
            voucher.artist,
            voucher.royaltyRecipient,
            voucher.royaltyFeeNumerator,
            voucher.nonce,
            voucher.deadline
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(voucher.signature);
        require(signer == voucher.artist, "Invalid signature");
        require(userNonces[voucher.artist] == voucher.nonce, "Invalid nonce");
        
        userNonces[voucher.artist]++;
        
        // Check subscription (auto-enroll if needed)
        if (!subscriptionManager.canUserMint(voucher.artist, 0)) {
            subscriptionManager.autoEnrollFreePlan(voucher.artist);
        }
        
        return _createCollection(
            voucher.name,
            voucher.symbol,
            voucher.description,
            voucher.image,
            voucher.externalUrl,
            voucher.artist,
            voucher.royaltyRecipient,
            voucher.royaltyFeeNumerator
        );
    }

    /**
     * @dev Internal function to create collection
     */
    function _createCollection(
        string memory name,
        string memory symbol,
        string memory description,
        string memory image,
        string memory externalUrl,
        address artist,
        address royaltyRecipient,
        uint96 royaltyFeeNumerator
    ) internal returns (address) {
        // Clone the implementation
        address collection = Clones.clone(collectionImplementation);
        
        // Initialize the collection
        Art3HubCollectionV3(collection).initialize(
            name,
            symbol,
            description,
            image,
            externalUrl,
            artist,
            royaltyRecipient,
            royaltyFeeNumerator,
            address(this),
            address(subscriptionManager)
        );
        
        // Update state
        totalCollections++;
        userCollections[artist].push(collection);
        isArt3HubCollection[collection] = true;
        
        emit CollectionCreated(collection, artist, name, symbol, totalCollections);
        
        return collection;
    }

    // ==================== NFT MINTING ====================

    /**
     * @dev Mint NFT with regular transaction (user pays gas)
     */
    function mintNFT(
        address collection,
        address to,
        string memory tokenURI
    ) external nonReentrant {
        require(isArt3HubCollection[collection], "Invalid collection");
        require(subscriptionManager.canUserMint(to, 1), "Insufficient quota");
        
        // Mint the NFT
        uint256 tokenId = Art3HubCollectionV3(collection).mint(to, tokenURI);
        
        // Record in subscription
        subscriptionManager.recordNFTMint(to, 1);
        
        emit NFTMinted(collection, to, tokenId, tokenURI, false);
    }

    /**
     * @dev Mint NFT with gasless transaction (relayer pays gas)
     */
    function mintNFTGasless(MintVoucher calldata voucher) external nonReentrant {
        require(msg.sender == gaslessRelayer, "Unauthorized relayer");
        require(block.timestamp <= voucher.deadline, "Voucher expired");
        require(isArt3HubCollection[voucher.collection], "Invalid collection");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            keccak256("MintVoucher(address collection,address to,string tokenURI,uint256 nonce,uint256 deadline)"),
            voucher.collection,
            voucher.to,
            keccak256(bytes(voucher.tokenURI)),
            voucher.nonce,
            voucher.deadline
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(voucher.signature);
        require(signer == voucher.to, "Invalid signature");
        require(userNonces[voucher.to] == voucher.nonce, "Invalid nonce");
        
        userNonces[voucher.to]++;
        
        // Check subscription (auto-enroll if needed)
        if (!subscriptionManager.canUserMint(voucher.to, 1)) {
            subscriptionManager.autoEnrollFreePlan(voucher.to);
        }
        
        require(subscriptionManager.canUserMint(voucher.to, 1), "Insufficient quota");
        
        // Mint the NFT
        uint256 tokenId = Art3HubCollectionV3(voucher.collection).mint(voucher.to, voucher.tokenURI);
        
        // Record in subscription
        subscriptionManager.recordNFTMint(voucher.to, 1);
        
        emit NFTMinted(voucher.collection, voucher.to, tokenId, voucher.tokenURI, true);
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @dev Get user's collections
     */
    function getUserCollections(address user) external view returns (address[] memory) {
        return userCollections[user];
    }

    /**
     * @dev Get user's nonce for gasless transactions
     */
    function getUserNonce(address user) external view returns (uint256) {
        return userNonces[user];
    }

    /**
     * @dev Check if user can create collection
     */
    function canCreateCollection(address user) external view returns (bool) {
        return subscriptionManager.canUserMint(user, 0);
    }

    /**
     * @dev Check if user can mint NFT
     */
    function canMintNFT(address user) external view returns (bool) {
        return subscriptionManager.canUserMint(user, 1);
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Update gasless relayer
     */
    function updateGaslessRelayer(address newRelayer) external onlyOwner {
        address oldRelayer = gaslessRelayer;
        gaslessRelayer = newRelayer;
        emit GaslessRelayerUpdated(oldRelayer, newRelayer);
    }

    /**
     * @dev Update subscription manager
     */
    function updateSubscriptionManager(address newManager) external onlyOwner {
        subscriptionManager = Art3HubSubscriptionV3(newManager);
    }

    /**
     * @dev Update collection implementation (for upgrades)
     */
    function updateCollectionImplementation(address newImplementation) external onlyOwner {
        collectionImplementation = newImplementation;
    }

    /**
     * @dev Emergency: Mark collection as valid/invalid
     */
    function setCollectionStatus(address collection, bool isValid) external onlyOwner {
        isArt3HubCollection[collection] = isValid;
    }
}