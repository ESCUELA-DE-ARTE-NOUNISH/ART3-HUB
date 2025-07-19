require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testNFTServiceDirect() {
  console.log('🧪 Testing NFT creation service directly...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Try to create an NFT directly via admin API with minimal data
    console.log('📋 Creating minimal test NFT via admin API...');
    
    const testNFTData = {
      title: 'Test NFT Direct Service',
      description: 'Testing if NFT service saves to database',
      claimCode: 'DIRECTTEST789',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      status: 'published',
      maxClaims: 10,
      network: 'base-sepolia',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
    };
    
    console.log('🔍 Test NFT data:', {
      title: testNFTData.title,
      claimCode: testNFTData.claimCode,
      status: testNFTData.status,
      hasImage: !!testNFTData.image
    });
    
    const response = await fetch('http://localhost:3001/api/admin/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001'
      },
      body: JSON.stringify(testNFTData)
    });
    
    const responseText = await response.text();
    
    console.log('📄 Admin NFT creation response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ NFT creation failed:', {
        status: response.status,
        statusText: response.statusText
      });
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
      } catch (parseError) {
        console.error('❌ Raw error response:', responseText.substring(0, 500));
      }
      return;
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log('✅ NFT creation response received!');
      console.log('📄 Response summary:', {
        nftId: result.nft?.id,
        nftTitle: result.nft?.title,
        nftStatus: result.nft?.status,
        nftClaimCode: result.nft?.claimCode,
        contractAddress: result.nft?.contractAddress,
        hasDeployment: !!result.contractDeployment
      });
      
      // Now check if it was actually saved by querying the database immediately
      console.log('\n🔍 Verifying NFT was saved to database...');
      
      const verifyResponse = await fetch('http://localhost:3001/api/admin/nfts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'host': 'localhost:3001'
        }
      });
      
      const verifyText = await verifyResponse.text();
      const verifyResult = JSON.parse(verifyText);
      
      console.log('📋 Database verification:', {
        totalNFTs: Array.isArray(verifyResult) ? verifyResult.length : 'Not array',
        foundOurNFT: Array.isArray(verifyResult) ? 
          verifyResult.some(nft => nft.claimCode === testNFTData.claimCode) : false
      });
      
      if (Array.isArray(verifyResult)) {
        const ourNFT = verifyResult.find(nft => nft.claimCode === testNFTData.claimCode);
        if (ourNFT) {
          console.log('✅ SUCCESS: NFT found in database!', {
            id: ourNFT.id,
            title: ourNFT.title,
            claimCode: ourNFT.claimCode,
            status: ourNFT.status
          });
        } else {
          console.log('❌ FAILURE: NFT not found in database despite successful creation response');
          
          // Show all NFTs that exist for debugging
          console.log('📋 All NFTs in database:');
          verifyResult.forEach((nft, index) => {
            console.log(`  ${index + 1}. ${nft.title} (${nft.claimCode}) - ${nft.status}`);
          });
        }
      }
      
    } catch (parseError) {
      console.error('❌ Could not parse success response as JSON:', parseError);
      console.error('Raw response (first 500 chars):', responseText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testNFTServiceDirect();