// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Art3Hub Collection V4
 * @dev OpenSea compatible NFT collection with gasless minting support and Elite Creator plan integration
 */
contract Art3HubCollectionV4 is 
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721RoyaltyUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Collection metadata
    string public description;
    string public image;
    string public externalUrl;
    address public artist;
    address public factory;
    address public subscriptionManager;
    
    // Minting state
    uint256 private _currentTokenId;
    mapping(uint256 => address) public tokenCreators;
    
    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event MetadataUpdated(string description, string image, string externalUrl);
    
    // Custom errors
    error UnauthorizedMinter();
    error InvalidTokenId();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the collection (called by factory)
     */
    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _image,
        string memory _externalUrl,
        address _artist,
        address _royaltyRecipient,
        uint96 _royaltyFeeNumerator,
        address _factory,
        address _subscriptionManager
    ) external initializer {
        __ERC721_init(_name, _symbol);
        __ERC721URIStorage_init();
        __ERC721Royalty_init();
        __Ownable_init(_artist);
        __ReentrancyGuard_init();
        
        description = _description;
        image = _image;
        externalUrl = _externalUrl;
        artist = _artist;
        factory = _factory;
        subscriptionManager = _subscriptionManager;
        
        // Set default royalty
        _setDefaultRoyalty(_royaltyRecipient, _royaltyFeeNumerator);
        
        _currentTokenId = 0;
    }

    // ==================== MINTING FUNCTIONS ====================

    /**
     * @dev Mint NFT (called by factory or authorized addresses)
     */
    function mint(address to, string memory _tokenURI) external nonReentrant returns (uint256) {
        require(
            msg.sender == factory || 
            msg.sender == artist || 
            msg.sender == owner(),
            "Unauthorized minter"
        );
        
        _currentTokenId++;
        uint256 tokenId = _currentTokenId;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        tokenCreators[tokenId] = to;
        
        emit TokenMinted(to, tokenId, _tokenURI);
        
        return tokenId;
    }

    /**
     * @dev Batch mint NFTs
     */
    function batchMint(
        address[] memory recipients,
        string[] memory tokenURIs
    ) external nonReentrant returns (uint256[] memory) {
        require(
            msg.sender == factory || 
            msg.sender == artist || 
            msg.sender == owner(),
            "Unauthorized minter"
        );
        require(recipients.length == tokenURIs.length, "Arrays length mismatch");
        
        uint256[] memory tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _currentTokenId++;
            uint256 tokenId = _currentTokenId;
            
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            
            tokenCreators[tokenId] = recipients[i];
            tokenIds[i] = tokenId;
            
            emit TokenMinted(recipients[i], tokenId, tokenURIs[i]);
        }
        
        return tokenIds;
    }

    // ==================== METADATA FUNCTIONS ====================

    /**
     * @dev Update collection metadata (artist only)
     */
    function updateMetadata(
        string memory _description,
        string memory _image,
        string memory _externalUrl
    ) external {
        require(msg.sender == artist || msg.sender == owner(), "Unauthorized");
        
        description = _description;
        image = _image;
        externalUrl = _externalUrl;
        
        emit MetadataUpdated(_description, _image, _externalUrl);
    }

    /**
     * @dev Update token URI (artist only)
     */
    function updateTokenURI(uint256 tokenId, string memory _tokenURI) external {
        require(msg.sender == artist || msg.sender == owner(), "Unauthorized");
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        _setTokenURI(tokenId, _tokenURI);
    }

    /**
     * @dev Contract-level metadata for OpenSea
     */
    function contractURI() public view returns (string memory) {
        (address royaltyRecipient, uint256 royaltyAmount) = royaltyInfo(0, 10000);
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _encode(abi.encodePacked(
                '{"name":"', name(), '",',
                '"description":"', description, '",',
                '"image":"', image, '",',
                '"external_link":"', externalUrl, '",',
                '"seller_fee_basis_points":', _toString(royaltyAmount), ',',
                '"fee_recipient":"', _toString(royaltyRecipient), '"}'
            ))
        ));
    }

    // ==================== ROYALTY FUNCTIONS ====================

    /**
     * @dev Update default royalty (artist only)
     */
    function updateDefaultRoyalty(address recipient, uint96 feeNumerator) external {
        require(msg.sender == artist || msg.sender == owner(), "Unauthorized");
        _setDefaultRoyalty(recipient, feeNumerator);
    }

    /**
     * @dev Set token-specific royalty
     */
    function setTokenRoyalty(uint256 tokenId, address recipient, uint96 feeNumerator) external {
        require(msg.sender == artist || msg.sender == owner(), "Unauthorized");
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _setTokenRoyalty(tokenId, recipient, feeNumerator);
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @dev Get total supply
     */
    function totalSupply() public view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev Get token creator
     */
    function creatorOf(uint256 tokenId) public view returns (address) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenCreators[tokenId];
    }

    /**
     * @dev Check if token exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Get collection info
     */
    function getCollectionInfo() external view returns (
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _image,
        string memory _externalUrl,
        address _artist,
        uint256 _totalSupply
    ) {
        return (
            name(),
            symbol(),
            description,
            image,
            externalUrl,
            artist,
            totalSupply()
        );
    }

    /**
     * @dev Get collection version
     */
    function version() external pure returns (string memory) {
        return "V4";
    }

    // ==================== OPENSEA COMPATIBILITY ====================

    /**
     * @dev OpenSea proxy registry for gasless approvals
     */
    function isApprovedForAll(address owner, address operator) public view override(ERC721Upgradeable, IERC721) returns (bool) {
        // OpenSea proxy registry addresses
        if (block.chainid == 1) { // Ethereum Mainnet
            if (operator == 0xa5409ec958C83C3f309868babACA7c86DCB077c1) return true; // OpenSea Registry
        } else if (block.chainid == 5) { // Goerli
            if (operator == 0xff7Ca10aF37178BdD056628eF42fD7F799fAc77c) return true; // OpenSea Registry
        } else if (block.chainid == 137) { // Polygon
            if (operator == 0x58807baD0B376efc12F5AD86aAc70E78ed67deaE) return true; // OpenSea Registry
        } else if (block.chainid == 8453) { // Base
            if (operator == 0x4Cc6a166b44dE7e9DB7EA5749c20c56D8F9056E2) return true; // OpenSea Registry
        }
        
        return super.isApprovedForAll(owner, operator);
    }

    // ==================== OVERRIDES ====================

    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721RoyaltyUpgradeable, ERC721URIStorageUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721Upgradeable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721Upgradeable) {
        super._increaseBalance(account, value);
    }

    // ==================== HELPER FUNCTIONS ====================

    /**
     * @dev Convert address to string
     */
    function _toString(address addr) internal pure returns (string memory) {
        return _toString(uint256(uint160(addr)));
    }

    /**
     * @dev Convert uint256 to string
     */
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

    /**
     * @dev Base64 encode
     */
    function _encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen + 32);
        
        assembly {
            let tablePtr := add(table, 1)
            let dataPtr := data
            let endPtr := add(dataPtr, mload(data))
            let resultPtr := add(result, 32)
            
            for {} lt(dataPtr, endPtr) {}
            {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr( 6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(        input,  0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            
            switch mod(mload(data), 3)
            case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
        }
        
        return result;
    }
}