const { ethers } = require('ethers');
require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testGaslessClaimableNFT() {
  console.log('🧪 Testing gasless claimable NFT deployment...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    const testData = {
      type: 'deployClaimableNFT',
      name: 'Test Claimable NFT',
      symbol: 'TEST',
      baseTokenURI: 'https://ipfs.io/ipfs/',
      userAddress: process.env.NEXT_PUBLIC_ADMIN_WALLET,
      chainId: 84532 // Base Sepolia
    };
    
    console.log('📋 Request data:', testData);
    console.log('🌐 Testing endpoint: http://localhost:3001/api/gasless-relay');
    
    const response = await fetch('http://localhost:3001/api/gasless-relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (!response.ok) {
      console.error('❌ Request failed:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (parseError) {
        console.error('❌ Could not parse error response as JSON');
      }
      return;
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log('✅ Deployment successful:', result);
      
      if (result.contractAddress) {
        console.log('🎉 New claimable NFT contract deployed at:', result.contractAddress);
      }
    } catch (parseError) {
      console.error('❌ Could not parse success response as JSON:', parseError);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testGaslessClaimableNFT();