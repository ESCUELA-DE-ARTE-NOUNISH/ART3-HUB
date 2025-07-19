#!/usr/bin/env node

/**
 * Debug script to investigate why claimed NFT doesn't show in /my-nfts
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_WALLET = '0x499D377eF114cC1BF7798cECBB38412701400daF'; // The wallet that claimed "Just Goku"

async function debugMyNFTsIssue() {
  console.log('🔍 DEBUGGING MY-NFT ISSUE');
  console.log('========================');
  console.log('🎯 Target wallet:', TEST_WALLET);
  console.log('📱 Expected NFT: "Just Goku" (JustGoku claim code)');
  console.log('');

  // Test 1: Check what the /my-nfts API returns
  console.log('📊 Step 1: Testing /my-nfts API endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/nfts?wallet_address=${TEST_WALLET}`);
    const data = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('📝 Response Data:', JSON.stringify(data, null, 2));
    console.log('🔢 NFT Count:', data.nfts?.length || 0);
    
    if (data.nfts && data.nfts.length > 0) {
      console.log('📋 Found NFTs:');
      data.nfts.forEach((nft, index) => {
        console.log(`   ${index + 1}. "${nft.name}" (${nft.id})`);
        console.log(`      - Contract: ${nft.contract_address || 'None'}`);
        console.log(`      - Token ID: ${nft.token_id || 'None'}`);
        console.log(`      - TX Hash: ${nft.transaction_hash || 'None'}`);
        console.log(`      - Network: ${nft.network || 'None'}`);
        console.log(`      - Created: ${nft.created_at || 'None'}`);
      });
    } else {
      console.log('❌ No NFTs found for this wallet');
    }
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }

  console.log('');

  // Test 2: Check admin NFTs to see what claimable NFTs exist
  console.log('📊 Step 2: Checking admin claimable NFTs...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/nfts`);
    const data = await response.json();
    
    console.log('✅ Admin API Status:', response.status);
    console.log('🔢 Claimable NFT Count:', data.nfts?.length || 0);
    
    if (data.nfts && data.nfts.length > 0) {
      console.log('📋 Found Claimable NFTs:');
      data.nfts.forEach((nft, index) => {
        console.log(`   ${index + 1}. "${nft.title}" (Code: ${nft.claimCode})`);
        console.log(`      - ID: ${nft.id}`);
        console.log(`      - Status: ${nft.status}`);
        console.log(`      - Contract: ${nft.contractAddress || 'None'}`);
        console.log(`      - Claims: ${nft.currentClaims || 0}/${nft.maxClaims || 'unlimited'}`);
        console.log(`      - Created: ${nft.createdAt || 'None'}`);
      });
      
      // Look for "Just Goku" specifically
      const justGoku = data.nfts.find(nft => 
        nft.title.toLowerCase().includes('goku') || 
        nft.claimCode.toLowerCase().includes('goku')
      );
      
      if (justGoku) {
        console.log('');
        console.log('🎯 Found "Just Goku" NFT:');
        console.log('   Title:', justGoku.title);
        console.log('   Claim Code:', justGoku.claimCode);
        console.log('   Contract:', justGoku.contractAddress);
        console.log('   Current Claims:', justGoku.currentClaims);
        console.log('   Status:', justGoku.status);
      } else {
        console.log('❌ "Just Goku" NFT not found in claimable NFTs');
      }
    }
  } catch (error) {
    console.error('❌ Admin API Error:', error.message);
  }

  console.log('');
  console.log('🔧 DIAGNOSIS & SOLUTION');
  console.log('=======================');
  console.log('');
  console.log('🔍 Root Cause Analysis:');
  console.log('   - Claimable NFTs are stored in CLAIMABLE_NFTS collection');
  console.log('   - /my-nfts page looks for NFTs in NFTS collection');
  console.log('   - When users claim, only claim record was created');
  console.log('   - Missing: NFT record for /my-nfts display');
  console.log('');
  console.log('✅ Solution Applied:');
  console.log('   - Updated processClaim() to create NFT record');
  console.log('   - New claims will appear in /my-nfts automatically');
  console.log('   - Existing claims need manual NFT record creation');
  console.log('');
  console.log('🧪 Next Test:');
  console.log('   1. Create a new claimable NFT');
  console.log('   2. Claim it with a different wallet');
  console.log('   3. Verify it appears in /my-nfts immediately');
  console.log('');
  console.log('📝 For existing "Just Goku" claim:');
  console.log('   - Can manually create NFT record if needed');
  console.log('   - Or re-claim with updated system');
}

// Run the debug analysis
debugMyNFTsIssue().catch(console.error);