// Test if Firebase indexes are working by making the exact failing query
const WALLET_ADDRESS = '0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9';
const SITE_URL = 'http://localhost:3000';

async function testIndexStatus() {
  console.log('🔥 Firebase Index Status Test');
  console.log(`📊 Project: art3-hub-78ef8`);
  console.log(`📊 Wallet: ${WALLET_ADDRESS}`);
  console.log('');
  
  try {
    // Test the exact query that's failing according to server logs
    console.log('📡 Testing exact failing query: wallet_address + network + orderBy(created_at)...');
    
    const response = await fetch(`${SITE_URL}/api/nfts?wallet_address=${WALLET_ADDRESS}`);
    const data = await response.json();
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 NFTs found: ${data.nfts?.length || 0}`);
    
    if (data.nfts && data.nfts.length > 0) {
      console.log('✅ SUCCESS: Index is working!');
      data.nfts.forEach((nft, i) => {
        console.log(`${i + 1}. "${nft.name}" (${nft.network})`);
      });
    } else {
      console.log('❌ FAILED: Index still building or other issue');
    }
    
    // Also test if we can access Firebase console status
    console.log('');
    console.log('🔗 Check index status manually at:');
    console.log('https://console.firebase.google.com/u/0/project/art3-hub-78ef8/firestore/indexes');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIndexStatus();