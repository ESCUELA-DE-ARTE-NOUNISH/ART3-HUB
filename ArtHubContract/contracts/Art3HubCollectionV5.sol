// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Art3HubCollectionV4.sol";

/**
 * @title Art3Hub Collection V5
 * @dev Enhanced NFT collection with comprehensive on-chain data storage for Base-only deployment
 * @dev Minimizes database dependencies by storing creator profiles and NFT metadata on-chain
 */
contract Art3HubCollectionV5 is Art3HubCollectionV4 {
    
    // ==================== ENHANCED DATA STRUCTURES ====================
    
    struct CreatorProfile {
        string name;
        string username; 
        string email;
        string profilePicture; // IPFS hash
        string bannerImage; // IPFS hash
        string socialLinks; // JSON string: {"instagram": "", "x": "", "farcaster": ""}
        bool isVerified;
        uint256 profileCompleteness; // Percentage 0-100
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct NFTExtendedData {
        string category; // "Digital Art", "Photography", etc.
        string[] tags; // Multiple tags for discoverability
        string ipfsImageHash; // Direct IPFS hash for image
        string ipfsMetadataHash; // Direct IPFS hash for metadata
        uint256 createdTimestamp;
        uint256 royaltyBPS; // Basis points for this specific NFT
        bool isVisible; // Privacy control
        bool isFeatured; // Artist can feature specific NFTs
        string additionalMetadata; // JSON string for future extensibility
    }
    
    struct CollectionStats {
        uint256 totalViews;
        uint256 totalLikes;
        uint256 totalShares;
        uint256 averageRating; // Out of 5 stars * 100 (for decimals)
        uint256 ratingCount;
        uint256 lastUpdated;
    }
    
    // ==================== STORAGE MAPPINGS ====================
    
    // Creator data
    mapping(address => CreatorProfile) public creatorProfiles;
    mapping(string => address) public usernameToAddress; // Unique username lookup
    mapping(address => bool) public hasProfile;
    
    // NFT extended data
    mapping(uint256 => NFTExtendedData) public nftExtendedData;
    mapping(address => uint256[]) public creatorNFTs; // All NFTs by creator
    mapping(string => uint256[]) public nftsByCategory; // NFTs by category
    mapping(bytes32 => uint256[]) public nftsByTag; // NFTs by tag hash
    
    // Collection analytics
    mapping(uint256 => CollectionStats) public nftStats;
    mapping(address => mapping(uint256 => bool)) public hasLiked; // User likes
    mapping(address => mapping(uint256 => uint256)) public userRatings; // User ratings
    
    // Search and discovery
    string[] public allCategories;
    mapping(string => bool) public categoryExists;
    bytes32[] public allTags;
    mapping(bytes32 => bool) public tagExists;
    mapping(bytes32 => string) public tagHashToString;
    
    // ==================== EVENTS ====================
    
    event CreatorProfileCreated(address indexed creator, string username, string name);
    event CreatorProfileUpdated(address indexed creator, string username);
    event NFTExtendedDataSet(uint256 indexed tokenId, string category, string[] tags);
    event NFTLiked(uint256 indexed tokenId, address indexed user);
    event NFTUnliked(uint256 indexed tokenId, address indexed user);
    event NFTRated(uint256 indexed tokenId, address indexed user, uint256 rating);
    event NFTViewed(uint256 indexed tokenId, address indexed viewer);
    event CategoryAdded(string category);
    event TagAdded(bytes32 indexed tagHash, string tag);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyCreator() {
        require(msg.sender == artist || msg.sender == owner(), "Only creator");
        _;
    }
    
    modifier validTokenId(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }
    
    modifier usernameAvailable(string memory username) {
        require(usernameToAddress[username] == address(0), "Username taken");
        _;
    }
    
    // ==================== CREATOR PROFILE FUNCTIONS ====================
    
    /**
     * @dev Create or update creator profile with comprehensive data
     */
    function createCreatorProfile(
        string memory _name,
        string memory _username,
        string memory _email,
        string memory _profilePicture,
        string memory _bannerImage,
        string memory _socialLinks
    ) external usernameAvailable(_username) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_username).length > 0, "Username required");
        require(!hasProfile[msg.sender], "Profile already exists");
        
        // Clear old username mapping if updating
        if (bytes(creatorProfiles[msg.sender].username).length > 0) {
            delete usernameToAddress[creatorProfiles[msg.sender].username];
        }
        
        // Calculate profile completeness
        uint256 completeness = _calculateProfileCompleteness(_name, _username, _email, _profilePicture, _bannerImage, _socialLinks);
        
        creatorProfiles[msg.sender] = CreatorProfile({
            name: _name,
            username: _username,
            email: _email,
            profilePicture: _profilePicture,
            bannerImage: _bannerImage,
            socialLinks: _socialLinks,
            isVerified: false,
            profileCompleteness: completeness,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        usernameToAddress[_username] = msg.sender;
        hasProfile[msg.sender] = true;
        
        emit CreatorProfileCreated(msg.sender, _username, _name);
    }
    
    /**
     * @dev Update existing creator profile
     */
    function updateCreatorProfile(
        string memory _name,
        string memory _email,
        string memory _profilePicture,
        string memory _bannerImage,
        string memory _socialLinks
    ) external {
        require(hasProfile[msg.sender], "Profile does not exist");
        
        CreatorProfile storage profile = creatorProfiles[msg.sender];
        
        profile.name = _name;
        profile.email = _email;
        profile.profilePicture = _profilePicture;
        profile.bannerImage = _bannerImage;
        profile.socialLinks = _socialLinks;
        profile.profileCompleteness = _calculateProfileCompleteness(_name, profile.username, _email, _profilePicture, _bannerImage, _socialLinks);
        profile.updatedAt = block.timestamp;
        
        emit CreatorProfileUpdated(msg.sender, profile.username);
    }
    
    /**
     * @dev Calculate profile completeness percentage
     */
    function _calculateProfileCompleteness(
        string memory _name,
        string memory _username,
        string memory _email,
        string memory _profilePicture,
        string memory _bannerImage,
        string memory _socialLinks
    ) internal pure returns (uint256) {
        uint256 score = 0;
        
        if (bytes(_name).length > 0) score += 20;
        if (bytes(_username).length > 0) score += 20;
        if (bytes(_email).length > 0) score += 15;
        if (bytes(_profilePicture).length > 0) score += 15;
        if (bytes(_bannerImage).length > 0) score += 15;
        if (bytes(_socialLinks).length > 10) score += 15; // Basic JSON check
        
        return score;
    }
    
    // ==================== NFT EXTENDED DATA FUNCTIONS ====================
    
    /**
     * @dev Set comprehensive NFT metadata when minting
     */
    function setNFTExtendedData(
        uint256 tokenId,
        string memory category,
        string[] memory tags,
        string memory ipfsImageHash,
        string memory ipfsMetadataHash,
        uint256 royaltyBPS,
        string memory additionalMetadata
    ) external onlyCreator validTokenId(tokenId) {
        require(bytes(category).length > 0, "Category required");
        require(royaltyBPS <= 1000, "Royalty too high"); // Max 10%
        
        // Add category if new
        if (!categoryExists[category]) {
            allCategories.push(category);
            categoryExists[category] = true;
            emit CategoryAdded(category);
        }
        
        // Process tags
        bytes32[] memory tagHashes = new bytes32[](tags.length);
        for (uint256 i = 0; i < tags.length; i++) {
            bytes32 tagHash = keccak256(abi.encodePacked(tags[i]));
            tagHashes[i] = tagHash;
            
            if (!tagExists[tagHash]) {
                allTags.push(tagHash);
                tagExists[tagHash] = true;
                tagHashToString[tagHash] = tags[i];
                emit TagAdded(tagHash, tags[i]);
            }
            
            nftsByTag[tagHash].push(tokenId);
        }
        
        // Store extended data
        nftExtendedData[tokenId] = NFTExtendedData({
            category: category,
            tags: tags,
            ipfsImageHash: ipfsImageHash,
            ipfsMetadataHash: ipfsMetadataHash,
            createdTimestamp: block.timestamp,
            royaltyBPS: royaltyBPS,
            isVisible: true,
            isFeatured: false,
            additionalMetadata: additionalMetadata
        });
        
        // Add to category and creator indexes
        nftsByCategory[category].push(tokenId);
        creatorNFTs[artist].push(tokenId);
        
        // Initialize stats
        nftStats[tokenId] = CollectionStats({
            totalViews: 0,
            totalLikes: 0,
            totalShares: 0,
            averageRating: 0,
            ratingCount: 0,
            lastUpdated: block.timestamp
        });
        
        emit NFTExtendedDataSet(tokenId, category, tags);
    }
    
    /**
     * @dev Update NFT visibility and featured status
     */
    function updateNFTSettings(
        uint256 tokenId,
        bool isVisible,
        bool isFeatured
    ) external onlyCreator validTokenId(tokenId) {
        NFTExtendedData storage data = nftExtendedData[tokenId];
        data.isVisible = isVisible;
        data.isFeatured = isFeatured;
    }
    
    // ==================== SOCIAL INTERACTION FUNCTIONS ====================
    
    /**
     * @dev Like an NFT
     */
    function likeNFT(uint256 tokenId) external validTokenId(tokenId) {
        require(!hasLiked[msg.sender][tokenId], "Already liked");
        
        hasLiked[msg.sender][tokenId] = true;
        nftStats[tokenId].totalLikes++;
        nftStats[tokenId].lastUpdated = block.timestamp;
        
        emit NFTLiked(tokenId, msg.sender);
    }
    
    /**
     * @dev Unlike an NFT
     */
    function unlikeNFT(uint256 tokenId) external validTokenId(tokenId) {
        require(hasLiked[msg.sender][tokenId], "Not liked");
        
        hasLiked[msg.sender][tokenId] = false;
        nftStats[tokenId].totalLikes--;
        nftStats[tokenId].lastUpdated = block.timestamp;
        
        emit NFTUnliked(tokenId, msg.sender);
    }
    
    /**
     * @dev Rate an NFT (1-5 stars)
     */
    function rateNFT(uint256 tokenId, uint256 rating) external validTokenId(tokenId) {
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");
        
        CollectionStats storage stats = nftStats[tokenId];
        uint256 oldRating = userRatings[msg.sender][tokenId];
        
        if (oldRating == 0) {
            // New rating
            stats.ratingCount++;
            stats.averageRating = ((stats.averageRating * (stats.ratingCount - 1)) + (rating * 100)) / stats.ratingCount;
        } else {
            // Update existing rating
            stats.averageRating = ((stats.averageRating * stats.ratingCount) - (oldRating * 100) + (rating * 100)) / stats.ratingCount;
        }
        
        userRatings[msg.sender][tokenId] = rating;
        stats.lastUpdated = block.timestamp;
        
        emit NFTRated(tokenId, msg.sender, rating);
    }
    
    /**
     * @dev Record NFT view
     */
    function viewNFT(uint256 tokenId) external validTokenId(tokenId) {
        nftStats[tokenId].totalViews++;
        nftStats[tokenId].lastUpdated = block.timestamp;
        
        emit NFTViewed(tokenId, msg.sender);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get creator profile by address
     */
    function getCreatorProfile(address creator) external view returns (CreatorProfile memory) {
        return creatorProfiles[creator];
    }
    
    /**
     * @dev Get creator address by username
     */
    function getCreatorByUsername(string memory username) external view returns (address) {
        return usernameToAddress[username];
    }
    
    /**
     * @dev Get all NFTs by creator
     */
    function getCreatorNFTs(address creator) external view returns (uint256[] memory) {
        return creatorNFTs[creator];
    }
    
    /**
     * @dev Get NFTs by category with pagination
     */
    function getNFTsByCategory(string memory category, uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        uint256[] storage categoryNFTs = nftsByCategory[category];
        
        if (offset >= categoryNFTs.length) {
            return new uint256[](0);
        }
        
        uint256 end = offset + limit;
        if (end > categoryNFTs.length) {
            end = categoryNFTs.length;
        }
        
        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = categoryNFTs[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get NFTs by tag
     */
    function getNFTsByTag(string memory tag) external view returns (uint256[] memory) {
        bytes32 tagHash = keccak256(abi.encodePacked(tag));
        return nftsByTag[tagHash];
    }
    
    /**
     * @dev Get all categories
     */
    function getAllCategories() external view returns (string[] memory) {
        return allCategories;
    }
    
    /**
     * @dev Get all tags as strings
     */
    function getAllTags() external view returns (string[] memory) {
        string[] memory tagStrings = new string[](allTags.length);
        for (uint256 i = 0; i < allTags.length; i++) {
            tagStrings[i] = tagHashToString[allTags[i]];
        }
        return tagStrings;
    }
    
    /**
     * @dev Get NFT extended data and stats
     */
    function getNFTFullData(uint256 tokenId) external view validTokenId(tokenId) returns (
        NFTExtendedData memory extendedData,
        CollectionStats memory stats
    ) {
        return (nftExtendedData[tokenId], nftStats[tokenId]);
    }
    
    /**
     * @dev Get featured NFTs by creator
     */
    function getFeaturedNFTs(address creator) external view returns (uint256[] memory) {
        uint256[] memory creatorTokens = creatorNFTs[creator];
        uint256 featuredCount = 0;
        
        // Count featured NFTs
        for (uint256 i = 0; i < creatorTokens.length; i++) {
            if (nftExtendedData[creatorTokens[i]].isFeatured) {
                featuredCount++;
            }
        }
        
        // Build featured array
        uint256[] memory featured = new uint256[](featuredCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < creatorTokens.length; i++) {
            if (nftExtendedData[creatorTokens[i]].isFeatured) {
                featured[index] = creatorTokens[i];
                index++;
            }
        }
        
        return featured;
    }
    
    /**
     * @dev Get collection statistics
     */
    function getCollectionOverview() external view returns (
        uint256 totalNFTs,
        uint256 totalCategories,
        uint256 totalTags,
        uint256 totalCreators
    ) {
        uint256 creatorCount = 0;
        // Note: This is a simplified count, in production you'd maintain a creator registry
        
        return (
            totalSupply(),
            allCategories.length,
            allTags.length,
            creatorCount
        );
    }
    
    // ==================== SEARCH AND DISCOVERY ====================
    
    /**
     * @dev Search NFTs by multiple criteria
     */
    function searchNFTs(
        string memory category,
        string memory tag,
        address creator,
        bool onlyVisible,
        bool onlyFeatured,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256[] memory candidates;
        
        // Start with the most restrictive filter
        if (creator != address(0)) {
            candidates = creatorNFTs[creator];
        } else if (bytes(category).length > 0) {
            candidates = nftsByCategory[category];
        } else if (bytes(tag).length > 0) {
            bytes32 tagHash = keccak256(abi.encodePacked(tag));
            candidates = nftsByTag[tagHash];
        } else {
            // Return all NFTs (expensive operation, consider pagination)
            candidates = new uint256[](totalSupply());
            for (uint256 i = 1; i <= totalSupply(); i++) {
                candidates[i - 1] = i;
            }
        }
        
        // Apply additional filters
        uint256[] memory filtered = new uint256[](candidates.length);
        uint256 filteredCount = 0;
        
        for (uint256 i = 0; i < candidates.length; i++) {
            uint256 tokenId = candidates[i];
            NFTExtendedData memory data = nftExtendedData[tokenId];
            
            bool matches = true;
            
            if (onlyVisible && !data.isVisible) matches = false;
            if (onlyFeatured && !data.isFeatured) matches = false;
            
            if (matches) {
                filtered[filteredCount] = tokenId;
                filteredCount++;
            }
        }
        
        // Apply pagination
        if (offset >= filteredCount) {
            return new uint256[](0);
        }
        
        uint256 end = offset + limit;
        if (end > filteredCount) {
            end = filteredCount;
        }
        
        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = filtered[i];
        }
        
        return result;
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @dev Verify a creator (only owner)
     */
    function verifyCreator(address creator) external onlyOwner {
        require(hasProfile[creator], "Profile does not exist");
        creatorProfiles[creator].isVerified = true;
        creatorProfiles[creator].updatedAt = block.timestamp;
    }
    
    /**
     * @dev Unverify a creator (only owner)
     */
    function unverifyCreator(address creator) external onlyOwner {
        require(hasProfile[creator], "Profile does not exist");
        creatorProfiles[creator].isVerified = false;
        creatorProfiles[creator].updatedAt = block.timestamp;
    }
    
    /**
     * @dev Get contract version
     */
    function version() external pure override returns (string memory) {
        return "V5";
    }
}