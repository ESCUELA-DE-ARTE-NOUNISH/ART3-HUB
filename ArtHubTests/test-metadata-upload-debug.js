#!/usr/bin/env node

/**
 * Test metadata upload with detailed debugging
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function createAndTestNFT() {
  console.log('🧪 TESTING METADATA UPLOAD WITH DEBUGGING');
  console.log('==========================================');
  console.log('🎯 Target URL:', BASE_URL);
  console.log('');

  try {
    // Create a new claimable NFT to trigger metadata upload
    console.log('📊 Creating new claimable NFT with Firebase Storage image...');
    
    const claimCode = `DEBUG-TEST-${Date.now()}`;
    
    const firebaseImageUrl = 'https://firebasestorage.googleapis.com/v0/b/art3-hub-78ef8.firebasestorage.app/o/admin-nft-images%2F0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f%2F1752952197241-admin-upload-1752952197241.jpeg?alt=media&token=12466fab-dcf2-4b6f-9d70-bd4190be9fd1';
    
    const nftData = {
      title: 'Debug Test NFT',
      description: 'Testing metadata upload with debugging',
      claimCode: claimCode,
      startDate: new Date().toISOString(),
      endDate: null,
      status: 'published',
      maxClaims: 5,
      network: 'baseSepolia',
      image: firebaseImageUrl  // Use 'image' instead of 'imageUrl' as expected by admin API
    };

    console.log('🔗 Image URL to convert:', firebaseImageUrl.substring(0, 80) + '...');

    const createResponse = await fetch(`${BASE_URL}/api/admin/nfts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nftData)
    });

    const createResult = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('❌ Failed to create NFT:', createResult);
      return;
    }

    console.log('✅ NFT created:', {
      id: createResult.nft?.id,
      title: createResult.nft?.title,
      metadataIpfsHash: createResult.nft?.metadataIpfsHash,
      imageIpfsHash: createResult.nft?.imageIpfsHash
    });

    // Check the metadata content
    if (createResult.nft?.metadataIpfsHash) {
      console.log('\n📊 Checking metadata content...');
      const metadataResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${createResult.nft.metadataIpfsHash}`);
      const metadata = await metadataResponse.json();
      
      console.log('📄 Metadata content:');
      console.log(JSON.stringify(metadata, null, 2));
      
      if (metadata.image.includes('ipfs')) {
        console.log('🎉 SUCCESS: Image field contains IPFS URL!');
      } else {
        console.log('⚠️ WARNING: Image field still contains Firebase Storage URL');
        console.log('💡 Check server logs for IPFS upload errors');
      }
    }

    console.log('\n✅ Test completed - check server logs for detailed error information');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
createAndTestNFT().catch(console.error);