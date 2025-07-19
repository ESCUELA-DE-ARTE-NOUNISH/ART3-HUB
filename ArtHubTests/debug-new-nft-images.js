#!/usr/bin/env node

/**
 * Debug script to check what image URLs are being stored for NFTs
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_WALLET = '0x499D377eF114cC1BF7798cECBB38412701400daF';

async function debugNFTImages() {
  console.log('🖼️ DEBUGGING NFT IMAGE URLS');
  console.log('===========================');
  console.log('🎯 Target wallet:', TEST_WALLET);
  console.log('');

  try {
    // Get NFTs from /my-nfts API
    console.log('📊 Checking NFTs in /my-nfts...');
    const response = await fetch(`${BASE_URL}/api/nfts?wallet_address=${TEST_WALLET}`);
    const data = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('🔢 NFT Count:', data.nfts?.length || 0);
    
    if (data.nfts && data.nfts.length > 0) {
      console.log('');
      console.log('📋 NFT IMAGE ANALYSIS:');
      console.log('======================');
      
      data.nfts.forEach((nft, index) => {
        console.log(`\n${index + 1}. "${nft.name}"`);
        console.log(`   ID: ${nft.id}`);
        console.log(`   image_ipfs_hash: "${nft.image_ipfs_hash}"`);
        console.log(`   metadata_ipfs_hash: "${nft.metadata_ipfs_hash || 'None'}"`);
        console.log(`   contract_address: ${nft.contract_address || 'None'}`);
        console.log(`   created_at: ${nft.created_at || 'None'}`);
        
        // Check if it's a placeholder IPFS hash
        if (nft.image_ipfs_hash === 'QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L') {
          console.log(`   🚨 USING PLACEHOLDER IPFS HASH!`);
          console.log(`   🔧 Needs Firebase Storage URL resolution`);
        } else {
          console.log(`   ✅ Valid IPFS hash`);
          console.log(`   🌐 Will display: https://gateway.pinata.cloud/ipfs/${nft.image_ipfs_hash}`);
        }
      });
      
      // Check claimable NFTs to see what image URLs are stored there
      console.log('\n\n📊 Checking claimable NFTs for image sources...');
      const adminResponse = await fetch(`${BASE_URL}/api/admin/nfts`);
      const adminData = await adminResponse.json();
      
      if (adminData.nfts && adminData.nfts.length > 0) {
        console.log('\n📋 CLAIMABLE NFT IMAGE SOURCES:');
        console.log('==============================');
        
        adminData.nfts.forEach((nft, index) => {
          console.log(`\n${index + 1}. "${nft.title}"`);
          console.log(`   ID: ${nft.id}`);
          console.log(`   imageUrl: "${nft.imageUrl || 'None'}"`);
          console.log(`   image: "${nft.image || 'None'}"`);
          console.log(`   status: ${nft.status}`);
          console.log(`   currentClaims: ${nft.currentClaims || 0}`);
          
          if (nft.imageUrl && nft.imageUrl.includes('firebasestorage.googleapis.com')) {
            console.log(`   📦 Firebase Storage URL detected`);
          } else if (nft.imageUrl && nft.imageUrl.includes('ipfs')) {
            console.log(`   🌐 IPFS URL detected`);
          } else {
            console.log(`   ❓ Unknown URL format`);
          }
        });
      }
      
    } else {
      console.log('❌ No NFTs found for this wallet');
    }
    
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }
}

// Run the debug analysis
debugNFTImages().catch(console.error);