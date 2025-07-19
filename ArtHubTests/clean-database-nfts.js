#!/usr/bin/env node

/**
 * Clean all claimable NFTs from Firebase database for fresh testing
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function cleanDatabase() {
  console.log('🧹 Cleaning Database - Deleting All Claimable NFTs');
  console.log('================================================');
  
  try {
    // First, get all NFTs to see what we're deleting
    console.log('📋 Step 1: Fetching all existing NFTs...');
    
    const getNFTsResponse = await fetch(`${BASE_URL}/api/admin/nfts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'admin=true' // Mock admin auth
      }
    });
    
    if (!getNFTsResponse.ok) {
      console.error('❌ Failed to fetch NFTs:', getNFTsResponse.status);
      return;
    }
    
    const nftsData = await getNFTsResponse.json();
    const nfts = nftsData.nfts || [];
    
    console.log(`📊 Found ${nfts.length} NFTs in database:`);
    nfts.forEach((nft, index) => {
      console.log(`   ${index + 1}. ${nft.title} (${nft.claimCode}) - Contract: ${nft.contractAddress || 'None'}`);
    });
    
    if (nfts.length === 0) {
      console.log('✅ Database is already clean - no NFTs to delete');
      return;
    }
    
    // Note: We would need a DELETE API endpoint to actually delete NFTs
    // For now, let's create a comprehensive logging system for testing
    
    console.log('\\n📝 Note: To fully clean the database, you would need to:');
    console.log('1. Add a DELETE endpoint to /api/admin/nfts/[id]');
    console.log('2. Or manually delete from Firebase console');
    console.log('3. Or create a Firebase admin script');
    
    console.log('\\n🔍 For fresh testing, I recommend:');
    console.log('1. Create new NFTs with unique claim codes');
    console.log('2. Test the new ownerMint approach');
    console.log('3. Monitor the comprehensive logs we\\'ve added');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
  }
}

cleanDatabase();