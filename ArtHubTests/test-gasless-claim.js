require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testGaslessClaim() {
  console.log('🧪 Testing gasless NFT claim directly...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Test the exact payload that the claim API would send
    const testPayload = {
      type: 'claimNFT',
      contractAddress: '0xd039d8c65ed1b735463e872d180d6a295d3b00a0', // From the error log
      claimCode: 'Nadidad2025',
      userAddress: '0x499D377eF114cC1BF7798cECBB38412701400daF', // From the error log
      chainId: 84532 // Base Sepolia
    };
    
    console.log('📋 Testing gasless relay with payload:', testPayload);
    
    const response = await fetch('http://localhost:3001/api/gasless-relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001'
      },
      body: JSON.stringify(testPayload)
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Gasless relay failed:', {
        status: response.status,
        statusText: response.statusText
      });
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (parseError) {
        console.error('❌ Raw error response:', responseText);
      }
      return;
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log('✅ Gasless claim test successful!');
      console.log('📄 Response:', result);
    } catch (parseError) {
      console.error('❌ Could not parse success response as JSON:', parseError);
      console.error('Raw response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testGaslessClaim();