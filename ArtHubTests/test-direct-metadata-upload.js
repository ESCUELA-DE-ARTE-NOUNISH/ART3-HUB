#!/usr/bin/env node

/**
 * Test direct metadata upload to isolate the issue
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testDirectMetadataUpload() {
  console.log('🧪 TESTING DIRECT METADATA UPLOAD');
  console.log('==================================');
  console.log('');

  try {
    // Test 1: Create metadata with a mock IPFS image URL to see if basic metadata upload works
    console.log('📊 Test 1: Testing basic metadata upload with mock IPFS URL...');
    
    const basicMetadata = {
      name: 'Test NFT Basic',
      description: 'Testing basic metadata upload',
      image: 'https://gateway.pinata.cloud/ipfs/QmTestHash123',
      attributes: [
        { trait_type: 'Test', value: 'Basic' }
      ]
    };

    const basicResponse = await fetch(`${BASE_URL}/api/upload-metadata-to-pinata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metadata: basicMetadata,
        name: 'test-basic-metadata'
      })
    });

    const basicResult = await basicResponse.json();
    
    if (basicResponse.ok) {
      console.log('✅ Basic metadata upload successful:', basicResult.IpfsHash);
      
      // Verify the uploaded metadata
      const verifyResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${basicResult.IpfsHash}`);
      const verifyData = await verifyResponse.json();
      console.log('📄 Retrieved basic metadata:', verifyData);
    } else {
      console.log('❌ Basic metadata upload failed:', basicResult);
    }

    // Test 2: Test the image conversion flow
    console.log('\n📊 Test 2: Testing image conversion and metadata upload...');
    
    const firebaseImageUrl = 'https://firebasestorage.googleapis.com/v0/b/art3-hub-78ef8.firebasestorage.app/o/admin-nft-images%2F0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f%2F1752952197241-admin-upload-1752952197241.jpeg?alt=media&token=12466fab-dcf2-4b6f-9d70-bd4190be9fd1';
    
    console.log('🔄 Step 1: Download image from Firebase Storage...');
    const imageResponse = await fetch(firebaseImageUrl);
    
    if (!imageResponse.ok) {
      console.log('❌ Failed to download image:', imageResponse.status, imageResponse.statusText);
      return;
    }
    
    console.log('✅ Image download successful:', {
      contentType: imageResponse.headers.get('content-type'),
      contentLength: imageResponse.headers.get('content-length')
    });

    // Convert to blob and then to File
    const imageBlob = await imageResponse.blob();
    const imageFile = new File([imageBlob], 'test-image.jpg', { 
      type: imageBlob.type || 'image/jpeg' 
    });
    
    console.log('📁 Image file created:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });

    // Test 3: Upload image to Pinata
    console.log('\n📊 Test 3: Testing image upload to Pinata...');
    
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('name', 'test-image-upload');

    const imageUploadResponse = await fetch(`${BASE_URL}/api/upload-to-pinata`, {
      method: 'POST',
      body: formData
    });

    const imageUploadResult = await imageUploadResponse.json();
    
    if (imageUploadResponse.ok) {
      console.log('✅ Image upload to IPFS successful:', imageUploadResult.IpfsHash);
      
      const ipfsImageUrl = `https://gateway.pinata.cloud/ipfs/${imageUploadResult.IpfsHash}`;
      console.log('🔗 IPFS Image URL:', ipfsImageUrl);
      
      // Test 4: Create metadata with the IPFS image URL
      console.log('\n📊 Test 4: Creating metadata with IPFS image URL...');
      
      const ipfsMetadata = {
        name: 'Test NFT with IPFS Image',
        description: 'Testing metadata with IPFS image URL',
        image: ipfsImageUrl,
        attributes: [
          { trait_type: 'Test', value: 'IPFS' },
          { trait_type: 'Source', value: 'Converted from Firebase' }
        ]
      };

      const ipfsMetadataResponse = await fetch(`${BASE_URL}/api/upload-metadata-to-pinata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metadata: ipfsMetadata,
          name: 'test-ipfs-metadata'
        })
      });

      const ipfsMetadataResult = await ipfsMetadataResponse.json();
      
      if (ipfsMetadataResponse.ok) {
        console.log('✅ IPFS metadata upload successful:', ipfsMetadataResult.IpfsHash);
        
        // Verify the final metadata
        const finalVerifyResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsMetadataResult.IpfsHash}`);
        const finalVerifyData = await finalVerifyResponse.json();
        console.log('🎉 Final metadata with IPFS image:');
        console.log(JSON.stringify(finalVerifyData, null, 2));
        
        console.log('\n🎯 SUCCESS: Complete flow working!');
        console.log('   - Downloaded image from Firebase Storage ✅');
        console.log('   - Uploaded image to IPFS ✅');
        console.log('   - Created metadata with IPFS image URL ✅');
        console.log('   - Uploaded metadata to IPFS ✅');
        
      } else {
        console.log('❌ IPFS metadata upload failed:', ipfsMetadataResult);
      }
      
    } else {
      console.log('❌ Image upload to IPFS failed:', imageUploadResult);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Add a simple polyfill for File and FormData if not available in Node.js
if (typeof File === 'undefined') {
  global.File = class File {
    constructor(chunks, filename, options = {}) {
      this.chunks = chunks;
      this.name = filename;
      this.type = options.type || '';
      this.size = chunks.reduce((size, chunk) => size + (chunk.length || chunk.size || 0), 0);
    }
  };
  
  global.FormData = require('form-data');
}

// Run the test
testDirectMetadataUpload().catch(console.error);