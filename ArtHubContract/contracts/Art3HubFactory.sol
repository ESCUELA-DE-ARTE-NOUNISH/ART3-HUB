// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Art3HubCollection.sol";

/// @title Art3 Hub Factory - Creates individual NFT collections for artists
/// @notice Factory contract that deploys individual NFT collections using minimal proxy pattern
/// @dev Uses OpenZeppelin's Clones library for gas-efficient deployments
contract Art3HubFactory is Ownable, ReentrancyGuard {
    using Clones for address;

    // Implementation contract address (template)
    address public immutable implementation;
    
    // Factory settings
    uint256 public deploymentFee;
    uint256 public platformFeePercentage; // Basis points (100 = 1%)
    address public feeRecipient;
    address public proxyRegistryAddress; // OpenSea proxy registry
    
    // Collection tracking
    mapping(address => address[]) public artistCollections;
    mapping(address => address) public collectionToArtist;
    address[] public allCollections;
    
    // Collection settings
    struct CollectionParams {
        string name;
        string symbol;
        uint256 maxSupply;
        uint256 mintPrice;
        string contractURI;
        string baseURI;
        uint96 royaltyBps;
        address royaltyRecipient;
    }
    
    // Events
    event CollectionCreated(
        address indexed artist,
        address indexed collection,
        string name,
        string symbol,
        uint256 maxSupply
    );
    event DeploymentFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event SecondaryFeeReceived(address indexed collection, uint256 amount);
    
    // Errors
    error InsufficientDeploymentFee();
    error InvalidParameters();
    error CollectionDeploymentFailed();
    error TransferFailed();

    constructor(
        address _implementation,
        uint256 _deploymentFee,
        uint256 _platformFeePercentage,
        address _feeRecipient,
        address _proxyRegistryAddress
    ) Ownable(msg.sender) {
        implementation = _implementation;
        deploymentFee = _deploymentFee;
        platformFeePercentage = _platformFeePercentage;
        feeRecipient = _feeRecipient;
        proxyRegistryAddress = _proxyRegistryAddress;
    }

    /// @notice Create a new NFT collection for an artist
    /// @param params Collection parameters
    /// @return collectionAddress Address of the deployed collection
    function createCollection(CollectionParams calldata params) 
        external 
        payable 
        nonReentrant 
        returns (address collectionAddress) 
    {
        // Validate deployment fee
        if (msg.value < deploymentFee) {
            revert InsufficientDeploymentFee();
        }
        
        // Validate parameters
        if (
            bytes(params.name).length == 0 ||
            bytes(params.symbol).length == 0 ||
            params.maxSupply == 0 ||
            params.royaltyRecipient == address(0)
        ) {
            revert InvalidParameters();
        }

        // Deploy minimal proxy
        collectionAddress = implementation.clone();
        
        // Initialize the collection
        try Art3HubCollection(collectionAddress).initialize(
            params.name,
            params.symbol,
            params.maxSupply,
            params.mintPrice,
            params.contractURI,
            params.baseURI,
            params.royaltyBps,
            params.royaltyRecipient,
            msg.sender, // artist as owner
            address(this), // factory address
            platformFeePercentage,
            proxyRegistryAddress // OpenSea proxy registry
        ) {
            // Track the collection
            artistCollections[msg.sender].push(collectionAddress);
            collectionToArtist[collectionAddress] = msg.sender;
            allCollections.push(collectionAddress);
            
            emit CollectionCreated(
                msg.sender,
                collectionAddress,
                params.name,
                params.symbol,
                params.maxSupply
            );
            
            // Transfer deployment fee to fee recipient
            if (deploymentFee > 0 && feeRecipient != address(0)) {
                (bool success, ) = payable(feeRecipient).call{value: deploymentFee}("");
                if (!success) revert TransferFailed();
            }
            
            // Return excess payment to sender
            uint256 excess = msg.value - deploymentFee;
            if (excess > 0) {
                (bool success, ) = payable(msg.sender).call{value: excess}("");
                if (!success) revert TransferFailed();
            }
            
        } catch {
            revert CollectionDeploymentFailed();
        }
        
        return collectionAddress;
    }

    /// @notice Get collections created by an artist
    /// @param artist Artist address
    /// @return Array of collection addresses
    function getArtistCollections(address artist) external view returns (address[] memory) {
        return artistCollections[artist];
    }

    /// @notice Get total number of collections created
    /// @return Total collection count
    function getTotalCollections() external view returns (uint256) {
        return allCollections.length;
    }

    /// @notice Get collection at index
    /// @param index Index in allCollections array
    /// @return Collection address
    function getCollectionAtIndex(uint256 index) external view returns (address) {
        require(index < allCollections.length, "Index out of bounds");
        return allCollections[index];
    }

    /// @notice Get artist for a collection
    /// @param collection Collection address
    /// @return Artist address
    function getCollectionArtist(address collection) external view returns (address) {
        return collectionToArtist[collection];
    }

    /// @notice Check if address is a collection created by this factory
    /// @param collection Address to check
    /// @return True if collection was created by this factory
    function isFactoryCollection(address collection) external view returns (bool) {
        return collectionToArtist[collection] != address(0);
    }

    /// @notice Get collections by artist with pagination
    /// @param artist Artist address
    /// @param offset Starting index
    /// @param limit Maximum number of results
    /// @return collections Array of collection addresses
    /// @return total Total number of collections for artist
    function getArtistCollectionsPaginated(
        address artist,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory collections, uint256 total) {
        address[] memory artistCols = artistCollections[artist];
        total = artistCols.length;
        
        if (offset >= total) {
            return (new address[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        collections = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            collections[i - offset] = artistCols[i];
        }
    }

    /// @notice Receive secondary sales fees from collections
    receive() external payable {
        // Only accept payments from factory collections
        require(collectionToArtist[msg.sender] != address(0), "Only factory collections can send fees");
        emit SecondaryFeeReceived(msg.sender, msg.value);
    }

    // Admin functions
    
    /// @notice Update deployment fee
    /// @param newFee New deployment fee in wei
    function setDeploymentFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = deploymentFee;
        deploymentFee = newFee;
        emit DeploymentFeeUpdated(oldFee, newFee);
    }

    /// @notice Update platform fee percentage
    /// @param newFee New platform fee in basis points
    function setPlatformFeePercentage(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }

    /// @notice Update fee recipient
    /// @param newRecipient New fee recipient address
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /// @notice Update OpenSea proxy registry address
    /// @param newProxyRegistryAddress New proxy registry address
    function setProxyRegistryAddress(address newProxyRegistryAddress) external onlyOwner {
        proxyRegistryAddress = newProxyRegistryAddress;
    }

    /// @notice Withdraw accumulated fees
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /// @notice Emergency function to update implementation (for upgrades)
    /// @dev This only affects new deployments, existing collections are immutable
    function emergencySetImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        // Note: This doesn't update the immutable variable, but could be used
        // in future versions with upgradeable pattern
    }
}