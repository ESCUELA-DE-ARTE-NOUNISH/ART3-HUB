#!/usr/bin/env node

/**
 * Check if a specific contract has the ownerMint function
 */

const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');

const CONTRACT_ADDRESS = '0x830207fa235bdd635178ca2853cbbb2c31016ac7'; // Contract from error
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// ABI for ownerMint function
const OWNER_MINT_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "metadataURI", "type": "string"}
    ],
    "name": "ownerMint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function checkContract() {
  console.log('🔍 Checking if contract has ownerMint function...');
  console.log('Contract:', CONTRACT_ADDRESS);
  
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_SEPOLIA_RPC)
  });
  
  try {
    // Try to simulate ownerMint to see if function exists
    const testUser = '0x499D377eF114cC1BF7798cECBB38412701400daF';
    const testURI = 'https://test.com';
    
    await publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: OWNER_MINT_ABI,
      functionName: 'ownerMint',
      args: [testUser, testURI],
      account: '0x209D896f4Fd6C9c02deA6f7a70629236C1F027C1' // Relayer account
    });
    
    console.log('✅ Contract HAS ownerMint function - can use new approach');
    
  } catch (error) {
    if (error.message.includes('Function "ownerMint" not found')) {
      console.log('❌ Contract does NOT have ownerMint function');
      console.log('📝 This contract was deployed with the old factory');
      console.log('💡 Solutions:');
      console.log('   1. Create a new NFT (will use new factory with ownerMint)');
      console.log('   2. Continue using claim code approach for this NFT');
    } else {
      console.log('🔍 Function exists but simulation failed:', error.message);
      console.log('✅ This suggests ownerMint function is present');
    }
  }
}

checkContract();