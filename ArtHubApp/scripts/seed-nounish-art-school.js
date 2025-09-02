// Add Nounish Art School community to database
// Run with: NEXT_PUBLIC_SITE_URL=http://localhost:3000 node scripts/seed-nounish-art-school.js

async function createNounishArtSchool() {
  console.log('🏫 Creating Nounish Art School community...');
  
  try {
    // Community data based on provided information
    const communityData = {
      title: "Nounish Art School",
      description: `🌟 What is the Nounish Art School?

The Nounish Art School is the first professional Nounish art school in real life (IRL), created as a public good in Trujillo, Peru. Its mission is to educate, empower, and provide resources to emerging talents in both traditional and digital art, while connecting them with the opportunities of Web3.

🎨 Mission
• Educate and empower young artists through art and creativity
• Bridge art with Web3, teaching students how to use blockchain, NFTs, and decentralized communities
• Preserve and promote local culture, connecting Peruvian creativity with the global Nounish movement

💡 Key Features
• Scholarships: offered to promising talents so economic barriers don't stop them
• Hybrid model: with both in-person classes in Trujillo and virtual activities open to a global community
• Funded by Nouns DAO: supported by the Nouns ecosystem, which backs projects of cultural and creative impact
• Innovative certification: students receive Soulbound Tokens (SBTs) on the Base network, giving their achievements blockchain-based validation
• Open access: the community is inclusive and accessible to anyone willing to learn

🌍 Local & Global Impact
Locally: it gives young Peruvians the tools to grow as artists and create real career opportunities.
Globally: it links Latin American talent with the Nounish and Web3 culture, showing how a school in Trujillo can influence the worldwide creative ecosystem.

👉 In short:
The Nounish Art School is a bridge between traditional art and Web3, providing education, resources, and global opportunities for the next generation of creators.`,
      links: [
        "https://www.instagram.com/escueladeartenounish/",
        "https://x.com/EAnounish",
        "https://farcaster.xyz/eanounish"
      ],
      status: "published",
      featured: true,
      created_by: "0xAdmin" // Admin wallet placeholder
    };

    // Create the community via API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/communities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(communityData),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Successfully created Nounish Art School community!');
      console.log(`   📄 Community ID: ${result.data.id}`);
      console.log(`   🏷️  Title: ${result.data.title}`);
      console.log(`   🌟 Status: ${result.data.status}`);
      console.log(`   ⭐ Featured: ${result.data.featured ? 'Yes' : 'No'}`);
      console.log(`   🔗 Links: ${result.data.links.length} social links added`);
      
      // Display the links
      console.log('\n🌐 Social Links:');
      result.data.links.forEach((link, index) => {
        console.log(`   ${index + 1}. ${link}`);
      });

      // Verify by fetching all communities
      console.log('\n📋 Verifying communities list...');
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/communities`);
      const verifyResult = await verifyResponse.json();
      
      if (verifyResult.success) {
        console.log(`✅ Total communities in database: ${verifyResult.data.length}`);
        
        const nounishCommunity = verifyResult.data.find(c => c.title === "Nounish Art School");
        if (nounishCommunity) {
          console.log('✅ Nounish Art School confirmed in public communities list');
        }
      }
      
    } else {
      console.error('❌ Failed to create community:', result.error);
      
      // Check if it already exists
      if (result.error && result.error.includes('already exists')) {
        console.log('\n🔍 Checking if community already exists...');
        const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/communities`);
        const checkResult = await checkResponse.json();
        
        if (checkResult.success) {
          const existing = checkResult.data.find(c => c.title === "Nounish Art School");
          if (existing) {
            console.log('ℹ️  Nounish Art School already exists in database');
            console.log(`   📄 Community ID: ${existing.id}`);
            console.log(`   🌟 Status: ${existing.status}`);
            console.log(`   ⭐ Featured: ${existing.featured ? 'Yes' : 'No'}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating community:', error);
  }
}

// Run the seed function
createNounishArtSchool();