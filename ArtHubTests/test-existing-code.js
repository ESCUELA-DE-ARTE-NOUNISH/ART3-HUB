require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testExistingCode() {
  console.log('🧪 Testing with existing claim code from recent deployment...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Test with existing code from recent deployment
    const testPayload = {
      claimCode: 'DIRECTTEST789' // From our successful test
    };
    
    console.log('📋 Testing with existing code:', testPayload);
    
    const response = await fetch('http://localhost:3001/api/nfts/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': '0x499D377eF114cC1BF7798cECBB38412701400daF',
        'host': 'localhost:3001'
      },
      body: JSON.stringify(testPayload)
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Request failed:', {
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
      console.log('✅ Claim successful!');
      console.log('📄 Response:', {
        success: result.success,
        txHash: result.txHash,
        tokenId: result.tokenId,
        contractAddress: result.contractAddress,
        message: result.message,
        nftTitle: result.nft?.title
      });
    } catch (parseError) {
      console.error('❌ Could not parse response as JSON:', parseError);
      console.error('Raw response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testExistingCode();