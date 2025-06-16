// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./Art3HubCollectionV2.sol";
import "./Art3HubFactoryV2.sol";

interface IGaslessTarget {
    function gaslessMint(
        Art3HubCollectionV2.MintVoucher calldata voucher,
        bytes calldata signature
    ) external;
}

interface IFactory {
    function gaslessCreateCollection(
        Art3HubFactoryV2.CollectionVoucher calldata voucher,
        bytes calldata signature
    ) external returns (address);
}

/**
 * @title GaslessRelayer
 * @dev Relayer contract for gasless transactions in Art3Hub ecosystem
 * @author Art3Hub Team
 */
contract GaslessRelayer is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;
    
    // Relay request structure
    struct RelayRequest {
        address from;
        address target;
        bytes data;
        uint256 nonce;
        uint256 deadline;
        uint256 gasLimit;
    }
    
    // State variables
    mapping(address => uint256) public nonces;
    mapping(address => bool) public authorizedRelayers;
    mapping(address => bool) public authorizedTargets;
    
    uint256 public maxGasLimit = 500000;
    
    // Events
    event RelayExecuted(
        address indexed from,
        address indexed target,
        bytes32 indexed requestHash,
        bool success
    );
    
    event RelayerUpdated(address indexed relayer, bool authorized);
    event TargetUpdated(address indexed target, bool authorized);
    
    // Custom errors
    error InvalidSignature();
    error DeadlineExpired();
    error NonceUsed();
    error UnauthorizedRelayer();
    error UnauthorizedTarget();
    error GasLimitExceeded();
    error RelayFailed();
    
    constructor() Ownable(msg.sender) EIP712("GaslessRelayer", "1") {
        authorizedRelayers[msg.sender] = true;
    }
    
    /**
     * @dev Execute a gasless transaction
     * @param request Relay request structure
     * @param signature User's signature
     */
    function relay(
        RelayRequest calldata request,
        bytes calldata signature
    ) external nonReentrant {
        // Check authorization
        if (!authorizedRelayers[msg.sender]) revert UnauthorizedRelayer();
        if (!authorizedTargets[request.target]) revert UnauthorizedTarget();
        
        // Verify deadline
        if (block.timestamp > request.deadline) revert DeadlineExpired();
        
        // Verify nonce
        if (nonces[request.from] != request.nonce) revert NonceUsed();
        
        // Verify gas limit
        if (request.gasLimit > maxGasLimit) revert GasLimitExceeded();
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            keccak256("RelayRequest(address from,address target,bytes data,uint256 nonce,uint256 deadline,uint256 gasLimit)"),
            request.from,
            request.target,
            keccak256(request.data),
            request.nonce,
            request.deadline,
            request.gasLimit
        ));
        
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        
        if (signer != request.from) revert InvalidSignature();
        
        // Increment nonce
        nonces[request.from]++;
        
        // Execute the call
        bytes32 requestHash = keccak256(abi.encode(request));
        
        (bool success,) = request.target.call{gas: request.gasLimit}(request.data);
        
        if (!success) revert RelayFailed();
        
        emit RelayExecuted(request.from, request.target, requestHash, success);
    }
    
    /**
     * @dev Batch relay multiple transactions
     * @param requests Array of relay requests
     * @param signatures Array of signatures
     */
    function batchRelay(
        RelayRequest[] calldata requests,
        bytes[] calldata signatures
    ) external nonReentrant {
        require(requests.length == signatures.length, "Array length mismatch");
        require(requests.length <= 10, "Too many requests"); // Limit batch size
        
        for (uint256 i = 0; i < requests.length; i++) {
            try this.relay(requests[i], signatures[i]) {
                // Success
            } catch {
                // Continue with next transaction on failure
                continue;
            }
        }
    }
    
    /**
     * @dev Get next nonce for user
     * @param user User address
     * @return nonce Next nonce
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
    
    /**
     * @dev Set authorized relayer
     * @param relayer Relayer address
     * @param authorized Authorization status
     */
    function setAuthorizedRelayer(address relayer, bool authorized) external onlyOwner {
        authorizedRelayers[relayer] = authorized;
        emit RelayerUpdated(relayer, authorized);
    }
    
    /**
     * @dev Set authorized target contract
     * @param target Target contract address
     * @param authorized Authorization status
     */
    function setAuthorizedTarget(address target, bool authorized) external onlyOwner {
        authorizedTargets[target] = authorized;
        emit TargetUpdated(target, authorized);
    }
    
    /**
     * @dev Update maximum gas limit
     * @param _maxGasLimit New maximum gas limit
     */
    function setMaxGasLimit(uint256 _maxGasLimit) external onlyOwner {
        maxGasLimit = _maxGasLimit;
    }
    
    /**
     * @dev Emergency withdrawal
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Receive function to accept ETH for gas payments
     */
    receive() external payable {}
}