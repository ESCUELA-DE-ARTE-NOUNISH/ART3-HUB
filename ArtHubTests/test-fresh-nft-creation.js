#!/usr/bin/env node

/**
 * Test fresh NFT creation and claiming with comprehensive logging
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testFreshNFT() {
  console.log('🧪 Testing Fresh NFT Creation & Claiming');
  console.log('========================================');
  console.log('🔥 Database has been cleaned manually');
  console.log('🎯 Testing new factory with ownerMint support');
  console.log('📝 Comprehensive logging enabled\\n');
  
  const timestamp = Date.now();
  const testNFT = {
    title: `FreshTest${timestamp}`,
    description: 'Fresh test NFT with new ownerMint approach',
    claimCode: `FRESH${timestamp}`,
    startDate: new Date().toISOString(),
    endDate: null,
    status: 'published', // Will deploy contract
    maxClaims: 0,
    network: 'baseSepolia',
    image: `https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=FRESH${timestamp}`
  };
  
  console.log('📋 Test NFT Data:');
  console.log('=================');
  Object.entries(testNFT).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  console.log('\\n🚀 Starting fresh test...');
  console.log('📊 Check server logs for detailed execution flow');
  console.log('\\n💡 Expected Flow:');
  console.log('   1. Admin creates NFT → Uses NEW factory');
  console.log('   2. Contract deployed → Has ownerMint function');
  console.log('   3. User claims → Uses ownerMint approach');
  console.log('   4. Direct minting → No claim codes on contract');
  console.log('\\n🔍 Watch server logs for:');
  console.log('   ✅ "DEPLOYING CLAIMABLE NFT CONTRACT VIA FACTORY"');
  console.log('   ✅ "Using NEW FACTORY with ownerMint support!"');
  console.log('   ✅ "SUCCESS: Contract supports ownerMint!"');
  console.log('   ✅ "NEW - Direct user minting, no claim codes needed"');
  
  return testNFT;
}

// Run the test info display
const testData = testFreshNFT();
console.log('\\n🎯 Ready for testing!');
console.log(`🔑 Use claim code: ${testData.claimCode}`);
console.log('📱 Go to admin interface to create this NFT');
console.log('🎫 Then go to /mint page to test claiming');
console.log('\\n📊 All actions will be logged with detailed information!');