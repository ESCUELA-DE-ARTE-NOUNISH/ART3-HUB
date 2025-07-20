const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Firebase Admin SDK
// You'll need to download the service account key from Firebase Console
// and place it in the project root or provide the path
const serviceAccount = require('../firebase-admin-key.json'); // You need to download this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Collections to reset
const COLLECTIONS = [
  'user_profiles',
  'user_sessions', 
  'user_analytics',
  'nfts',
  'claimable_nfts',
  'nft_claims',
  'user_memory',
  'conversation_sessions',
  'conversation_messages',
  'assessment_responses'
];

async function deleteCollection(collectionName) {
  console.log(`🧹 Resetting collection: ${collectionName}`);
  
  const collectionRef = db.collection(collectionName);
  let deletedCount = 0;
  
  try {
    while (true) {
      const snapshot = await collectionRef.limit(500).get();
      
      if (snapshot.empty) {
        break;
      }
      
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      deletedCount += snapshot.docs.length;
      
      console.log(`   📦 Deleted ${snapshot.docs.length} documents (Total: ${deletedCount})`);
    }
    
    console.log(`   ✅ ${collectionName}: ${deletedCount} documents deleted`);
    return { collection: collectionName, deleted: deletedCount, success: true };
    
  } catch (error) {
    console.error(`   ❌ ${collectionName}: Failed - ${error.message}`);
    return { collection: collectionName, deleted: deletedCount, success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting Firebase Database Reset...');
  console.log('📊 This will empty all collections while preserving indexes');
  console.log('🔗 Database:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log('');
  
  const results = [];
  
  for (const collectionName of COLLECTIONS) {
    const result = await deleteCollection(collectionName);
    results.push(result);
  }
  
  console.log('');
  console.log('📈 Reset Summary:');
  console.log('═'.repeat(60));
  
  let totalDeleted = 0;
  let successCount = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.collection.padEnd(25)} | ${result.deleted.toString().padStart(6)} docs`);
    
    if (result.success) {
      totalDeleted += result.deleted;
      successCount++;
    }
  });
  
  console.log('═'.repeat(60));
  console.log(`📊 Total Documents Deleted: ${totalDeleted}`);
  console.log(`✅ Successful Collections: ${successCount}/${COLLECTIONS.length}`);
  
  if (successCount === COLLECTIONS.length) {
    console.log('🎉 Database reset completed successfully!');
  } else {
    console.log('⚠️  Database reset completed with some errors');
  }
  
  process.exit(0);
}

main().catch(console.error);