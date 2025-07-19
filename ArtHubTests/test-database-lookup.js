require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testDatabaseLookup() {
  console.log('🧪 Testing database lookup for claimable NFTs...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Test database lookup via verification endpoint
    const testCodes = ['IMAGETEST123', 'UIFIX456', 'Nadidad2025'];
    
    for (const code of testCodes) {
      console.log(`\n🔍 Testing claim code: ${code}`);
      
      const response = await fetch(`http://localhost:3001/api/nfts/claim?code=${code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': '0x499D377eF114cC1BF7798cECBB38412701400daF',
          'host': 'localhost:3001'
        }
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error(`❌ Verification failed for ${code}:`, {
          status: response.status,
          statusText: response.statusText
        });
        
        try {
          const errorData = JSON.parse(responseText);
          console.error('❌ Error details:', errorData);
        } catch (parseError) {
          console.error('❌ Raw error response:', responseText.substring(0, 200));
        }
      } else {
        try {
          const result = JSON.parse(responseText);
          console.log(`📄 Verification result for ${code}:`, {
            valid: result.valid,
            message: result.message,
            nftTitle: result.nft?.title,
            nftId: result.nft?.id
          });
        } catch (parseError) {
          console.error('❌ Could not parse success response as JSON:', parseError);
          console.error('Raw response:', responseText.substring(0, 200));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testDatabaseLookup();