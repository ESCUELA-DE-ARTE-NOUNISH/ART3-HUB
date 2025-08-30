// Debug script to check NFTs for wallet address in the database
const WALLET_ADDRESS = '0x8ea4b5e25c45d34596758dA2d3F27a8096eeFEb9';
const SITE_URL = 'http://localhost:3000'; // or 'https://app.art3hub.xyz'

async function debugMyNFTs() {
  console.log('🔍 Debug: My NFTs Analysis');
  console.log(`📊 Wallet: ${WALLET_ADDRESS}`);
  console.log(`🌐 Site: ${SITE_URL}`);
  console.log('');
  
  try {
    // 1. Test direct API call (same as /my-nfts page)
    console.log('📡 Step 1: Testing /api/nfts endpoint with wallet parameter...');
    const response = await fetch(`${SITE_URL}/api/nfts?wallet_address=${WALLET_ADDRESS}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Response Success');
      console.log(`📊 Total NFTs found: ${data.nfts?.length || 0}`);
      
      if (data.nfts && data.nfts.length > 0) {
        console.log('\n🎨 Your NFTs:');
        data.nfts.forEach((nft, index) => {
          console.log(`${index + 1}. "${nft.name}"`);
          console.log(`   ID: ${nft.id}`);
          console.log(`   Network: ${nft.network}`);
          console.log(`   Source: ${nft.source || 'unknown'}`);
          console.log(`   Created: ${nft.created_at}`);
          console.log(`   Contract: ${nft.contract_address || 'N/A'}`);
          console.log(`   TX Hash: ${nft.transaction_hash?.substring(0, 10)}...`);
          console.log('');
        });
      } else {
        console.log('❌ No NFTs found for your wallet');
        console.log('');
        
        // 2. Check if there are any NFTs in the database at all
        console.log('📡 Step 2: Testing /api/nfts endpoint without wallet filter...');
        const allResponse = await fetch(`${SITE_URL}/api/nfts`);
        const allData = await allResponse.json();
        
        if (allResponse.ok) {
          console.log(`📊 Total NFTs in database: ${allData.nfts?.length || 0}`);
          
          if (allData.nfts && allData.nfts.length > 0) {
            console.log('\n🗃️ All NFTs in database:');
            allData.nfts.forEach((nft, index) => {
              console.log(`${index + 1}. "${nft.name}" by ${nft.wallet_address}`);
              console.log(`   Network: ${nft.network}`);
              console.log(`   Source: ${nft.source || 'unknown'}`);
              console.log('');
            });
          }
        }
      }
      
    } else {
      console.error('❌ API Error:', data.error);
    }
    
    // 3. Check current network configuration
    console.log('📡 Step 3: Checking network configuration...');
    const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE;
    console.log(`🔧 NEXT_PUBLIC_IS_TESTING_MODE: ${isTestingMode}`);
    
    const expectedNetwork = isTestingMode === 'true' ? 'base-sepolia' : 'base';
    console.log(`🌐 Expected network filter: ${expectedNetwork}`);
    console.log('');
    
    // 4. Test specific network filtering
    console.log('📡 Step 4: Testing network-specific API call...');
    const networkResponse = await fetch(`${SITE_URL}/api/nfts?network=${expectedNetwork}`);
    const networkData = await networkResponse.json();
    
    if (networkResponse.ok) {
      console.log(`✅ Network-filtered NFTs (${expectedNetwork}): ${networkData.nfts?.length || 0}`);
      
      if (networkData.nfts && networkData.nfts.length > 0) {
        const yourNFTs = networkData.nfts.filter(nft => 
          nft.wallet_address?.toLowerCase() === WALLET_ADDRESS.toLowerCase()
        );
        console.log(`🎯 Your NFTs in ${expectedNetwork} network: ${yourNFTs.length}`);
        
        yourNFTs.forEach((nft, index) => {
          console.log(`${index + 1}. "${nft.name}"`);
          console.log(`   Created: ${new Date(nft.created_at).toLocaleString()}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run the debug
debugMyNFTs();