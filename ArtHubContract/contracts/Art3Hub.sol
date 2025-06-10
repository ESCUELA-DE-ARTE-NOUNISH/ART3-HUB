// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title Art3 Hub - Zora-Compatible NFT Collection with ERC-2981 Royalties
/// @notice A collection for artists to mint and showcase their work on Base
/// @dev Follows Zora protocol standards for maximum compatibility
contract Art3Hub is ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // Collection metadata
    string public constant COLLECTION_NAME = "Art3 Hub";
    string public constant COLLECTION_SYMBOL = "ART3HUB";
    
    // Token tracking
    uint256 private _currentTokenId;
    uint256 public maxSupply;
    
    // Pricing and royalties
    uint256 public mintPrice;
    uint96 public constant DEFAULT_ROYALTY_BPS = 1000; // 10%
    
    // Collection metadata
    string private _contractURI;
    string private _baseTokenURI;
    
    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event ContractURIUpdated(string newContractURI);
    event BaseURIUpdated(string newBaseURI);
    event MintPriceUpdated(uint256 newMintPrice);
    event MaxSupplyUpdated(uint256 newMaxSupply);

    constructor(
        uint256 _maxSupply,
        uint256 _mintPrice,
        string memory _initialContractURI,
        string memory _initialBaseURI
    ) ERC721(COLLECTION_NAME, COLLECTION_SYMBOL) {
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        _contractURI = _initialContractURI;
        _baseTokenURI = _initialBaseURI;
        
        // Set default royalty to contract owner
        _setDefaultRoyalty(msg.sender, DEFAULT_ROYALTY_BPS);
    }

    /// @notice Mint a new NFT with custom metadata URI
    /// @param to The address to mint the NFT to
    /// @param tokenURI The metadata URI for the token
    /// @return tokenId The ID of the newly minted token
    function mint(address to, string memory tokenURI) 
        external 
        payable 
        nonReentrant 
        returns (uint256) 
    {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_currentTokenId < maxSupply, "Max supply reached");
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");

        _currentTokenId++;
        uint256 tokenId = _currentTokenId;
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        emit TokenMinted(to, tokenId, tokenURI);
        
        return tokenId;
    }

    /// @notice Mint NFT to sender with payment
    /// @param tokenURI The metadata URI for the token
    /// @return tokenId The ID of the newly minted token
    function mint(string memory tokenURI) external payable returns (uint256) {
        return mint(msg.sender, tokenURI);
    }

    /// @notice Owner can mint without payment (for promotional purposes)
    /// @param to The address to mint the NFT to
    /// @param tokenURI The metadata URI for the token
    /// @return tokenId The ID of the newly minted token
    function ownerMint(address to, string memory tokenURI) 
        external 
        onlyOwner 
        returns (uint256) 
    {
        require(_currentTokenId < maxSupply, "Max supply reached");
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");

        _currentTokenId++;
        uint256 tokenId = _currentTokenId;
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        emit TokenMinted(to, tokenId, tokenURI);
        
        return tokenId;
    }

    /// @notice Get the total number of tokens minted
    /// @return The current token supply
    function totalSupply() external view returns (uint256) {
        return _currentTokenId;
    }

    /// @notice Get the remaining tokens that can be minted
    /// @return The number of remaining tokens
    function remainingSupply() external view returns (uint256) {
        return maxSupply - _currentTokenId;
    }

    /// @notice Check if a token exists
    /// @param tokenId The token ID to check
    /// @return Whether the token exists
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    // Collection Management Functions (Owner only)

    /// @notice Update the mint price
    /// @param newMintPrice New price in wei
    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        mintPrice = newMintPrice;
        emit MintPriceUpdated(newMintPrice);
    }

    /// @notice Update max supply (can only decrease)
    /// @param newMaxSupply New maximum supply
    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= _currentTokenId, "Cannot set below current supply");
        require(newMaxSupply < maxSupply, "Can only decrease max supply");
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    /// @notice Set contract-level metadata URI
    /// @param newContractURI New contract metadata URI
    function setContractURI(string memory newContractURI) external onlyOwner {
        _contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

    /// @notice Set base URI for token metadata
    /// @param newBaseURI New base URI
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /// @notice Update default royalty settings
    /// @param recipient New royalty recipient
    /// @param royaltyBps New royalty basis points (out of 10000)
    function setDefaultRoyalty(address recipient, uint96 royaltyBps) external onlyOwner {
        _setDefaultRoyalty(recipient, royaltyBps);
    }

    /// @notice Set royalty for a specific token
    /// @param tokenId Token ID
    /// @param recipient Royalty recipient
    /// @param royaltyBps Royalty basis points (out of 10000)
    function setTokenRoyalty(uint256 tokenId, address recipient, uint96 royaltyBps) 
        external 
        onlyOwner 
    {
        _setTokenRoyalty(tokenId, recipient, royaltyBps);
    }

    /// @notice Withdraw contract balance to owner
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // View Functions

    /// @notice Get contract-level metadata URI (OpenSea standard)
    /// @return Contract metadata URI
    function contractURI() external view returns (string memory) {
        return _contractURI;
    }

    /// @notice Get base URI for tokens
    /// @return Base URI string
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /// @notice Get token URI with fallback to base URI + token ID
    /// @param tokenId Token ID
    /// @return Token metadata URI
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }

    // Required overrides

    /// @notice Support interface detection
    /// @param interfaceId Interface identifier
    /// @return Whether interface is supported
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721Royalty) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Burn token (removes royalty info)
    /// @param tokenId Token to burn
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);
    }
}