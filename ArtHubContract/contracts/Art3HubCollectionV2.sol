// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

interface ISubscriptionManager {
    function canMintNFT(address user) external view returns (bool canMint, uint256 remainingNFTs);
    function recordNFTMint(address user, uint256 amount) external;
    function hasGaslessMinting(address user) external view returns (bool);
}

interface ProxyRegistry {
    function proxies(address) external view returns (address);
}

/**
 * @title Art3HubCollectionV2
 * @dev Enhanced ERC721 NFT collection with subscription-based minting and gasless transactions
 * @author Art3Hub Team
 */
contract Art3HubCollectionV2 is 
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721RoyaltyUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    EIP712
{
    using ECDSA for bytes32;
    
    // Collection metadata
    struct CollectionInfo {
        string name;
        string symbol;
        string description;
        string image;
        string externalUrl;
        address artist;
        uint256 createdAt;
    }
    
    // Minting signature structure
    struct MintVoucher {
        address to;
        string tokenURI;
        uint256 nonce;
        uint256 deadline;
    }
    
    // State variables
    CollectionInfo public collectionInfo;
    ISubscriptionManager public subscriptionManager;
    ProxyRegistry public immutable proxyRegistry;
    
    uint256 private _tokenIds;
    mapping(address => uint256) public nonces;
    
    // Platform fee configuration
    address public platformFeeRecipient;
    uint96 public platformFeePercentage; // Basis points (e.g., 250 = 2.5%)
    
    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event GaslessMint(address indexed to, uint256 indexed tokenId, address indexed signer);
    event CollectionMetadataUpdated(string name, string description, string image);
    event RoyaltyUpdated(address recipient, uint96 feeNumerator);
    
    // Custom errors
    error SubscriptionRequired();
    error MintLimitExceeded();
    error InvalidSignature();
    error DeadlineExpired();
    error NonceUsed();
    
    constructor(address _proxyRegistry) EIP712("Art3HubCollectionV2", "1") {
        proxyRegistry = ProxyRegistry(_proxyRegistry);
    }
    
    /**
     * @dev Initialize the collection
     */
    function initialize(
        string memory name,
        string memory symbol,
        string memory description,
        string memory image,
        string memory externalUrl,
        address artist,
        address royaltyRecipient,
        uint96 royaltyFeeNumerator,
        address _subscriptionManager,
        address _platformFeeRecipient,
        uint96 _platformFeePercentage
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __ERC721Royalty_init();
        __Ownable_init(artist);
        __ReentrancyGuard_init();
        
        collectionInfo = CollectionInfo({
            name: name,
            symbol: symbol,
            description: description,
            image: image,
            externalUrl: externalUrl,
            artist: artist,
            createdAt: block.timestamp
        });
        
        subscriptionManager = ISubscriptionManager(_subscriptionManager);
        platformFeeRecipient = _platformFeeRecipient;
        platformFeePercentage = _platformFeePercentage;
        
        // Set default royalty
        _setDefaultRoyalty(royaltyRecipient, royaltyFeeNumerator);
        
    }
    
    /**
     * @dev Mint NFT with subscription validation
     * @param to Address to mint to
     * @param _tokenURI Metadata URI for the token
     */
    function mint(address to, string memory _tokenURI) external nonReentrant {
        // Check subscription and limits
        (bool canMint, uint256 remaining) = subscriptionManager.canMintNFT(to);
        if (!canMint) revert SubscriptionRequired();
        if (remaining == 0) revert MintLimitExceeded();
        
        // Mint the token
        uint256 tokenId = _mintToken(to, _tokenURI);
        
        // Record the mint in subscription manager
        subscriptionManager.recordNFTMint(to, 1);
        
        emit TokenMinted(to, tokenId, _tokenURI);
    }
    
    /**
     * @dev Gasless mint using meta-transaction signature
     * @param voucher Signed mint voucher
     * @param signature Signature from authorized signer
     */
    function gaslessMint(
        MintVoucher calldata voucher,
        bytes calldata signature
    ) external nonReentrant {
        // Verify deadline
        if (block.timestamp > voucher.deadline) revert DeadlineExpired();
        
        // Verify nonce
        if (nonces[voucher.to] != voucher.nonce) revert NonceUsed();
        
        // Check subscription and gasless capability
        (bool canMint, uint256 remaining) = subscriptionManager.canMintNFT(voucher.to);
        if (!canMint) revert SubscriptionRequired();
        if (remaining == 0) revert MintLimitExceeded();
        
        // Verify signature
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            keccak256("MintVoucher(address to,string tokenURI,uint256 nonce,uint256 deadline)"),
            voucher.to,
            keccak256(bytes(voucher.tokenURI)),
            voucher.nonce,
            voucher.deadline
        )));
        
        address signer = digest.recover(signature);
        if (signer != owner()) revert InvalidSignature();
        
        // Increment nonce
        nonces[voucher.to]++;
        
        // Mint the token
        uint256 tokenId = _mintToken(voucher.to, voucher.tokenURI);
        
        // Record the mint in subscription manager
        subscriptionManager.recordNFTMint(voucher.to, 1);
        
        emit GaslessMint(voucher.to, tokenId, signer);
        emit TokenMinted(voucher.to, tokenId, voucher.tokenURI);
    }
    
    /**
     * @dev Artist mint (owner only)
     * @param to Address to mint to
     * @param _tokenURI Metadata URI for the token
     */
    function artistMint(address to, string memory _tokenURI) external onlyOwner {
        uint256 tokenId = _mintToken(to, _tokenURI);
        emit TokenMinted(to, tokenId, _tokenURI);
    }
    
    /**
     * @dev Batch mint for artist (owner only)
     * @param recipients Array of addresses to mint to
     * @param tokenURIs Array of metadata URIs
     */
    function batchArtistMint(
        address[] calldata recipients,
        string[] calldata tokenURIs
    ) external onlyOwner {
        require(recipients.length == tokenURIs.length, "Array length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _mintToken(recipients[i], tokenURIs[i]);
            emit TokenMinted(recipients[i], tokenId, tokenURIs[i]);
        }
    }
    
    /**
     * @dev Internal mint function
     */
    function _mintToken(address to, string memory _tokenURI) internal returns (uint256) {
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        return tokenId;
    }
    
    /**
     * @dev Update collection metadata (owner only)
     */
    function updateCollectionMetadata(
        string memory description,
        string memory image,
        string memory externalUrl
    ) external onlyOwner {
        collectionInfo.description = description;
        collectionInfo.image = image;
        collectionInfo.externalUrl = externalUrl;
        
        emit CollectionMetadataUpdated(collectionInfo.name, description, image);
    }
    
    /**
     * @dev Update royalty information (owner only)
     */
    function updateRoyalty(address recipient, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(recipient, feeNumerator);
        emit RoyaltyUpdated(recipient, feeNumerator);
    }
    
    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }
    
    /**
     * @dev Check if address is approved for all (OpenSea gasless listing)
     */
    function isApprovedForAll(address owner, address operator) public view override(ERC721Upgradeable, IERC721) returns (bool) {
        // Allow OpenSea proxy contract for gasless listings
        if (address(proxyRegistry) != address(0) && proxyRegistry.proxies(owner) == operator) {
            return true;
        }
        
        return super.isApprovedForAll(owner, operator);
    }
    
    /**
     * @dev Contract URI for OpenSea collection metadata
     */
    function contractURI() external view returns (string memory) {
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _base64Encode(bytes(abi.encodePacked(
                '{"name":"', collectionInfo.name, '",',
                '"description":"', collectionInfo.description, '",',
                '"image":"', collectionInfo.image, '",',
                '"external_link":"', collectionInfo.externalUrl, '",',
                '"seller_fee_basis_points":', _toString(_feeDenominator()), ',',
                '"fee_recipient":"', _toHexString(uint160(platformFeeRecipient), 20), '"}'
            )))
        ));
    }
    
    // Required overrides
    
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC721RoyaltyUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Utility functions
    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        if (data.length == 0) return "";
        
        string memory result = new string(4 * ((data.length + 2) / 3));
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            
            for { let i := 0 } lt(i, mload(data)) { i := add(i, 3) } {
                let input := shr(232, mload(add(add(data, 32), i)))
                
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            
            switch mod(mload(data), 3)
            case 1 {
                mstore8(sub(resultPtr, 2), 0x3d)
                mstore8(sub(resultPtr, 1), 0x3d)
            }
            case 2 {
                mstore8(sub(resultPtr, 1), 0x3d)
            }
        }
        
        return result;
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    function _toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }
    
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";
}