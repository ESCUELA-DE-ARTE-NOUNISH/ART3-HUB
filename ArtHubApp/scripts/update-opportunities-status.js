const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateOpportunitiesStatus() {
  console.log('🔄 Starting opportunities status update...');
  
  try {
    // Get all opportunities
    const opportunitiesRef = collection(db, 'opportunities');
    const querySnapshot = await getDocs(opportunitiesRef);
    
    console.log(`📊 Found ${querySnapshot.size} opportunities to update`);
    
    const updatePromises = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const opportunity = docSnapshot.data();
      const opportunityRef = doc(db, 'opportunities', docSnapshot.id);
      
      console.log(`📝 Updating opportunity: ${opportunity.title} (${docSnapshot.id})`);
      console.log(`   Current status: ${opportunity.status || 'undefined'}`);
      
      // Update to published status and add updated_at timestamp
      const updateData = {
        status: 'published',
        updated_at: new Date().toISOString()
      };
      
      updatePromises.push(updateDoc(opportunityRef, updateData));
    });
    
    // Execute all updates
    await Promise.all(updatePromises);
    
    console.log(`✅ Successfully updated ${updatePromises.length} opportunities to "published" status`);
    
    // Verify the updates
    console.log('\n📋 Verifying updates...');
    const verifySnapshot = await getDocs(opportunitiesRef);
    const statusCounts = { draft: 0, published: 0, expired: 0, undefined: 0 };
    
    verifySnapshot.forEach((docSnapshot) => {
      const status = docSnapshot.data().status;
      if (status) {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      } else {
        statusCounts.undefined += 1;
      }
    });
    
    console.log('📊 Final status counts:');
    console.log(`   Draft: ${statusCounts.draft}`);
    console.log(`   Published: ${statusCounts.published}`);
    console.log(`   Expired: ${statusCounts.expired}`);
    console.log(`   Undefined: ${statusCounts.undefined}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating opportunities status:', error);
    process.exit(1);
  }
}

// Run the update
updateOpportunitiesStatus();