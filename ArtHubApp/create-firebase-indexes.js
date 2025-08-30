const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (using environment variables)
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'art3-hub-78ef8'
  });
}

const db = getFirestore();

async function createFirebaseIndexes() {
  console.log('🔥 Firebase Index Creation Script');
  console.log('📊 Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'art3-hub-78ef8');
  console.log('');
  
  console.log('⚠️  NOTE: This script provides the index creation commands.');
  console.log('   Firebase indexes must be created via Firebase CLI or Console.');
  console.log('');
  
  // Required indexes for the NFT collection
  const indexes = [
    {
      collection: 'nfts',
      fields: [
        { field: 'wallet_address', order: 'ASCENDING' },
        { field: 'created_at', order: 'DESCENDING' }
      ],
      description: 'For getNFTsByWallet() - basic wallet queries'
    },
    {
      collection: 'nfts',
      fields: [
        { field: 'wallet_address', order: 'ASCENDING' },
        { field: 'network', order: 'ASCENDING' },
        { field: 'created_at', order: 'DESCENDING' }
      ],
      description: 'For getNFTsByWalletAndNetwork() - network-filtered wallet queries (/my-nfts)'
    },
    {
      collection: 'nfts',
      fields: [
        { field: 'wallet_address', order: 'ASCENDING' },
        { field: 'source', order: 'ASCENDING' },
        { field: 'network', order: 'ASCENDING' }
      ],
      description: 'For getUserCreatedNFTsByWallet() - quota calculations'
    },
    {
      collection: 'nfts',
      fields: [
        { field: 'network', order: 'ASCENDING' },
        { field: 'created_at', order: 'DESCENDING' }
      ],
      description: 'For getNFTsByNetwork() - explore page filtering'
    }
  ];
  
  console.log('📋 Required Firestore Composite Indexes:');
  console.log('');
  
  indexes.forEach((index, i) => {
    console.log(`${i + 1}. ${index.description}`);
    console.log(`   Collection: ${index.collection}`);
    console.log(`   Fields:`);
    index.fields.forEach(field => {
      console.log(`     - ${field.field} (${field.order})`);
    });
    console.log('');
  });
  
  console.log('🛠️  DEPLOYMENT METHODS:');
  console.log('');
  
  console.log('Method 1: Firebase CLI Commands');
  console.log('Run these commands in your terminal:');
  console.log('');
  
  indexes.forEach((index, i) => {
    const fieldsStr = index.fields
      .map(f => `${f.field}:${f.order.toLowerCase()}`)
      .join(',');
    
    console.log(`# ${index.description}`);
    console.log(`firebase firestore:indexes:create --collection-group=${index.collection} --field-config="${fieldsStr}"`);
    console.log('');
  });
  
  console.log('Method 2: Manual Console Creation');
  console.log('1. Visit: https://console.firebase.google.com/project/art3-hub-78ef8/firestore/indexes');
  console.log('2. Click "Create Index"');
  console.log('3. Select "Single collection"');
  console.log('4. Collection ID: "nfts"');
  console.log('5. Add the fields from the list above with their respective sort orders');
  console.log('');
  
  console.log('Method 3: firestore.indexes.json');
  console.log('Create a firestore.indexes.json file with:');
  console.log('');
  
  const firestoreIndexes = {
    indexes: indexes.map(index => ({
      collectionGroup: index.collection,
      queryScope: 'COLLECTION',
      fields: index.fields.map(field => ({
        fieldPath: field.field,
        order: field.order
      }))
    }))
  };
  
  console.log(JSON.stringify(firestoreIndexes, null, 2));
  console.log('');
  console.log('Then run: firebase deploy --only firestore:indexes');
  console.log('');
  
  console.log('⚡ PRIORITY: Create index #2 first for /my-nfts functionality!');
  console.log('   Fields: wallet_address (ASC) + network (ASC) + created_at (DESC)');
}

// Auto-run if called directly
if (require.main === module) {
  createFirebaseIndexes().catch(console.error);
}

module.exports = { createFirebaseIndexes };