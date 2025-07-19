// Add this function to Art3HubClaimableNFT.sol to enable database-only claim validation

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

/**
 * @dev Batch mint function for owner (bypasses claim codes)
 * @param recipients Array of addresses to mint to
 * @param metadataURIs Array of IPFS URIs for the NFT metadata
 * @return tokenIds Array of token IDs of the minted NFTs
 */
function ownerMintBatch(
    address[] calldata recipients, 
    string[] calldata metadataURIs
) external onlyOwner returns (uint256[] memory tokenIds) {
    require(recipients.length == metadataURIs.length, "Arrays length mismatch");
    require(recipients.length > 0, "Empty arrays");
    require(_tokenIdCounter + recipients.length <= maxSupply, "Would exceed max supply");
    
    tokenIds = new uint256[](recipients.length);
    
    for (uint256 i = 0; i < recipients.length; i++) {
        require(recipients[i] != address(0), "Cannot mint to zero address");
        require(bytes(metadataURIs[i]).length > 0, "MetadataURI cannot be empty");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _mint(recipients[i], tokenId);
        _setTokenURI(tokenId, metadataURIs[i]);
        
        tokenIds[i] = tokenId;
    }
    
    return tokenIds;
}