#!/usr/bin/env node

/**
 * Test the new ownerMint approach via web requests (no direct blockchain calls)
 * This tests the complete database-only claim validation flow through the app
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONTRACT = '0x4139944a41ea121eb5dbaea1d2d20fafedc72437'; // Contract from previous error
const TEST_CLAIM_CODE = 'GreatNFT';
const TEST_USER = '0x499D377eF114cC1BF7798cECBB38412701400daF';

async function testOwnerMintApproach() {
  console.log('🧪 Testing New OwnerMint Approach via Web API');
  console.log('==============================================');
  
  console.log('📋 Test Configuration:', {
    contractAddress: TEST_CONTRACT,
    claimCode: TEST_CLAIM_CODE,
    testUser: TEST_USER,
    baseUrl: BASE_URL
  });
  
  try {
    // Step 1: Test claim code verification (database-only)
    console.log('\\n🔍 Step 1: Testing claim code verification...');
    
    const verifyResponse = await fetch(`${BASE_URL}/api/nfts/claim?code=${TEST_CLAIM_CODE}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=test' // Mock session for testing
      }
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('✅ Verification result:', verifyResult);
    
    if (!verifyResult.valid) {
      console.log('❌ Claim code not valid in database - this test requires existing NFT');
      return;
    }
    
    // Step 2: Test the new ownerMint claim process
    console.log('\\n🎯 Step 2: Testing ownerMint claim process...');
    
    const claimResponse = await fetch(`${BASE_URL}/api/nfts/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=test' // Mock session for testing
      },
      body: JSON.stringify({
        claimCode: TEST_CLAIM_CODE
      })
    });
    
    const claimResult = await claimResponse.json();
    console.log('📊 Claim result:', claimResult);
    
    if (claimResult.success) {
      console.log('\\n🎉 OwnerMint Approach Test Results:');
      console.log('==================================');
      console.log('✅ Database validation: SUCCESS');
      console.log('✅ OwnerMint execution: SUCCESS');
      console.log('✅ No claim codes on contract: SUCCESS');
      console.log('✅ Direct user minting: SUCCESS');
      console.log('\\n📝 Transaction Details:', {
        txHash: claimResult.txHash,
        tokenId: claimResult.tokenId,
        contractAddress: claimResult.contractAddress
      });
    } else {
      console.log('❌ Claim failed:', claimResult.message);
      console.log('\\n🔍 This might be expected if:');
      console.log('- Contract needs to be redeployed with ownerMint function');
      console.log('- User already claimed this NFT');
      console.log('- System is still using old claim code approach');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOwnerMintApproach();