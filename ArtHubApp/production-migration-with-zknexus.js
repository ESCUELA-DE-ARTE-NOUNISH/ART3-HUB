const SITE_URL = 'https://app.art3hub.xyz';

async function runCompleteMigration() {
  console.log('🚀 Running complete production migration...');
  console.log('📋 This will:');
  console.log('   1. Migrate all NFTs with missing artist names and categories');
  console.log('   2. Fix NY Pewee with artist name "zkNexus"');
  
  try {
    // Step 1: General migration for all NFTs
    console.log('\n📡 Step 1: Running general migration...');
    const generalResponse = await fetch(`${SITE_URL}/api/migrate-nft-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        admin_key: 'migrate-nft-metadata-2025'
      })
    });

    const generalResult = await generalResponse.json();
    
    if (generalResponse.ok) {
      console.log('✅ General migration successful!');
      console.log(`📊 ${generalResult.message}`);
    } else {
      console.error('❌ General migration failed:', generalResult.error);
      return; // Stop if general migration fails
    }
    
    // Step 2: Specific fix for NY Pewee with zkNexus
    console.log('\n📡 Step 2: Fixing NY Pewee with zkNexus artist name...');
    const zkNexusResponse = await fetch(`${SITE_URL}/api/migrate-nft-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: '0x8ea4b5e25c45d34596758da2d3f27a8096eefeb9',
        admin_key: 'migrate-nft-metadata-2025',
        force_artist_name: 'zkNexus',
        target_nft_id: 'mexkjvjfze2dzag1n1'
      })
    });

    const zkNexusResult = await zkNexusResponse.json();
    
    if (zkNexusResponse.ok) {
      console.log('✅ zkNexus fix successful!');
      console.log(`📊 ${zkNexusResult.message}`);
      
      // Show all results
      console.log('\n🔍 Final migration results:');
      if (generalResult.results) {
        generalResult.results.forEach((item, index) => {
          if (item.status !== 'skipped') {
            console.log(`${index + 1}. ${item.nft_name}: ${item.status}`);
            if (item.updates) {
              console.log(`   Artist: "${item.updates.artist_name || 'null'}", Category: "${item.updates.category || 'unchanged'}"`);
            }
          }
        });
      }
      
      if (zkNexusResult.results && zkNexusResult.results.length > 0) {
        const zkUpdate = zkNexusResult.results[0];
        console.log(`🎯 Special Fix - ${zkUpdate.nft_name}: ${zkUpdate.status}`);
        if (zkUpdate.updates) {
          console.log(`   Artist: "${zkUpdate.updates.artist_name}", Category: "${zkUpdate.updates.category || 'unchanged'}"`);
        }
      }
      
      console.log('\n🎉 Complete migration finished!');
      console.log('🔍 Expected results on https://app.art3hub.xyz/explore:');
      console.log('   • Morning Coffee by 0xJMC (Digital Art)');
      console.log('   • NY Pewee by zkNexus (Digital Art)');
      
    } else {
      console.error('❌ zkNexus fix failed:', zkNexusResult.error);
    }
    
  } catch (error) {
    console.error('❌ Network error during migration:', error.message);
  }
}

runCompleteMigration();