// Update opportunities status via API
// Run with: NEXT_PUBLIC_SITE_URL=http://localhost:3000 node scripts/update-opportunities-via-api.js

async function updateOpportunitiesStatus() {
  console.log('🔄 Starting opportunities status update via API...');
  
  try {
    // First, get all opportunities
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/opportunities?admin=true`);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Failed to fetch opportunities:', result.error);
      return;
    }
    
    const opportunities = result.data;
    console.log(`📊 Found ${opportunities.length} opportunities to check`);
    
    let updatedCount = 0;
    
    // Update each opportunity that doesn't have "published" status
    for (const opp of opportunities) {
      console.log(`📝 Checking opportunity: ${opp.title} (current status: ${opp.status})`);
      
      if (opp.status !== 'published') {
        console.log(`   🔄 Updating ${opp.title} from "${opp.status}" to "published"`);
        
        // Update the opportunity
        const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/opportunities/${opp.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...opp,
            status: 'published'
          }),
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
          console.log(`   ✅ Successfully updated: ${opp.title}`);
          updatedCount++;
        } else {
          console.error(`   ❌ Failed to update ${opp.title}:`, updateResult.error);
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        console.log(`   ✓ Already published: ${opp.title}`);
      }
    }
    
    console.log(`\n🎉 Update completed! Updated ${updatedCount} opportunities to "published" status.`);
    
    // Verify the final status
    console.log('\n📋 Verifying final status...');
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/opportunities?admin=true`);
    const verifyResult = await verifyResponse.json();
    
    if (verifyResult.success) {
      const statusCounts = { draft: 0, published: 0, expired: 0, other: 0 };
      
      verifyResult.data.forEach(opp => {
        if (opp.status === 'draft') {
          statusCounts.draft++;
        } else if (opp.status === 'published') {
          statusCounts.published++;
        } else if (opp.status === 'expired') {
          statusCounts.expired++;
        } else {
          statusCounts.other++;
        }
      });
      
      console.log('📊 Final status counts:');
      console.log(`   Draft: ${statusCounts.draft}`);
      console.log(`   Published: ${statusCounts.published}`);
      console.log(`   Expired: ${statusCounts.expired}`);
      console.log(`   Other: ${statusCounts.other}`);
    }
    
  } catch (error) {
    console.error('❌ Error during update:', error);
  }
}

// Run the update
updateOpportunitiesStatus();