require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testEditExistingNFT() {
  console.log('🧪 Testing NFT edit functionality on existing NFT...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // Use one of the NFT IDs we created earlier
    const nftId = 'mdae0nx2rlgn603qq6l'; // From our previous UI fix test
    
    console.log('📝 Testing edit functionality on NFT:', nftId);
    
    // Create a different test image (orange pixel PNG)
    const orangePixelBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5AfDwAFAAH/VscHYwAAAABJRU5ErkJggg==';
    
    const editData = {
      title: 'UI Fix Test NFT - EDITED VERSION',
      description: 'This NFT has been successfully edited with a new orange image to test the update functionality',
      claimCode: 'UIFIX456', // Keep same claim code
      startDate: '2025-07-19T15:12:49.180Z', // Keep original start date  
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // Extend to 10 days
      status: 'published',
      maxClaims: 50, // Increase max claims
      network: 'base-sepolia',
      image: orangePixelBase64 // New orange image!
    };
    
    console.log('📋 Edit data:', {
      ...editData,
      image: editData.image.substring(0, 50) + '...' // Truncate for display
    });
    
    const editResponse = await fetch(`http://localhost:3001/api/admin/nfts/${nftId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001'
      },
      body: JSON.stringify(editData)
    });
    
    const editResponseText = await editResponse.text();
    
    if (!editResponse.ok) {
      console.error('❌ Edit request failed:', {
        status: editResponse.status,
        statusText: editResponse.statusText
      });
      
      try {
        const errorData = JSON.parse(editResponseText);
        console.error('❌ Edit error details:', errorData);
      } catch (parseError) {
        console.error('❌ Raw edit error response:', editResponseText);
      }
      return;
    }
    
    try {
      const editResult = JSON.parse(editResponseText);
      console.log('✅ NFT edit test successful!');
      console.log('📄 Edit response summary:', {
        nftId: editResult.nft?.id,
        title: editResult.nft?.title,
        status: editResult.nft?.status,
        maxClaims: editResult.nft?.maxClaims,
        hasImage: !!editResult.nft?.image,
        hasImageUrl: !!editResult.nft?.imageUrl,
        newImageUrl: editResult.nft?.imageUrl,
        contractRedeployment: !!editResult.contractRedeployment
      });
      
      // Check if the image was properly updated
      if (editResult.nft?.image && editResult.nft?.imageUrl) {
        console.log('🎉 SUCCESS: Image fields are populated after edit!');
        console.log('🖼️ New image path:', editResult.nft.image);
        console.log('🔗 New image URL:', editResult.nft.imageUrl);
        
        // Check if it looks like a new image (different timestamp)
        if (editResult.nft.imageUrl.includes('admin-upload-')) {
          console.log('✅ Confirmed: New image was uploaded (contains upload timestamp)');
        }
      } else {
        console.log('❌ ISSUE: Image fields missing after edit');
        console.log('   - Has image field:', !!editResult.nft?.image);
        console.log('   - Has imageUrl field:', !!editResult.nft?.imageUrl);
      }
      
      if (editResult.contractRedeployment) {
        console.log('🔄 Contract redeployment triggered:', editResult.contractRedeployment);
      }
      
    } catch (parseError) {
      console.error('❌ Could not parse edit response as JSON:', parseError);
      console.error('Raw edit response:', editResponseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testEditExistingNFT();