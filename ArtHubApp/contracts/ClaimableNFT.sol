// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ClaimableNFT
 * @dev A simple ERC721 contract for claimable NFTs with token URI support
 * This contract allows the owner to mint NFTs with custom metadata URIs
 */
contract ClaimableNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Mapping from claim code to token ID (for tracking claims)
    mapping(string => uint256) public claimCodeToTokenId;
    
    // Mapping from claim code to claimer address
    mapping(string => address) public claimCodeToClaimer;
    
    // Events
    event NFTClaimed(address indexed claimer, uint256 indexed tokenId, string claimCode);
    
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}
    
    /**
     * @dev Mint an NFT to a specific address with a token URI
     * @param to The address to mint the NFT to
     * @param tokenURI The metadata URI for the NFT
     * @return The token ID of the minted NFT
     */
    function mint(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        return tokenId;
    }
    
    /**
     * @dev Mint an NFT with a claim code for tracking
     * @param to The address to mint the NFT to
     * @param tokenURI The metadata URI for the NFT
     * @param claimCode The claim code used to mint this NFT
     * @return The token ID of the minted NFT
     */
    function mintWithClaimCode(
        address to, 
        string memory tokenURI, 
        string memory claimCode
    ) public onlyOwner returns (uint256) {
        require(claimCodeToTokenId[claimCode] == 0, "Claim code already used");
        require(bytes(claimCode).length > 0, "Claim code cannot be empty");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Store claim code associations
        claimCodeToTokenId[claimCode] = tokenId;
        claimCodeToClaimer[claimCode] = to;
        
        emit NFTClaimed(to, tokenId, claimCode);
        
        return tokenId;
    }
    
    /**
     * @dev Check if a claim code has been used
     * @param claimCode The claim code to check
     * @return True if the claim code has been used, false otherwise
     */
    function isClaimCodeUsed(string memory claimCode) public view returns (bool) {
        return claimCodeToTokenId[claimCode] != 0;
    }
    
    /**
     * @dev Get the token ID associated with a claim code
     * @param claimCode The claim code to look up
     * @return The token ID (0 if not found)
     */
    function getTokenIdByClaimCode(string memory claimCode) public view returns (uint256) {
        return claimCodeToTokenId[claimCode];
    }
    
    /**
     * @dev Get the claimer address for a claim code
     * @param claimCode The claim code to look up
     * @return The address that claimed with this code
     */
    function getClaimerByClaimCode(string memory claimCode) public view returns (address) {
        return claimCodeToClaimer[claimCode];
    }
    
    /**
     * @dev Get the current total supply of tokens
     * @return The total number of tokens minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    // Required overrides for ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}