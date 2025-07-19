require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testNewCode() {
  console.log('🧪 Testing with a completely new code...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Test with a completely new code that hasn't been used
    const testPayload = {
      claimCode: 'FRESHCODE2025'
    };
    
    console.log('📋 Testing with fresh code:', testPayload);
    
    const response = await fetch('http://localhost:3000/api/nfts/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': '0x499D377eF114cC1BF7798cECBB38412701400daF',
        'host': 'localhost:3000'
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
      console.log('📄 Response:', result);
    } catch (parseError) {
      console.error('❌ Could not parse response as JSON:', parseError);
      console.error('Raw response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testNewCode();