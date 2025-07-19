require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testUIImageFix() {
  console.log('🧪 Testing UI image fix - simulating form submission...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Create a different test image (small blue pixel PNG)
    const bluePixelBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    
    const testData = {
      title: 'UI Fix Test NFT',
      description: 'Testing the UI form fix for proper image storage',
      claimCode: 'UIFIX456',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      status: 'published', // This triggers contract deployment
      maxClaims: 25,
      network: 'base-sepolia',
      image: bluePixelBase64 // Test with base64 image from UI form
    };
    
    console.log('📋 Test data:', {
      ...testData,
      image: testData.image.substring(0, 50) + '...' // Truncate for display
    });
    console.log('🌐 Testing endpoint: http://localhost:3001/api/admin/nfts');
    
    const response = await fetch('http://localhost:3001/api/admin/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001'
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
      console.log('✅ UI image fix test successful!');
      console.log('📄 Response summary:', {
        nftId: result.nft?.id,
        title: result.nft?.title,
        status: result.nft?.status,
        contractAddress: result.nft?.contractAddress,
        deploymentTxHash: result.nft?.deploymentTxHash,
        hasImage: !!result.nft?.image,
        hasImageUrl: !!result.nft?.imageUrl,
        imageUrl: result.nft?.imageUrl,
        contractDeployment: !!result.contractDeployment
      });
      
      // Check specifically for the image fields that were previously empty
      if (result.nft?.image && result.nft?.imageUrl) {
        console.log('🎉 SUCCESS: Both image and imageUrl fields are populated!');
        console.log('🖼️ Image path:', result.nft.image);
        console.log('🔗 Image URL:', result.nft.imageUrl);
      } else {
        console.log('❌ ISSUE: Image fields still missing');
        console.log('   - Has image field:', !!result.nft?.image);
        console.log('   - Has imageUrl field:', !!result.nft?.imageUrl);
      }
      
    } catch (parseError) {
      console.error('❌ Could not parse success response as JSON:', parseError);
      console.error('Raw response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testUIImageFix();