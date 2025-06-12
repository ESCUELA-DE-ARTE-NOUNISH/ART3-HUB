// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title Art3 Hub Collection - Individual artist NFT collection
/// @notice Zora-compatible NFT collection with ERC-2981 royalties for individual artists
/// @dev Designed to be deployed via factory using minimal proxy pattern
contract Art3HubCollection is 
    Initializable,
    ERC721URIStorageUpgradeable,
    ERC721RoyaltyUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Collection state
    uint256 private _currentTokenId;
    uint256 public maxSupply;
    uint256 public mintPrice;
    
    // Factory and platform settings
    address public factory;
    uint256 public platformFeePercentage;
    
    // Collection metadata
    string private _contractURI;
    string private _baseTokenURI;
    
    // OpenSea compatibility
    address private _proxyRegistryAddress;
    mapping(address => bool) public projectProxy;
    
    // Collection stats
    uint256 public totalRevenue;
    mapping(address => uint256) public minterCount;
    
    // Secondary sales tracking
    uint256 public secondaryFeePercentage; // Basis points (100 = 1%)
    mapping(uint256 => bool) public isFirstSale; // Track if token is on first sale
    
    // NFT Metadata
    struct NFTMetadata {
        string title;
        string description;
        uint96 artistRoyaltyBps;
        address artistAddress;
    }
    mapping(uint256 => NFTMetadata) public nftMetadata;

    // Events
    event TokenMinted(
        address indexed to, 
        uint256 indexed tokenId, 
        string tokenURI,
        uint256 mintPrice,
        uint256 platformFee
    );
    event ArtistNFTCreated(
        address indexed artist,
        uint256 indexed tokenId,
        string title,
        string description,
        uint96 royaltyBps
    );
    event SecondaryFeePaid(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 salePrice,
        uint256 platformFee
    );
    event ContractURIUpdated(string newContractURI);
    event BaseURIUpdated(string newBaseURI);
    event MintPriceUpdated(uint256 newMintPrice);
    event PlatformFeeCollected(uint256 amount);
    event RevenueWithdrawn(address indexed recipient, uint256 amount);
    
    // OpenSea events
    event PermanentURI(string _value, uint256 indexed _id);
    event PermanentURIGlobal();

    /// @notice Initialize the collection (called by factory)
    /// @param name_ Collection name
    /// @param symbol_ Collection symbol  
    /// @param maxSupply_ Maximum number of tokens
    /// @param mintPrice_ Price per mint in wei
    /// @param contractURI_ Contract-level metadata URI
    /// @param baseURI_ Base URI for token metadata
    /// @param royaltyBps_ Royalty basis points (out of 10000)
    /// @param royaltyRecipient_ Address to receive royalties
    /// @param owner_ Collection owner (artist)
    /// @param factory_ Factory contract address
    /// @param platformFeePercentage_ Platform fee percentage in basis points
    /// @param proxyRegistryAddress_ OpenSea proxy registry address
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 mintPrice_,
        string memory contractURI_,
        string memory baseURI_,
        uint96 royaltyBps_,
        address royaltyRecipient_,
        address owner_,
        address factory_,
        uint256 platformFeePercentage_,
        address proxyRegistryAddress_
    ) external initializer {
        __ERC721_init(name_, symbol_);
        __ERC721URIStorage_init();
        __ERC721Royalty_init();
        __Ownable_init(owner_);
        __ReentrancyGuard_init();

        maxSupply = maxSupply_;
        mintPrice = mintPrice_;
        _contractURI = contractURI_;
        _baseTokenURI = baseURI_;
        factory = factory_;
        platformFeePercentage = platformFeePercentage_;
        _proxyRegistryAddress = proxyRegistryAddress_;
        secondaryFeePercentage = 100; // 1% platform fee on secondary sales
        
        // Set royalty info
        _setDefaultRoyalty(royaltyRecipient_, royaltyBps_);
    }

    /// @notice Mint NFT to specified address with payment
    /// @param to Address to mint to
    /// @param tokenURI_ Metadata URI for the token
    /// @return tokenId The newly minted token ID
    function mint(address to, string memory tokenURI_) 
        external 
        payable 
        nonReentrant 
        returns (uint256) 
    {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_currentTokenId < maxSupply, "Max supply reached");
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(tokenURI_).length > 0, "Token URI cannot be empty");

        // Calculate platform fee
        uint256 platformFee = 0;
        if (platformFeePercentage > 0 && mintPrice > 0) {
            platformFee = (mintPrice * platformFeePercentage) / 10000;
        }

        _currentTokenId++;
        uint256 tokenId = _currentTokenId;
        
        // Mint the token
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        
        // Update stats
        totalRevenue += msg.value;
        minterCount[to]++;
        isFirstSale[tokenId] = true; // Mark as first sale
        
        // Transfer platform fee to factory
        if (platformFee > 0 && factory != address(0)) {
            (bool success, ) = payable(factory).call{value: platformFee}("");
            if (success) {
                emit PlatformFeeCollected(platformFee);
            }
        }
        
        emit TokenMinted(to, tokenId, tokenURI_, msg.value, platformFee);
        
        return tokenId;
    }

    /// @notice Mint NFT to sender
    /// @param tokenURI_ Metadata URI for the token
    /// @return tokenId The newly minted token ID
    function mint(string memory tokenURI_) external payable returns (uint256) {
        return this.mint(msg.sender, tokenURI_);
    }

    /// @notice Owner can mint without payment (promotional)
    /// @param to Address to mint to
    /// @param tokenURI_ Metadata URI for the token
    /// @return tokenId The newly minted token ID
    function ownerMint(address to, string memory tokenURI_) 
        external 
        onlyOwner 
        returns (uint256) 
    {
        require(_currentTokenId < maxSupply, "Max supply reached");
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(tokenURI_).length > 0, "Token URI cannot be empty");

        _currentTokenId++;
        uint256 tokenId = _currentTokenId;
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        
        minterCount[to]++;
        isFirstSale[tokenId] = true; // Mark as first sale
        
        emit TokenMinted(to, tokenId, tokenURI_, 0, 0);
        
        return tokenId;
    }

    /// @notice Artist creates NFT with title, description, and custom royalty
    /// @param title NFT title
    /// @param description NFT description  
    /// @param tokenURI_ Metadata URI for the token
    /// @param artistRoyaltyBps Artist royalty percentage in basis points
    /// @return tokenId The newly minted token ID
    function artistMint(
        string memory title,
        string memory description,
        string memory tokenURI_,
        uint96 artistRoyaltyBps
    ) external onlyOwner returns (uint256) {
        require(_currentTokenId < maxSupply, "Max supply reached");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(tokenURI_).length > 0, "Token URI cannot be empty");
        require(artistRoyaltyBps <= 5000, "Royalty cannot exceed 50%");

        _currentTokenId++;
        uint256 tokenId = _currentTokenId;
        
        // Mint to artist (owner)
        _mint(owner(), tokenId);
        _setTokenURI(tokenId, tokenURI_);
        
        // Store NFT metadata
        nftMetadata[tokenId] = NFTMetadata({
            title: title,
            description: description,
            artistRoyaltyBps: artistRoyaltyBps,
            artistAddress: owner()
        });
        
        // Set custom royalty for this token
        _setTokenRoyalty(tokenId, owner(), artistRoyaltyBps);
        
        minterCount[owner()]++;
        isFirstSale[tokenId] = true; // Mark as first sale
        
        emit ArtistNFTCreated(owner(), tokenId, title, description, artistRoyaltyBps);
        emit TokenMinted(owner(), tokenId, tokenURI_, 0, 0);
        
        return tokenId;
    }

    /// @notice Batch mint multiple NFTs (owner only)
    /// @param recipients Array of recipient addresses 
    /// @param tokenURIs Array of token URIs
    function batchOwnerMint(
        address[] calldata recipients,
        string[] calldata tokenURIs
    ) external onlyOwner {
        require(recipients.length == tokenURIs.length, "Arrays length mismatch");
        require(_currentTokenId + recipients.length <= maxSupply, "Would exceed max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(bytes(tokenURIs[i]).length > 0, "Token URI cannot be empty");
            
            _currentTokenId++;
            uint256 tokenId = _currentTokenId;
            
            _mint(recipients[i], tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            
            minterCount[recipients[i]]++;
            isFirstSale[tokenId] = true; // Mark as first sale
            
            emit TokenMinted(recipients[i], tokenId, tokenURIs[i], 0, 0);
        }
    }

    // View functions

    /// @notice Get current total supply
    /// @return Current number of minted tokens
    function totalSupply() external view returns (uint256) {
        return _currentTokenId;
    }

    /// @notice Get remaining mintable supply
    /// @return Number of tokens that can still be minted
    function remainingSupply() external view returns (uint256) {
        return maxSupply - _currentTokenId;
    }

    /// @notice Check if token exists
    /// @param tokenId Token ID to check
    /// @return Whether token exists
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /// @notice Get contract-level metadata URI (OpenSea Collection Standard)
    /// @return Contract URI
    function contractURI() external view returns (string memory) {
        return _contractURI;
    }

    /// @notice Get collection name
    /// @return Collection name
    function name() public view override returns (string memory) {
        return super.name();
    }

    /// @notice Get collection symbol
    /// @return Collection symbol
    function symbol() public view override returns (string memory) {
        return super.symbol();
    }

    /// @notice Get base URI for tokens
    /// @return Base URI
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /// @notice Get collection stats
    /// @return currentSupply Current number of minted tokens
    /// @return maxSupply_ Maximum supply
    /// @return mintPrice_ Current mint price
    /// @return totalRevenue_ Total revenue collected
    function getCollectionStats() external view returns (
        uint256 currentSupply,
        uint256 maxSupply_,
        uint256 mintPrice_,
        uint256 totalRevenue_
    ) {
        return (_currentTokenId, maxSupply, mintPrice, totalRevenue);
    }

    /// @notice Get NFT metadata (title, description, royalty)
    /// @param tokenId Token ID
    /// @return NFT metadata struct
    function getNFTMetadata(uint256 tokenId) external view returns (NFTMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return nftMetadata[tokenId];
    }

    /// @notice Handle secondary sale with platform fee (for marketplace integration)
    /// @param tokenId Token ID being sold
    /// @param from Current owner
    /// @param to New owner
    /// @param salePrice Sale price in wei
    function processSecondarySale(
        uint256 tokenId,
        address from,
        address to,
        uint256 salePrice
    ) external payable nonReentrant {
        require(_ownerOf(tokenId) == from, "From address is not token owner");
        require(to != address(0), "Cannot transfer to zero address");
        require(msg.value >= salePrice, "Insufficient payment");
        
        // Calculate platform fee for secondary sales
        uint256 platformFee = 0;
        if (!isFirstSale[tokenId] && secondaryFeePercentage > 0 && salePrice > 0) {
            platformFee = (salePrice * secondaryFeePercentage) / 10000;
        }
        
        // Mark as no longer first sale
        isFirstSale[tokenId] = false;
        
        // Transfer platform fee to factory
        if (platformFee > 0 && factory != address(0)) {
            (bool success, ) = payable(factory).call{value: platformFee}("");
            require(success, "Platform fee transfer failed");
        }
        
        // Send remaining amount to seller
        uint256 sellerAmount = salePrice - platformFee;
        if (sellerAmount > 0) {
            (bool success, ) = payable(from).call{value: sellerAmount}("");
            require(success, "Payment to seller failed");
        }
        
        // Transfer the NFT
        _transfer(from, to, tokenId);
        
        emit SecondaryFeePaid(tokenId, from, to, salePrice, platformFee);
    }

    // Owner management functions

    /// @notice Update mint price
    /// @param newMintPrice New mint price in wei
    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        mintPrice = newMintPrice;
        emit MintPriceUpdated(newMintPrice);
    }

    /// @notice Update contract URI
    /// @param newContractURI New contract metadata URI
    function setContractURI(string memory newContractURI) external onlyOwner {
        _contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

    /// @notice Update base URI
    /// @param newBaseURI New base URI for token metadata
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /// @notice Update default royalty settings
    /// @param recipient Royalty recipient address
    /// @param royaltyBps Royalty basis points
    function setDefaultRoyalty(address recipient, uint96 royaltyBps) external onlyOwner {
        _setDefaultRoyalty(recipient, royaltyBps);
    }

    /// @notice Set royalty for specific token
    /// @param tokenId Token ID
    /// @param recipient Royalty recipient
    /// @param royaltyBps Royalty basis points
    function setTokenRoyalty(uint256 tokenId, address recipient, uint96 royaltyBps) 
        external 
        onlyOwner 
    {
        _setTokenRoyalty(tokenId, recipient, royaltyBps);
    }

    /// @notice Update OpenSea proxy registry address
    /// @param proxyRegistryAddress New proxy registry address
    function setProxyRegistryAddress(address proxyRegistryAddress) external onlyOwner {
        _proxyRegistryAddress = proxyRegistryAddress;
    }

    /// @notice Add/remove project proxy for gasless listings
    /// @param proxyAddress Proxy address
    /// @param value True to enable, false to disable
    function setProjectProxy(address proxyAddress, bool value) external onlyOwner {
        projectProxy[proxyAddress] = value;
    }

    /// @notice Freeze metadata for a specific token (OpenSea feature)
    /// @param tokenId Token ID to freeze
    function freezeTokenURI(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        string memory uri = tokenURI(tokenId);
        emit PermanentURI(uri, tokenId);
    }

    /// @notice Freeze all metadata (OpenSea feature)
    function freezeAllMetadata() external onlyOwner {
        emit PermanentURIGlobal();
    }

    /// @notice Withdraw collection revenue (minus platform fees already collected)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit RevenueWithdrawn(owner(), balance);
    }

    // OpenSea Integration

    /// @notice Override isApprovedForAll to whitelist OpenSea proxy accounts for gasless listing
    /// @param owner Token owner
    /// @param operator Operator address
    /// @return True if operator is approved
    function isApprovedForAll(address owner, address operator)
        public
        view
        override(ERC721Upgradeable, IERC721)
        returns (bool)
    {
        // Check if operator is OpenSea proxy for owner
        if (_proxyRegistryAddress != address(0)) {
            ProxyRegistry proxyRegistry = ProxyRegistry(_proxyRegistryAddress);
            if (address(proxyRegistry.proxies(owner)) == operator) {
                return true;
            }
        }

        // Check if operator is project proxy
        if (projectProxy[operator]) {
            return true;
        }

        return super.isApprovedForAll(owner, operator);
    }

    // Required overrides

    /// @notice Token URI with fallback handling
    /// @param tokenId Token ID
    /// @return Token metadata URI
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }

    /// @notice Interface support (includes ERC-2981 for OpenSea royalties)
    /// @param interfaceId Interface identifier
    /// @return Whether interface is supported
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721URIStorageUpgradeable, ERC721RoyaltyUpgradeable) 
        returns (bool) 
    {
        return 
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }

}

/// @title ProxyRegistry - Interface for OpenSea proxy registry
/// @notice Interface for OpenSea's proxy registry contract
interface ProxyRegistry {
    function proxies(address) external view returns (address);
}