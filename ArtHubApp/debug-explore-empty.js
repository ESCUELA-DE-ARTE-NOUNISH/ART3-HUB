// Debug script to understand why /explore page shows empty
// This script will check what NFTs exist in the database and their network assignments

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration - load from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Check if we have Firebase configuration
if (!firebaseConfig.projectId) {
  console.error('❌ Firebase configuration missing. Make sure environment variables are set.')
  process.exit(1)
}

console.log('=== Debug: /explore Page Empty Issue ===')
console.log('')
console.log('📋 Configuration:')
console.log('  Firebase Project:', firebaseConfig.projectId)
console.log('  Testing Mode:', process.env.NEXT_PUBLIC_IS_TESTING_MODE || 'false')
console.log('  Expected Network:', process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true' ? 'base-sepolia' : 'base')
console.log('')

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugExploreIssue() {
  try {
    console.log('🔍 Fetching all NFTs from database...')
    
    const nftsCollection = collection(db, 'nfts')
    const allNFTs = await getDocs(nftsCollection)
    
    console.log(`📊 Total NFTs in database: ${allNFTs.size}`)
    console.log('')
    
    if (allNFTs.size === 0) {
      console.log('❌ No NFTs found in database. This explains why /explore is empty.')
      return
    }
    
    // Analyze NFTs by network
    const networkStats = {}
    const walletStats = {}
    const sourceStats = {}
    
    allNFTs.forEach((doc) => {
      const nft = doc.data()
      
      // Network stats
      const network = nft.network || 'unknown'
      networkStats[network] = (networkStats[network] || 0) + 1
      
      // Wallet stats
      const wallet = nft.wallet_address || 'unknown'
      walletStats[wallet] = (walletStats[wallet] || 0) + 1
      
      // Source stats
      const source = nft.source || 'unknown'
      sourceStats[source] = (sourceStats[source] || 0) + 1
      
      // Show details of first few NFTs
      if (Object.keys(networkStats).length <= 3) {
        console.log(`📝 Sample NFT:`)
        console.log(`   ID: ${doc.id}`)
        console.log(`   Name: ${nft.name}`)
        console.log(`   Network: ${nft.network}`)
        console.log(`   Wallet: ${nft.wallet_address}`)
        console.log(`   Artist: ${nft.artist_name || 'not set'}`)
        console.log(`   Category: ${nft.category || 'not set'}`)
        console.log(`   Source: ${nft.source}`)
        console.log(`   Created: ${nft.created_at ? new Date(nft.created_at.seconds * 1000).toLocaleString() : 'not set'}`)
        console.log('')
      }
    })
    
    console.log('📊 Network Distribution:')
    Object.entries(networkStats).forEach(([network, count]) => {
      console.log(`   ${network}: ${count} NFTs`)
    })
    console.log('')
    
    console.log('📊 Source Distribution:')
    Object.entries(sourceStats).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} NFTs`)
    })
    console.log('')
    
    console.log('📊 Wallet Distribution:')
    Object.entries(walletStats).forEach(([wallet, count]) => {
      console.log(`   ${wallet}: ${count} NFTs`)
    })
    console.log('')
    
    // Check current network filtering
    const expectedNetwork = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true' ? 'base-sepolia' : 'base'
    const nftsInExpectedNetwork = networkStats[expectedNetwork] || 0
    
    console.log('🎯 Network Filtering Analysis:')
    console.log(`   Expected network: ${expectedNetwork}`)
    console.log(`   NFTs in expected network: ${nftsInExpectedNetwork}`)
    console.log(`   NFTs in other networks: ${allNFTs.size - nftsInExpectedNetwork}`)
    console.log('')
    
    if (nftsInExpectedNetwork === 0) {
      console.log('❌ PROBLEM FOUND: No NFTs exist for the expected network!')
      console.log('   This explains why /explore shows empty.')
      console.log('')
      console.log('💡 Possible Solutions:')
      console.log('   1. Change NEXT_PUBLIC_IS_TESTING_MODE environment variable')
      console.log('   2. Create NFTs in the expected network')
      console.log('   3. Migrate existing NFTs to expected network')
      console.log('   4. Temporarily disable network filtering for testing')
    } else {
      console.log('✅ NFTs exist for expected network. Issue might be elsewhere.')
      console.log('')
      console.log('🔍 Additional checks needed:')
      console.log('   1. Check Firebase composite indexes are working')
      console.log('   2. Check API route is returning results correctly')
      console.log('   3. Check frontend is processing API response correctly')
    }
    
  } catch (error) {
    console.error('❌ Error debugging explore issue:', error)
  }
}

debugExploreIssue()
  .then(() => {
    console.log('✅ Debug analysis complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error)
    process.exit(1)
  })