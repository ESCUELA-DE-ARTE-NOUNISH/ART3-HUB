// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title Art3HubClaimableNFT
 * @dev NFT contract with claim code functionality for creating NFTs that can be claimed with special codes
 */
contract Art3HubClaimableNFT is ERC721URIStorage, ERC721Enumerable, Ownable {
    // Events
    event ClaimCodeAdded(bytes32 indexed claimCodeHash, uint256 maxClaims);
    event ClaimCodeRevoked(bytes32 indexed claimCodeHash);
    event NFTClaimed(address indexed claimer, bytes32 indexed claimCodeHash, uint256 tokenId);
    event BaseURIChanged(string newBaseURI);

    // Contract metadata
    string private _name;
    string private _symbol;
    string private _baseTokenURI;
    uint256 private _tokenIdCounter;
    
    // Maximum number of NFTs that can be minted
    uint256 public maxSupply;

    // Claim code data structure
    struct ClaimCode {
        bool isActive;          // Whether this claim code is active
        uint256 maxClaims;      // Maximum number of claims allowed for this code (0 = unlimited)
        uint256 currentClaims;  // Current number of claims made
        uint256 startTime;      // Time when claiming becomes available
        uint256 endTime;        // Time when claiming ends (0 = no end time)
        string metadataURI;     // IPFS URI for the NFT metadata
    }

    // Mapping from claim code hash to ClaimCode data
    mapping(bytes32 => ClaimCode) public claimCodes;
    
    // Mapping from user address to claim code hash to whether they've claimed
    mapping(address => mapping(bytes32 => bool)) public hasClaimed;

    /**
     * @dev Constructor for the Art3HubClaimableNFT contract
     * @param name_ Name of the NFT collection
     * @param symbol_ Symbol of the NFT collection
     * @param baseTokenURI_ Base URI for token metadata
     * @param initialOwner Initial owner of the contract
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        _name = name_;
        _symbol = symbol_;
        _baseTokenURI = baseTokenURI_;
        _tokenIdCounter = 0;
        maxSupply = 10000; // Default max supply
    }
    
    /**
     * @dev Add a new claim code to the contract
     * @param claimCode The claim code string
     * @param maxClaims Maximum number of claims allowed for this code (0 = unlimited)
     * @param startTime Time when claiming becomes available
     * @param endTime Time when claiming ends (0 = no end time)
     * @param metadataURI IPFS URI for the NFT metadata
     */
    function addClaimCode(
        string calldata claimCode,
        uint256 maxClaims,
        uint256 startTime,
        uint256 endTime,
        string calldata metadataURI
    ) external onlyOwner {
        require(bytes(claimCode).length > 0, "ClaimCode cannot be empty");
        require(bytes(metadataURI).length > 0, "MetadataURI cannot be empty");
        
        bytes32 claimCodeHash = keccak256(bytes(claimCode));
        require(!claimCodes[claimCodeHash].isActive, "Claim code already exists");
        
        claimCodes[claimCodeHash] = ClaimCode({
            isActive: true,
            maxClaims: maxClaims,
            currentClaims: 0,
            startTime: startTime,
            endTime: endTime,
            metadataURI: metadataURI
        });
        
        emit ClaimCodeAdded(claimCodeHash, maxClaims);
    }
    
    /**
     * @dev Revoke a claim code (disable it)
     * @param claimCode The claim code to revoke
     */
    function revokeClaimCode(string calldata claimCode) external onlyOwner {
        bytes32 claimCodeHash = keccak256(bytes(claimCode));
        require(claimCodes[claimCodeHash].isActive, "Claim code does not exist");
        
        claimCodes[claimCodeHash].isActive = false;
        
        emit ClaimCodeRevoked(claimCodeHash);
    }
    
    /**
     * @dev Update an existing claim code's settings
     * @param claimCode The claim code to update
     * @param maxClaims Maximum number of claims allowed for this code (0 = unlimited)
     * @param startTime Time when claiming becomes available
     * @param endTime Time when claiming ends (0 = no end time)
     */
    function updateClaimCode(
        string calldata claimCode,
        uint256 maxClaims,
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner {
        bytes32 claimCodeHash = keccak256(bytes(claimCode));
        require(claimCodes[claimCodeHash].isActive, "Claim code does not exist");
        
        ClaimCode storage code = claimCodes[claimCodeHash];
        
        // Update settings
        code.maxClaims = maxClaims;
        code.startTime = startTime;
        code.endTime = endTime;
    }
    
    /**
     * @dev Claim an NFT using a valid claim code
     * @param claimCode The claim code to use for claiming
     * @return tokenId The token ID of the claimed NFT
     */
    function claimNFT(string calldata claimCode) external returns (uint256) {
        bytes32 claimCodeHash = keccak256(bytes(claimCode));
        
        ClaimCode storage code = claimCodes[claimCodeHash];
        
        // Check claim code validity
        require(code.isActive, "Claim code is invalid or inactive");
        require(block.timestamp >= code.startTime, "Claiming period has not started");
        require(code.endTime == 0 || block.timestamp <= code.endTime, "Claiming period has ended");
        
        // Check if user has already claimed with this code
        require(!hasClaimed[msg.sender][claimCodeHash], "You have already claimed with this code");
        
        // Check max claims limit
        require(code.maxClaims == 0 || code.currentClaims < code.maxClaims, "Maximum claims reached");
        
        // Check max supply
        require(_tokenIdCounter < maxSupply, "Maximum supply reached");
        
        // Mark as claimed
        hasClaimed[msg.sender][claimCodeHash] = true;
        code.currentClaims++;
        
        // Mint NFT
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, code.metadataURI);
        
        emit NFTClaimed(msg.sender, claimCodeHash, tokenId);
        
        return tokenId;
    }
    
    /**
     * @dev Check if a claim code is valid for a user
     * @param claimCode The claim code to check
     * @param user The user address to check
     * @return valid Whether the claim code is valid
     * @return message A message explaining the result
     */
    function validateClaimCode(string calldata claimCode, address user) external view returns (bool valid, string memory message) {
        bytes32 claimCodeHash = keccak256(bytes(claimCode));
        ClaimCode storage code = claimCodes[claimCodeHash];
        
        if (!code.isActive) {
            return (false, "Claim code is invalid or inactive");
        }
        
        if (block.timestamp < code.startTime) {
            return (false, "Claiming period has not started");
        }
        
        if (code.endTime > 0 && block.timestamp > code.endTime) {
            return (false, "Claiming period has ended");
        }
        
        if (hasClaimed[user][claimCodeHash]) {
            return (false, "You have already claimed with this code");
        }
        
        if (code.maxClaims > 0 && code.currentClaims >= code.maxClaims) {
            return (false, "Maximum claims reached");
        }
        
        if (_tokenIdCounter >= maxSupply) {
            return (false, "Maximum supply reached");
        }
        
        return (true, "Claim code is valid");
    }
    
    /**
     * @dev Set the base URI for token metadata
     * @param baseTokenURI_ New base URI
     */
    function setBaseURI(string calldata baseTokenURI_) external onlyOwner {
        _baseTokenURI = baseTokenURI_;
        emit BaseURIChanged(baseTokenURI_);
    }
    
    /**
     * @dev Set the maximum supply
     * @param newMaxSupply New max supply
     */
    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= _tokenIdCounter, "New max supply must be >= current token count");
        maxSupply = newMaxSupply;
    }
    
    /**
     * @dev Get token URI
     * @param tokenId Token ID to get URI for
     * @return Token URI
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Base URI for computing tokenURI
     * @return Base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Override supportsInterface function
     * @param interfaceId Interface ID to check
     * @return Boolean indicating if interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Override _update function
     * @param to Receiver
     * @param tokenId Token ID
     * @param auth Sender
     */
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Override _increaseBalance function
     * @param account Address to increase balance for
     * @param value Amount to increase
     */
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    
    /**
     * @dev Direct mint function for owner (bypasses claim codes)
     * @param to Address to mint to
     * @param metadataURI IPFS URI for the NFT metadata
     * @return tokenId The token ID of the minted NFT
     */
    function ownerMint(address to, string calldata metadataURI) external onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataURI).length > 0, "MetadataURI cannot be empty");
        require(_tokenIdCounter < maxSupply, "Maximum supply reached");
        
        // Mint NFT
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        return tokenId;
    }
    
} 