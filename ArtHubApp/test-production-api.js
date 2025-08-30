const SITE_URL = 'https://app.art3hub.xyz';

async function testProductionAPI() {
  console.log('🔍 Testing production API availability...');
  
  try {
    // First check if the migration API exists
    console.log('1. Testing migration API availability...');
    const testResponse = await fetch(`${SITE_URL}/api/migrate-nft-metadata`, {
      method: 'GET'
    });
    
    if (testResponse.ok) {
      const testResult = await testResponse.json();
      console.log('✅ Migration API is available:', testResult.message);
      
      // Now run the actual migration
      console.log('\n2. Running migration...');
      const migrationResponse = await fetch(`${SITE_URL}/api/migrate-nft-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // No wallet_address = migrate ALL NFTs, including zkNexus fix
          admin_key: 'migrate-nft-metadata-2025'
        })
      });

      const migrationResult = await migrationResponse.json();
      
      if (migrationResponse.ok) {
        console.log('✅ Production migration successful!');
        console.log(`📊 ${migrationResult.message}`);
        
        if (migrationResult.results && migrationResult.results.length > 0) {
          console.log('\n🔍 Migration results:');
          migrationResult.results.forEach((item, index) => {
            console.log(`${index + 1}. ${item.nft_name}: ${item.status}`);
            if (item.updates) {
              console.log(`   Updates: artist_name="${item.updates.artist_name}", category="${item.updates.category}"`);
            }
          });
        }
        
        console.log('\n🎉 Migration complete! Check https://app.art3hub.xyz/explore to see the updated NFT data.');
      } else {
        console.error('❌ Migration failed:', migrationResult.error);
      }
    } else {
      console.error('❌ Migration API not available. Response:', testResponse.status);
      const errorText = await testResponse.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 The deployment might still be in progress. Try running this script again in a few minutes.');
  }
}

testProductionAPI();