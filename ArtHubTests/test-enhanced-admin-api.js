require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testEnhancedAdminAPI() {
  console.log('🧪 Testing enhanced admin API with comprehensive logging...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Create a simple base64 test image (1x1 red pixel PNG)
    const redPixelBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
    
    const testData = {
      title: 'Image Storage Test NFT',
      description: 'Testing the fixed image storage with full URL',
      claimCode: 'IMAGETEST123',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      status: 'published', // This triggers contract deployment
      maxClaims: 50,
      network: 'base-sepolia',
      image: redPixelBase64 // Test base64 image upload
    };
    
    console.log('📋 Test data:', {
      ...testData,
      image: testData.image.substring(0, 50) + '...' // Truncate for display
    });
    console.log('🌐 Testing endpoint: http://localhost:3001/api/admin/nfts');
    console.log('🔐 Admin wallet:', process.env.NEXT_PUBLIC_ADMIN_WALLET);
    console.log('🏭 Factory address:', process.env.NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532);
    
    const response = await fetch('http://localhost:3001/api/admin/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001' // Ensure the correct host header
      },
      body: JSON.stringify(testData)
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
      console.log('✅ Enhanced admin API test successful!');
      console.log('📄 Response summary:', {
        nftId: result.nft?.id,
        title: result.nft?.title,
        status: result.nft?.status,
        contractAddress: result.nft?.contractAddress,
        deploymentTxHash: result.nft?.deploymentTxHash,
        hasImage: !!result.nft?.image,
        imageUrl: result.nft?.imageUrl,
        contractDeployment: !!result.contractDeployment
      });
      
      if (result.contractDeployment) {
        console.log('🎉 Contract deployment info:', result.contractDeployment);
      }
      
      if (result.nft?.imageUrl) {
        console.log('🖼️ Image successfully processed and stored:', result.nft.imageUrl);
      }
      
    } catch (parseError) {
      console.error('❌ Could not parse success response as JSON:', parseError);
      console.error('Raw response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testEnhancedAdminAPI();