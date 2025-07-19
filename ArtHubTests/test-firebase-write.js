require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testFirebaseWrite() {
  console.log('🧪 Testing Firebase write operation directly...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Try to create a simple test document via a custom API endpoint
    console.log('📋 Testing simple Firebase write...');
    
    // First, let's see what the current server logs show for our recent test
    console.log('📋 Our recent test NFT ID was: mdah02cx9lzjot8mwqb');
    console.log('📋 Let\'s try to fetch it directly by ID...');
    
    const fetchResponse = await fetch('http://localhost:3001/api/admin/nfts/mdah02cx9lzjot8mwqb', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001'
      }
    });
    
    const fetchText = await fetchResponse.text();
    
    console.log('📄 Fetch by ID response status:', fetchResponse.status);
    
    if (fetchResponse.ok) {
      try {
        const result = JSON.parse(fetchText);
        console.log('✅ Found NFT by ID!', {
          id: result.id,
          title: result.title,
          claimCode: result.claimCode,
          status: result.status
        });
      } catch (parseError) {
        console.log('📄 Raw successful response:', fetchText.substring(0, 200));
      }
    } else {
      console.log('❌ NFT not found by ID');
      try {
        const errorData = JSON.parse(fetchText);
        console.log('❌ Error details:', errorData);
      } catch (parseError) {
        console.log('❌ Raw error response:', fetchText.substring(0, 200));
      }
    }
    
    // Also test the claim code that we just created
    console.log('\n🔍 Testing claim code verification for DIRECTTEST789...');
    
    const verifyResponse = await fetch('http://localhost:3001/api/nfts/claim?code=DIRECTTEST789', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': '0x499D377eF114cC1BF7798cECBB38412701400daF',
        'host': 'localhost:3001'
      }
    });
    
    const verifyText = await verifyResponse.text();
    const verifyResult = JSON.parse(verifyText);
    
    console.log('📋 Claim verification result:', {
      valid: verifyResult.valid,
      message: verifyResult.message,
      nftTitle: verifyResult.nft?.title
    });
    
    // If the NFT is found, this would prove the database save is working
    if (verifyResult.valid) {
      console.log('🎉 SUCCESS: NFT was saved to database and can be claimed!');
    } else {
      console.log('❌ CONFIRMED ISSUE: NFT was created but not saved to database');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFirebaseWrite();