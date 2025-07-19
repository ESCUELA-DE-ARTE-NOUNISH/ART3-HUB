require('dotenv').config({ path: '../ArtHubApp/.env' });

async function testEditNFT() {
  console.log('🧪 Testing NFT edit functionality with image processing...');
  
  try {
    // Use dynamic import for fetch
    const fetch = (await import('node-fetch')).default;
    
    // First, let's create an NFT to edit
    const greenPixelBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const createData = {
      title: 'Edit Test NFT - Original',
      description: 'This NFT will be edited to test the update functionality',
      claimCode: 'EDITEST789',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      status: 'published',
      maxClaims: 15,
      network: 'base-sepolia',
      image: greenPixelBase64
    };
    
    console.log('📝 Step 1: Creating NFT to edit...');
    const createResponse = await fetch('http://localhost:3001/api/admin/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'host': 'localhost:3001'
      },
      body: JSON.stringify(createData)
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create NFT: ${createResponse.status}`);
    }
    
    const createResult = await createResponse.json();
    const nftId = createResult.nft?.id;
    
    if (!nftId) {
      throw new Error('NFT creation did not return an ID');
    }
    
    console.log('✅ NFT created successfully:', {
      id: nftId,
      title: createResult.nft?.title,
      originalImage: createResult.nft?.image,
      originalImageUrl: createResult.nft?.imageUrl
    });
    
    // Wait a moment to ensure the creation is complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now edit the NFT with a new image and other changes
    console.log('📝 Step 2: Editing NFT with new image...');
    
    // Create a different test image (purple pixel PNG)
    const purplePixelBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhAGAhKmMIQAAAABJRU5ErkJggg==';
    
    const editData = {
      title: 'Edit Test NFT - UPDATED',
      description: 'This NFT has been successfully edited with a new image',
      claimCode: 'EDITEST789', // Keep same claim code
      startDate: createData.startDate, // Keep same start date  
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Extend to 7 days
      status: 'published',
      maxClaims: 30, // Increase max claims
      network: 'base-sepolia',
      image: purplePixelBase64 // New image!
    };
    
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
        
        // Verify the image URLs are different (new image was uploaded)
        if (editResult.nft.imageUrl !== createResult.nft?.imageUrl) {
          console.log('✅ Confirmed: New image was uploaded (URLs are different)');
        } else {
          console.log('⚠️ Warning: Image URL seems to be the same as before');
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

testEditNFT();