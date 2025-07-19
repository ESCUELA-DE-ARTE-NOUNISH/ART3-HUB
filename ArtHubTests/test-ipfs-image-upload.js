#!/usr/bin/env node

/**
 * Test IPFS image upload functionality
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const ADMIN_WALLET = '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f';

async function testIPFSImageUpload() {
  console.log('🧪 TESTING IPFS IMAGE UPLOAD FUNCTIONALITY');
  console.log('==========================================');
  console.log('🎯 Target URL:', BASE_URL);
  console.log('');

  try {
    // Step 1: Create a new claimable NFT
    console.log('📊 Step 1: Creating new claimable NFT...');
    
    const claimCode = `IPFS-TEST-${Date.now()}`;
    
    const nftData = {
      title: 'IPFS Image Test NFT',
      description: 'Testing IPFS image upload functionality',
      claimCode: claimCode,
      startDate: new Date().toISOString(),
      endDate: null,
      status: 'published',
      maxClaims: 10,
      network: 'baseSepolia',
      // Use an existing Firebase Storage URL to test conversion
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/art3-hub-78ef8.firebasestorage.app/o/admin-nft-images%2F0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f%2F1752952197241-admin-upload-1752952197241.jpeg?alt=media&token=12466fab-dcf2-4b6f-9d70-bd4190be9fd1'
    };

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

    console.log('✅ NFT created successfully:', {
      id: createResult.nft?.id,
      title: createResult.nft?.title,
      metadataIpfsHash: createResult.nft?.metadataIpfsHash
    });

    // Step 2: Check if metadata was uploaded to IPFS
    if (createResult.nft?.metadataIpfsHash) {
      console.log('\n📊 Step 2: Checking IPFS metadata...');
      console.log('🔗 Metadata IPFS Hash:', createResult.nft.metadataIpfsHash);
      
      try {
        const metadataResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${createResult.nft.metadataIpfsHash}`);
        const metadata = await metadataResponse.json();
        
        console.log('📄 Metadata Content:');
        console.log(JSON.stringify(metadata, null, 2));
        
        // Check if image field contains IPFS URL
        if (metadata.image && metadata.image.includes('ipfs')) {
          console.log('🎉 SUCCESS: Image field contains IPFS URL!');
          console.log('🔗 Image URL:', metadata.image);
        } else if (metadata.image && metadata.image.includes('firebasestorage.googleapis.com')) {
          console.log('⚠️ WARNING: Image field still contains Firebase Storage URL');
          console.log('🔗 Image URL:', metadata.image);
          console.log('💡 This means the IPFS image upload is not working correctly');
        } else {
          console.log('❌ ERROR: Image field has unexpected content');
          console.log('🔗 Image URL:', metadata.image);
        }
        
        // Also check if imageIpfsHash was stored in the NFT record
        if (createResult.nft.imageIpfsHash) {
          console.log('✅ Image IPFS hash stored in NFT record:', createResult.nft.imageIpfsHash);
        } else {
          console.log('⚠️ No image IPFS hash stored in NFT record');
        }
        
      } catch (metadataError) {
        console.error('❌ Failed to fetch metadata from IPFS:', metadataError.message);
      }
    } else {
      console.log('⚠️ No metadata IPFS hash found - metadata not uploaded');
    }

    // Step 3: Test claiming this NFT to verify the full flow
    console.log('\n📊 Step 3: Testing NFT claim with IPFS metadata...');
    
    const testWallet = '0x499D377eF114cC1BF7798cECBB38412701400daF';
    
    const claimResponse = await fetch(`${BASE_URL}/api/claim-nft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        claimCode: claimCode,
        userWallet: testWallet
      })
    });

    const claimResult = await claimResponse.json();
    
    if (claimResponse.ok) {
      console.log('✅ NFT claimed successfully:', {
        txHash: claimResult.txHash,
        contractAddress: claimResult.contractAddress,
        tokenId: claimResult.tokenId
      });
      
      // Check the minted NFT's metadata URL
      if (claimResult.contractAddress && claimResult.tokenId !== undefined) {
        console.log('🔗 You can verify the NFT metadata on the blockchain explorer');
        console.log(`📊 Contract: ${claimResult.contractAddress}`);
        console.log(`🆔 Token ID: ${claimResult.tokenId}`);
      }
    } else {
      console.error('❌ Failed to claim NFT:', claimResult);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
testIPFSImageUpload().catch(console.error);