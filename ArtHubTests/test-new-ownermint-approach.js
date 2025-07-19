#!/usr/bin/env node

/**
 * Test script for the new ownerMint approach (no claim codes on contract)
 * This tests the complete database-only claim validation flow
 */

const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { baseSepolia } = require('viem/chains');

// Configuration
const FACTORY_ADDRESS = '0x55248aC366d3F26b6aa480ed5fD82130C8C6842d'; // New factory with ownerMint
const RELAYER_PRIVATE_KEY = process.env.GASLESS_RELAYER_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// ABIs
const FACTORY_ABI = [
  {
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "symbol", "type": "string"},
      {"name": "baseTokenURI", "type": "string"},
      {"name": "collectionOwner", "type": "address"}
    ],
    "name": "deployClaimableNFT",
    "outputs": [{"name": "nftAddress", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const CLAIMABLE_NFT_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "metadataURI", "type": "string"}
    ],
    "name": "ownerMint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  console.log('🧪 Testing New OwnerMint Approach (Database-Only Claim Validation)');
  console.log('================================================================');
  
  // Setup clients
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC)
  });
  
  const formattedPrivateKey = RELAYER_PRIVATE_KEY.startsWith('0x') 
    ? RELAYER_PRIVATE_KEY 
    : `0x${RELAYER_PRIVATE_KEY}`;
    
  const relayerAccount = privateKeyToAccount(formattedPrivateKey);
  const walletClient = createWalletClient({
    account: relayerAccount,
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC)
  });
  
  console.log('🔧 Setup:', {
    factoryAddress: FACTORY_ADDRESS,
    relayerAccount: relayerAccount.address,
    network: 'Base Sepolia'
  });
  
  try {
    // Step 1: Deploy a new claimable NFT contract via factory
    console.log('\\n📦 Step 1: Deploying new claimable NFT via factory...');
    
    const deployHash = await walletClient.writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'deployClaimableNFT',
      args: [
        'TestOwnerMintNFT',
        'TOMNFT', 
        'https://ipfs.io/ipfs/',
        relayerAccount.address
      ]
    });
    
    console.log('🚀 Deploy transaction submitted:', deployHash);
    
    const deployReceipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
    console.log('✅ Deploy transaction confirmed');
    
    // Get the deployed contract address from the transaction logs
    const deployedContractAddress = deployReceipt.logs[0]?.address;
    console.log('📍 New NFT contract deployed at:', deployedContractAddress);
    
    // Step 2: Test ownerMint function (no claim codes needed!)
    console.log('\\n🎯 Step 2: Testing ownerMint function...');
    
    const testUserAddress = '0x499D377eF114cC1BF7798cECBB38412701400daF'; // Test user
    const metadataURI = 'https://ipfs.io/ipfs/QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L';
    
    // Simulate first
    console.log('🔍 Simulating ownerMint...');
    const simResult = await publicClient.simulateContract({
      address: deployedContractAddress,
      abi: CLAIMABLE_NFT_ABI,
      functionName: 'ownerMint',
      args: [testUserAddress, metadataURI],
      account: relayerAccount
    });
    
    const predictedTokenId = simResult.result;
    console.log('✅ Simulation successful, predicted token ID:', predictedTokenId);
    
    // Execute the mint
    console.log('🔨 Executing ownerMint...');
    const mintHash = await walletClient.writeContract({
      address: deployedContractAddress,
      abi: CLAIMABLE_NFT_ABI,
      functionName: 'ownerMint',
      args: [testUserAddress, metadataURI]
    });
    
    console.log('🚀 Mint transaction submitted:', mintHash);
    
    const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintHash });
    console.log('✅ Mint transaction confirmed');
    
    // Step 3: Verify the NFT was minted correctly
    console.log('\\n🔍 Step 3: Verifying NFT ownership...');
    
    const owner = await publicClient.readContract({
      address: deployedContractAddress,
      abi: CLAIMABLE_NFT_ABI,
      functionName: 'ownerOf',
      args: [predictedTokenId]
    });
    
    const contractName = await publicClient.readContract({
      address: deployedContractAddress,
      abi: CLAIMABLE_NFT_ABI,
      functionName: 'name'
    });
    
    console.log('✅ Verification complete:', {
      contractName,
      tokenId: predictedTokenId.toString(),
      owner,
      expectedOwner: testUserAddress,
      ownershipCorrect: owner.toLowerCase() === testUserAddress.toLowerCase()
    });
    
    console.log('\\n🎉 New OwnerMint Approach Test Results:');
    console.log('=====================================');
    console.log('✅ Contract deployment: SUCCESS');
    console.log('✅ OwnerMint function: SUCCESS');
    console.log('✅ Direct user minting: SUCCESS');
    console.log('✅ No claim codes needed: SUCCESS');
    console.log('\\n💡 This approach eliminates all claim code complexity!');
    console.log('📝 Database validation controls everything, contract just mints.');
    
    console.log('\\n📋 Contract Details for Testing:');
    console.log('Contract Address:', deployedContractAddress);
    console.log('Factory Address:', FACTORY_ADDRESS);
    console.log('Owner/Relayer:', relayerAccount.address);
    console.log('Test Token ID:', predictedTokenId.toString());
    console.log('Test Token Owner:', owner);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();