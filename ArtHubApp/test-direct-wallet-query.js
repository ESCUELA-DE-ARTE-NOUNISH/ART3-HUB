// Direct test of wallet address queries
const WALLET_ADDRESS = '0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9';
const SITE_URL = 'http://localhost:3000';

async function testWalletQueries() {
  console.log('🧪 Direct Wallet Query Test');
  console.log(`📊 Testing wallet: ${WALLET_ADDRESS}`);
  console.log('');
  
  try {
    // Test 1: Exact API call that /my-nfts page makes
    console.log('📡 Test 1: Exact /my-nfts API call...');
    const response1 = await fetch(`${SITE_URL}/api/nfts?wallet_address=${WALLET_ADDRESS}`);
    const data1 = await response1.json();
    console.log(`Result: ${data1.nfts?.length || 0} NFTs found`);
    
    if (data1.nfts && data1.nfts.length > 0) {
      data1.nfts.forEach(nft => {
        console.log(`  - "${nft.name}" (${nft.network})`);
      });
    }
    console.log('');
    
    // Test 2: Try with lowercase wallet address
    console.log('📡 Test 2: Lowercase wallet address...');
    const response2 = await fetch(`${SITE_URL}/api/nfts?wallet_address=${WALLET_ADDRESS.toLowerCase()}`);
    const data2 = await response2.json();
    console.log(`Result: ${data2.nfts?.length || 0} NFTs found`);
    
    if (data2.nfts && data2.nfts.length > 0) {
      data2.nfts.forEach(nft => {
        console.log(`  - "${nft.name}" (${nft.network})`);
      });
    }
    console.log('');
    
    // Test 3: Check what network filtering is happening
    console.log('📡 Test 3: Check all NFTs and find yours manually...');
    const response3 = await fetch(`${SITE_URL}/api/nfts`);
    const data3 = await response3.json();
    
    if (data3.nfts && data3.nfts.length > 0) {
      console.log('All NFTs in database:');
      data3.nfts.forEach((nft, i) => {
        const isYours = nft.wallet_address?.toLowerCase() === WALLET_ADDRESS.toLowerCase();
        console.log(`${i + 1}. "${nft.name}"`);
        console.log(`   Wallet: ${nft.wallet_address} ${isYours ? '← YOURS!' : ''}`);
        console.log(`   Network: ${nft.network}`);
        console.log(`   Source: ${nft.source}`);
        console.log(`   Created: ${nft.created_at}`);
        console.log('');
      });
      
      // Filter manually
      const yourNFTs = data3.nfts.filter(nft => 
        nft.wallet_address?.toLowerCase() === WALLET_ADDRESS.toLowerCase()
      );
      console.log(`🎯 Manual filter result: ${yourNFTs.length} NFTs belong to your wallet`);
      
      if (yourNFTs.length > 0) {
        console.log('Your NFTs:');
        yourNFTs.forEach(nft => {
          console.log(`  - "${nft.name}" (${nft.network}) - ${nft.source}`);
        });
      }
    }
    
    // Test 4: Check if Firebase indexes are working
    console.log('📡 Test 4: Testing if this is a Firebase index issue...');
    // If the manual filter shows your NFTs but the API doesn't, it's likely an index issue
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWalletQueries();