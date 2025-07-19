#!/usr/bin/env node

/**
 * Test Pinata configuration and IPFS upload
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testPinataConfig() {
  console.log('🧪 TESTING PINATA CONFIGURATION');
  console.log('==============================');
  console.log('🎯 Target URL:', BASE_URL);
  console.log('');

  try {
    // Test 1: Check if Pinata file upload endpoint is working
    console.log('📊 Test 1: Testing Pinata file upload endpoint...');
    
    // Create a simple test file
    const testFile = new File(['Hello IPFS!'], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('name', 'test-file');

    try {
      const uploadResponse = await fetch(`${BASE_URL}/api/upload-to-pinata`, {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      
      if (uploadResponse.ok) {
        console.log('✅ Pinata file upload working!');
        console.log('📋 Result:', uploadResult);
      } else {
        console.log('❌ Pinata file upload failed:', uploadResult);
      }
    } catch (uploadError) {
      console.log('❌ File upload test failed:', uploadError.message);
    }

    // Test 2: Check if Pinata metadata upload endpoint is working
    console.log('\n📊 Test 2: Testing Pinata metadata upload endpoint...');
    
    const testMetadata = {
      name: 'Test NFT',
      description: 'Test metadata upload',
      image: 'https://example.com/test.jpg',
      attributes: [
        { trait_type: 'Test', value: 'Value' }
      ]
    };

    try {
      const metadataResponse = await fetch(`${BASE_URL}/api/upload-metadata-to-pinata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metadata: testMetadata,
          name: 'test-metadata'
        })
      });

      const metadataResult = await metadataResponse.json();
      
      if (metadataResponse.ok) {
        console.log('✅ Pinata metadata upload working!');
        console.log('📋 Result:', metadataResult);
        
        // Try to fetch the uploaded metadata
        if (metadataResult.IpfsHash) {
          console.log('\n📊 Verifying uploaded metadata...');
          const verifyResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`);
          const verifyData = await verifyResponse.json();
          console.log('📄 Retrieved metadata:', verifyData);
        }
      } else {
        console.log('❌ Pinata metadata upload failed:', metadataResult);
      }
    } catch (metadataError) {
      console.log('❌ Metadata upload test failed:', metadataError.message);
    }

    // Test 3: Check environment variables visibility
    console.log('\n📊 Test 3: Checking environment configuration...');
    
    // Check if the Next.js public variable is set
    const publicKeyCheck = await fetch(`${BASE_URL}/api/test-env`, {
      method: 'GET'
    }).catch(() => null);
    
    if (publicKeyCheck) {
      const envResult = await publicKeyCheck.json().catch(() => null);
      if (envResult) {
        console.log('📋 Environment check result:', envResult);
      }
    } else {
      console.log('⚠️ No environment check endpoint available');
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Add a simple polyfill for File if not available in Node.js
if (typeof File === 'undefined') {
  global.File = class File {
    constructor(chunks, filename, options = {}) {
      this.chunks = chunks;
      this.name = filename;
      this.type = options.type || '';
      this.size = chunks.reduce((size, chunk) => size + chunk.length, 0);
    }
  };
  
  global.FormData = require('form-data');
}

// Run the test
testPinataConfig().catch(console.error);