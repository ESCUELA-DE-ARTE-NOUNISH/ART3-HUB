#!/usr/bin/env tsx
/**
 * Firebase Database Reset Script
 * 
 * This script empties all collections in the Firebase database while preserving indexes.
 * It's designed to start fresh with the new contract deployment while keeping the database structure intact.
 * 
 * Usage: npx tsx scripts/reset-firebase-db.ts
 */

import { config } from 'dotenv'
// Load environment variables first
config({ path: '.env' })

// Initialize Firebase directly in script
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, writeBatch, query, limit as limitQuery } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}
const db = getFirestore(app)

import { COLLECTIONS } from '../lib/firebase'

interface ResetStats {
  collection: string
  documentsDeleted: number
  batchesUsed: number
  success: boolean
  error?: string
}

async function deleteCollectionInBatches(collectionName: string): Promise<ResetStats> {
  console.log(`🧹 Resetting collection: ${collectionName}`)
  
  const stats: ResetStats = {
    collection: collectionName,
    documentsDeleted: 0,
    batchesUsed: 0,
    success: false
  }

  try {
    const collectionRef = collection(db, collectionName)
    let hasMore = true
    
    while (hasMore) {
      // Query documents in batches of 500 (Firestore batch limit)
      const q = query(collectionRef, limitQuery(500))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        hasMore = false
        break
      }

      // Create a batch for deletion
      const batch = writeBatch(db)
      
      snapshot.docs.forEach((document) => {
        batch.delete(document.ref)
      })

      // Commit the batch
      await batch.commit()
      
      stats.documentsDeleted += snapshot.docs.length
      stats.batchesUsed += 1
      
      console.log(`   📦 Batch ${stats.batchesUsed}: Deleted ${snapshot.docs.length} documents`)
      
      // If we got less than 500 documents, we're done
      if (snapshot.docs.length < 500) {
        hasMore = false
      }
    }

    stats.success = true
    console.log(`   ✅ ${collectionName}: ${stats.documentsDeleted} documents deleted in ${stats.batchesUsed} batches`)
    
  } catch (error) {
    stats.error = error instanceof Error ? error.message : 'Unknown error'
    stats.success = false
    console.error(`   ❌ ${collectionName}: Failed to reset - ${stats.error}`)
  }

  return stats
}

async function resetFirebaseDatabase() {
  console.log('🚀 Starting Firebase Database Reset...')
  console.log('📊 This will empty all collections while preserving indexes')
  console.log('🔗 Database:', db.app.options.projectId)
  console.log('')

  const allStats: ResetStats[] = []
  
  // Get all collection names from COLLECTIONS constant
  const collectionsToReset = Object.values(COLLECTIONS)
  
  console.log(`📋 Collections to reset: ${collectionsToReset.length}`)
  collectionsToReset.forEach(name => console.log(`   - ${name}`))
  console.log('')

  // Reset each collection
  for (const collectionName of collectionsToReset) {
    const stats = await deleteCollectionInBatches(collectionName)
    allStats.push(stats)
    
    // Small delay between collections to avoid overwhelming Firestore
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Generate summary
  console.log('')
  console.log('📈 Reset Summary:')
  console.log('═'.repeat(60))
  
  let totalDocuments = 0
  let totalBatches = 0
  let successfulCollections = 0
  let failedCollections = 0

  allStats.forEach(stats => {
    const status = stats.success ? '✅' : '❌'
    console.log(`${status} ${stats.collection.padEnd(25)} | ${stats.documentsDeleted.toString().padStart(6)} docs | ${stats.batchesUsed.toString().padStart(3)} batches`)
    
    if (stats.success) {
      totalDocuments += stats.documentsDeleted
      totalBatches += stats.batchesUsed
      successfulCollections++
    } else {
      failedCollections++
      console.log(`     Error: ${stats.error}`)
    }
  })

  console.log('═'.repeat(60))
  console.log(`📊 Total Documents Deleted: ${totalDocuments}`)
  console.log(`📦 Total Batches Used: ${totalBatches}`)
  console.log(`✅ Successful Collections: ${successfulCollections}`)
  console.log(`❌ Failed Collections: ${failedCollections}`)
  console.log('')

  if (failedCollections === 0) {
    console.log('🎉 Database reset completed successfully!')
    console.log('💾 All indexes and collection structure preserved')
    console.log('🆕 Database is now ready for fresh data with new contracts')
  } else {
    console.log('⚠️  Database reset completed with some errors')
    console.log('🔍 Check the failed collections above for details')
  }

  console.log('')
  console.log('🔧 Next Steps:')
  console.log('   1. Restart your development server')
  console.log('   2. Test NFT creation with new contract addresses')
  console.log('   3. Verify all features work with fresh database')
}

// Check if we're in the right environment
async function main() {
  console.log('🔍 Environment Variables Check:')
  console.log('   NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  console.log('   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
  console.log('   NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Not set')
  console.log('')
  console.log('🔍 Firebase Config Check:')
  console.log('   Project ID:', app.options.projectId)
  console.log('   Auth Domain:', app.options.authDomain)
  console.log('')
  
  if (!app.options.projectId) {
    console.error('❌ Firebase not properly configured')
    process.exit(1)
  }

  console.log('⚠️  WARNING: This will delete ALL data in the Firebase database!')
  console.log('🔒 Indexes and collection structure will be preserved')
  console.log('💽 Project:', app.options.projectId)
  console.log('')
  
  // In a real environment, you might want to add a confirmation prompt
  // For now, we'll proceed directly since this is controlled execution
  
  try {
    await resetFirebaseDatabase()
    process.exit(0)
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }
}

main()