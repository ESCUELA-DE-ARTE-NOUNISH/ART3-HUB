const { ethers } = require('ethers');
require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testContractClaimCode() {
  console.log('🧪 Testing claim code validation on contract...');
  
  try {
    const contractAddress = '0xcfb1b16b0b71e5e68991108f90806b6441e15eee'; // Latest deployed contract with relayer owner
    const claimCode = 'ADMIN123';
    const userAddress = '0x742d35Cc6644C84532e5568a2a2f5E6a5b4C0123'.toLowerCase(); // Fix checksum
    
    // Connect to Base Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
    
    // ClaimableNFT ABI
    const claimableNFTABI = [
      {
        "inputs": [
          {"name": "claimCode", "type": "string"},
          {"name": "user", "type": "address"}
        ],
        "name": "validateClaimCode",
        "outputs": [
          {"name": "valid", "type": "bool"},
          {"name": "message", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"name": "claimCode", "type": "string"}],
        "name": "claimNFT",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    const contract = new ethers.Contract(contractAddress, claimableNFTABI, provider);
    
    console.log('📍 Contract address:', contractAddress);
    console.log('🔑 Claim code:', claimCode);
    console.log('👤 User address:', userAddress);
    
    // Test claim code validation
    console.log('\n🔍 Testing claim code validation...');
    try {
      const validation = await contract.validateClaimCode(claimCode, userAddress);
      console.log('✅ Validation result:', {
        valid: validation[0],
        message: validation[1]
      });
      
      if (!validation[0]) {
        console.log('❌ Claim code is not valid:', validation[1]);
      } else {
        console.log('✅ Claim code is valid!');
      }
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    }
    
    // Let's also try to check the contract's owner and basic info
    console.log('\n🔍 Getting contract info...');
    try {
      // Try to get contract owner
      const ownerABI = [
        {
          "inputs": [],
          "name": "owner",
          "outputs": [{"name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        }
      ];
      
      const ownerContract = new ethers.Contract(contractAddress, ownerABI, provider);
      const owner = await ownerContract.owner();
      console.log('👑 Contract owner:', owner);
      
    } catch (error) {
      console.log('⚠️ Could not get contract owner:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testContractClaimCode();