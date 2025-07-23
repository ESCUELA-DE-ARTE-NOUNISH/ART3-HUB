// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Art3HubClaimableNFT.sol";

/**
 * @title Art3HubClaimableNFTFactoryV6Upgradeable
 * @dev Upgradeable factory contract for deploying claimable NFT contracts with owner/relayer separation
 */
contract Art3HubClaimableNFTFactoryV6Upgradeable is 
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // State variables
    address public gaslessRelayer;
    
    // Deployed claimable NFT contracts
    address[] public deployedContracts;
    mapping(address => bool) public isDeployedContract;
    
    // Events
    event ClaimableNFTDeployed(
        address indexed contractAddress,
        string name,
        string symbol,
        address indexed owner
    );
    
    event GaslessRelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract with owner and gasless relayer separation
     * @param _owner Admin wallet address (from NEW_CONTRACT_OWNER env var)
     * @param _gaslessRelayer Gasless relayer address (operational access)
     */
    function initialize(address _owner, address _gaslessRelayer) public initializer {
        require(_owner != address(0), "Owner cannot be zero address");
        require(_gaslessRelayer != address(0), "Gasless relayer cannot be zero address");
        
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
        
        gaslessRelayer = _gaslessRelayer;
    }

    /**
     * @dev Modifier to allow only gasless relayer for operational functions
     */
    modifier onlyGaslessRelayer() {
        require(msg.sender == gaslessRelayer, "Only gasless relayer can call this function");
        _;
    }

    /**
     * @dev Modifier to allow gasless relayer OR owner for hybrid functions
     */
    modifier onlyGaslessRelayerOrOwner() {
        require(
            msg.sender == gaslessRelayer || msg.sender == owner(),
            "Only gasless relayer or owner can call this function"
        );
        _;
    }

    /**
     * @dev Deploy a new claimable NFT contract - Gasless relayer or owner can call
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param baseTokenURI The base URI for token metadata
     * @param contractOwner The owner of the deployed contract
     * @return The address of the deployed contract
     */
    function deployClaimableNFT(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        address contractOwner
    ) external onlyGaslessRelayerOrOwner returns (address) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(contractOwner != address(0), "Contract owner cannot be zero address");
        
        // Deploy new claimable NFT contract
        Art3HubClaimableNFT newContract = new Art3HubClaimableNFT(
            name,
            symbol,
            baseTokenURI,
            contractOwner
        );
        
        address contractAddress = address(newContract);
        
        // Record the deployment
        deployedContracts.push(contractAddress);
        isDeployedContract[contractAddress] = true;
        
        emit ClaimableNFTDeployed(contractAddress, name, symbol, contractOwner);
        
        return contractAddress;
    }

    // Admin functions - Only owner can call
    
    /**
     * @dev Update gasless relayer address - Only owner
     * @param newGaslessRelayer New gasless relayer address
     */
    function updateGaslessRelayer(address newGaslessRelayer) external onlyOwner {
        require(newGaslessRelayer != address(0), "New gasless relayer cannot be zero address");
        address oldRelayer = gaslessRelayer;
        gaslessRelayer = newGaslessRelayer;
        emit GaslessRelayerUpdated(oldRelayer, newGaslessRelayer);
    }

    // View functions
    
    /**
     * @dev Get all deployed contracts
     * @return Array of deployed contract addresses
     */
    function getDeployedContracts() external view returns (address[] memory) {
        return deployedContracts;
    }

    /**
     * @dev Get number of deployed contracts
     * @return Number of deployed contracts
     */
    function getDeployedContractsCount() external view returns (uint256) {
        return deployedContracts.length;
    }

    /**
     * @dev Check if address is a deployed contract
     * @param contractAddress Address to check
     * @return Whether the address is a deployed contract
     */
    function isContractDeployed(address contractAddress) external view returns (bool) {
        return isDeployedContract[contractAddress];
    }

    /**
     * @dev Get contract version
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return "V6-Upgradeable";
    }

    // UUPS upgrade authorization - Only owner can authorize upgrades
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Storage gap for future upgrades
    uint256[47] private __gap;
}