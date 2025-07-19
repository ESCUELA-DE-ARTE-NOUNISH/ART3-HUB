require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testClaimFromDeployedContract() {
  console.log('🧪 Testing NFT claim from deployed contract...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    const contractAddress = '0xcfb1b16b0b71e5e68991108f90806b6441e15eee'; // Latest contract with working claim code
    const claimCode = 'ADMIN123'; // From the previous test
    const userAddress = '0x742d35Cc6644C84532e5568a2a2f5E6a5b4C0123'; // Test user
    
    const testData = {
      type: 'claimNFT',
      contractAddress: contractAddress,
      claimCode: claimCode,
      userAddress: userAddress,
      chainId: 84532 // Base Sepolia
    };
    
    console.log('📋 Claim test data:', testData);
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
        statusText: response.statusText
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
      console.log('✅ NFT claim successful:', result);
      
      if (result.tokenId) {
        console.log('🎉 NFT claimed! Token ID:', result.tokenId);
        console.log('🔗 Transaction hash:', result.transactionHash);
        console.log('📍 Contract address:', contractAddress);
        console.log('👤 Owner:', userAddress);
      }
    } catch (parseError) {
      console.error('❌ Could not parse success response as JSON:', parseError);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testClaimFromDeployedContract();