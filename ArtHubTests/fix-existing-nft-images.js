#!/usr/bin/env node

/**
 * Fix existing NFT records to use Firebase Storage URLs instead of placeholder IPFS hashes
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_WALLET = '0x499D377eF114cC1BF7798cECBB38412701400daF';

async function fixExistingNFTImages() {
  console.log('🔧 FIXING EXISTING NFT IMAGE RECORDS');
  console.log('===================================');
  console.log('🎯 Target wallet:', TEST_WALLET);
  console.log('');

  try {
    // Step 1: Get claimable NFTs to find the correct image URLs
    console.log('📊 Step 1: Getting claimable NFT image sources...');
    const adminResponse = await fetch(`${BASE_URL}/api/admin/nfts`);
    const adminData = await adminResponse.json();
    
    if (!adminData.nfts || adminData.nfts.length === 0) {
      console.log('❌ No claimable NFTs found');
      return;
    }
    
    // Create a mapping of NFT names to their Firebase Storage URLs
    const imageUrlMap = new Map();
    adminData.nfts.forEach(nft => {
      if (nft.imageUrl && nft.imageUrl.includes('firebasestorage.googleapis.com')) {
        imageUrlMap.set(nft.title, nft.imageUrl);
        console.log(`✅ Found Firebase Storage URL for "${nft.title}"`);
      }
    });
    
    console.log(`📊 Found ${imageUrlMap.size} NFTs with Firebase Storage URLs`);
    
    // Step 2: Get current NFT records
    console.log('\n📊 Step 2: Getting current NFT records...');
    const nftResponse = await fetch(`${BASE_URL}/api/nfts?wallet_address=${TEST_WALLET}`);
    const nftData = await nftResponse.json();
    
    if (!nftData.nfts || nftData.nfts.length === 0) {
      console.log('❌ No NFT records found');
      return;
    }
    
    console.log(`📊 Found ${nftData.nfts.length} NFT records to check`);
    
    // Step 3: Update NFT records with correct image URLs
    let updatedCount = 0;
    
    for (const nft of nftData.nfts) {
      const correctImageUrl = imageUrlMap.get(nft.name);
      
      if (correctImageUrl && nft.image_ipfs_hash === 'QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L') {
        console.log(`\n🔧 Updating "${nft.name}"...`);
        console.log(`   Current image_ipfs_hash: ${nft.image_ipfs_hash}`);
        console.log(`   New image URL: ${correctImageUrl.substring(0, 80)}...`);
        
        try {
          // Update the NFT record
          const updateResponse = await fetch(`${BASE_URL}/api/nfts?id=${nft.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              image_ipfs_hash: correctImageUrl
            })
          });
          
          if (updateResponse.ok) {
            console.log(`   ✅ Successfully updated "${nft.name}"`);
            updatedCount++;
          } else {
            console.log(`   ❌ Failed to update "${nft.name}": ${updateResponse.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Error updating "${nft.name}": ${error.message}`);
        }
      } else if (correctImageUrl) {
        console.log(`\n✅ "${nft.name}" already has correct image URL`);
      } else {
        console.log(`\n⚠️ No Firebase Storage URL found for "${nft.name}"`);
      }
    }
    
    console.log(`\n🎉 FIXING COMPLETE!`);
    console.log(`📊 Updated ${updatedCount} NFT records`);
    console.log(`✅ All NFTs should now display correct images in /my-nfts`);
    
    // Step 4: Verify the fixes
    console.log('\n🔍 Step 4: Verifying fixes...');
    const verifyResponse = await fetch(`${BASE_URL}/api/nfts?wallet_address=${TEST_WALLET}`);
    const verifyData = await verifyResponse.json();
    
    console.log('\n📊 Updated NFT records:');
    verifyData.nfts?.forEach((nft, index) => {
      console.log(`\n${index + 1}. "${nft.name}"`);
      console.log(`   image_ipfs_hash: ${nft.image_ipfs_hash.substring(0, 80)}...`);
      
      if (nft.image_ipfs_hash.includes('firebasestorage.googleapis.com')) {
        console.log(`   🎉 SUCCESS: Now using Firebase Storage URL`);
      } else if (nft.image_ipfs_hash !== 'QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L') {
        console.log(`   ✅ GOOD: Using valid IPFS hash`);
      } else {
        console.log(`   ⚠️ WARNING: Still using placeholder hash`);
      }
    });
    
  } catch (error) {
    console.error('❌ Fix Error:', error.message);
  }
}

// Run the fix
fixExistingNFTImages().catch(console.error);