require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testFirebaseDirect() {
  console.log('🧪 Testing direct Firebase access for claimable NFTs...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Query admin API to get all claimable NFTs
    console.log('📋 Querying admin API for all claimable NFTs...');
    
    const response = await fetch('http://localhost:3001/api/admin/nfts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001'
      }
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Admin API request failed:', {
        status: response.status,
        statusText: response.statusText
      });
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (parseError) {
        console.error('❌ Raw error response:', responseText.substring(0, 300));
      }
      return;
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log('✅ Firebase query successful!');
      console.log('📄 Found NFTs:', result.nfts ? result.nfts.length : 'No nfts property');
      
      if (result.nfts && result.nfts.length > 0) {
        result.nfts.forEach((nft, index) => {
          console.log(`\n🔍 NFT ${index + 1}:`, {
            id: nft.id,
            title: nft.title,
            claimCode: nft.claimCode,
            status: nft.status,
            contractAddress: nft.contractAddress,
            network: nft.network,
            maxClaims: nft.maxClaims,
            currentClaims: nft.currentClaims
          });
        });
        
        // Test a specific claim code from the results
        if (result.nfts.length > 0) {
          const testNFT = result.nfts[0];
          console.log(`\n🎯 Testing claim code verification for: ${testNFT.claimCode}`);
          
          const verifyResponse = await fetch(`http://localhost:3001/api/nfts/claim?code=${testNFT.claimCode}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-wallet-address': '0x499D377eF114cC1BF7798cECBB38412701400daF',
              'host': 'localhost:3001'
            }
          });
          
          const verifyText = await verifyResponse.text();
          const verifyResult = JSON.parse(verifyText);
          
          console.log('📋 Verification result:', {
            valid: verifyResult.valid,
            message: verifyResult.message,
            nftTitle: verifyResult.nft?.title
          });
        }
      } else {
        console.log('⚠️ No claimable NFTs found in database');
      }
      
    } catch (parseError) {
      console.error('❌ Could not parse response as JSON:', parseError);
      console.error('Raw response:', responseText.substring(0, 300));
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFirebaseDirect();