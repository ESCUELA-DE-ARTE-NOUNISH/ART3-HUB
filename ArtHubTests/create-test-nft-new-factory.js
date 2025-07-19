#!/usr/bin/env node

/**
 * Create a test NFT using the new factory (with ownerMint function)
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function createTestNFT() {
  console.log('🧪 Creating Test NFT with New Factory (ownerMint support)');
  console.log('=========================================================');
  
  const testNFTData = {
    title: 'TestOwnerMint',
    description: 'Test NFT for ownerMint functionality',
    claimCode: 'TestOwnerMint123',
    startDate: new Date().toISOString(),
    endDate: null,
    status: 'published', // This will deploy via new factory
    maxClaims: 0,
    network: 'baseSepolia',
    image: 'https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=TestOwnerMint'
  };
  
  console.log('📋 NFT Data:', testNFTData);
  
  try {
    // Create the NFT via admin API
    console.log('🚀 Creating NFT via admin API...');
    
    const response = await fetch(`${BASE_URL}/api/admin/nfts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add admin authentication headers if needed
        'Cookie': 'admin=true' // Mock admin auth
      },
      body: JSON.stringify(testNFTData)
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to create NFT:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ NFT created successfully!');
    console.log('📊 Result:', {
      nftId: result.nft?.id,
      contractAddress: result.nft?.contractAddress,
      claimCode: result.nft?.claimCode,
      deploymentTx: result.contractDeployment?.txHash
    });
    
    if (result.nft?.contractAddress) {
      console.log('\\n🎯 This NFT can now be tested with ownerMint approach!');
      console.log('🔗 Contract Address:', result.nft.contractAddress);
      console.log('🎫 Claim Code:', result.nft.claimCode);
      console.log('\\n💡 Test by going to /mint page and entering claim code:', result.nft.claimCode);
    }
    
  } catch (error) {
    console.error('❌ Error creating test NFT:', error.message);
  }
}

createTestNFT();