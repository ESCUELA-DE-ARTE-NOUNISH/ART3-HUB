// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Art3HubClaimableNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Art3HubClaimableNFTFactory
 * @dev Factory contract for deploying claimable NFT collections
 */
contract Art3HubClaimableNFTFactory is Ownable {
    // Events
    event ClaimableNFTDeployed(
        address indexed nftAddress,
        string name,
        string symbol,
        address indexed owner,
        uint256 deployedAt
    );
    
    // Deployed contracts
    address[] public deployedContracts;
    
    // Mapping from user address to their deployed contracts
    mapping(address => address[]) public userContracts;

    /**
     * @dev Constructor
     * @param initialOwner Initial owner of the factory
     */
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev Deploy a new ClaimableNFT collection
     * @param name Name of the NFT collection
     * @param symbol Symbol of the NFT collection
     * @param baseTokenURI Base URI for token metadata
     * @param collectionOwner Address that will own the collection (can be different from msg.sender)
     * @return nftAddress Address of the deployed NFT contract
     */
    function deployClaimableNFT(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        address collectionOwner
    ) external returns (address nftAddress) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(collectionOwner != address(0), "Owner cannot be the zero address");
        
        // Deploy new contract
        Art3HubClaimableNFT nft = new Art3HubClaimableNFT(
            name,
            symbol,
            baseTokenURI,
            collectionOwner
        );
        
        nftAddress = address(nft);
        
        // Register the new contract
        deployedContracts.push(nftAddress);
        userContracts[collectionOwner].push(nftAddress);
        
        emit ClaimableNFTDeployed(
            nftAddress,
            name,
            symbol,
            collectionOwner,
            block.timestamp
        );
        
        return nftAddress;
    }
    
    /**
     * @dev Get all deployed contracts
     * @return Array of deployed NFT contract addresses
     */
    function getDeployedContracts() external view returns (address[] memory) {
        return deployedContracts;
    }
    
    /**
     * @dev Get all contracts deployed by a specific user
     * @param user User address to query
     * @return Array of NFT contract addresses owned by the user
     */
    function getUserContracts(address user) external view returns (address[] memory) {
        return userContracts[user];
    }
    
    /**
     * @dev Get total number of deployed contracts
     * @return Count of deployed contracts
     */
    function getContractCount() external view returns (uint256) {
        return deployedContracts.length;
    }
} 