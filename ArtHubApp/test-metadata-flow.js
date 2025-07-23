#!/usr/bin/env node

/**
 * Test script to verify claimable NFT metadata flow
 * This will help us trace where the metadata attachment is failing
 */

console.log('🔍 Testing Claimable NFT Metadata Flow...\n')

// Test 1: Check if we can fetch an existing claimable NFT from database
async function testDatabaseMetadata() {
  try {
    console.log('📊 Testing database metadata retrieval...')
    
    // Simulate what the claim API does
    const response = await fetch('http://localhost:3000/api/admin/nfts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Found', data.nfts?.length || 0, 'claimable NFTs in database')
      
      if (data.nfts && data.nfts.length > 0) {
        const nft = data.nfts[0]
        console.log('📋 First NFT metadata:')
        console.log('  - Title:', nft.title)
        console.log('  - Description:', nft.description) 
        console.log('  - Image URL:', nft.imageUrl || nft.image)
        console.log('  - Metadata URL:', nft.metadataUrl)
        console.log('  - Contract Address:', nft.contractAddress)
        console.log('  - Status:', nft.status)
        
        return nft
      }
    }
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  }
  return null
}

// Test 2: Check metadata URL content
async function testMetadataContent(metadataUrl) {
  if (!metadataUrl) {
    console.log('⚠️ No metadata URL to test')
    return
  }
  
  try {
    console.log('\n📄 Testing metadata URL content...')
    console.log('🔗 URL:', metadataUrl)
    
    // Handle different URL formats
    let testUrl = metadataUrl
    if (metadataUrl.startsWith('ipfs://')) {
      testUrl = metadataUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
      console.log('🔧 Converted to gateway URL:', testUrl)
    }
    
    const response = await fetch(testUrl)
    if (response.ok) {
      const metadata = await response.json()
      console.log('✅ Metadata JSON retrieved successfully:')
      console.log('  - Name:', metadata.name)
      console.log('  - Description:', metadata.description)
      console.log('  - Image:', metadata.image)
      console.log('  - Attributes:', metadata.attributes?.length || 0, 'attributes')
      
      return metadata
    } else {
      console.log('❌ Failed to fetch metadata:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Metadata content test failed:', error.message)
  }
}

// Test 3: Check what contract actually receives
async function testContractCall(contractAddress, metadataUrl) {
  if (!contractAddress || !metadataUrl) {
    console.log('⚠️ Missing contract address or metadata URL for contract test')
    return
  }
  
  try {
    console.log('\n🔗 Testing contract call simulation...')
    console.log('📍 Contract:', contractAddress)
    console.log('📄 Metadata URI that would be sent:', metadataUrl)
    
    // Simulate the gasless relay call
    const payload = {
      type: 'claimNFT',
      contractAddress: contractAddress,
      userAddress: '0x499D377eF114cC1BF7798cECBB38412701400daF', // Test user
      metadataURI: metadataUrl,
      chainId: 84532
    }
    
    console.log('📤 Payload that would be sent to gasless relay:')
    console.log(JSON.stringify(payload, null, 2))
    
  } catch (error) {
    console.error('❌ Contract test failed:', error.message)
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting metadata flow tests...\n')
  
  // Test 1: Database
  const nft = await testDatabaseMetadata()
  
  if (nft) {
    // Test 2: Metadata content  
    await testMetadataContent(nft.metadataUrl)
    
    // Test 3: Contract simulation
    await testContractCall(nft.contractAddress, nft.metadataUrl)
  }
  
  console.log('\n🏁 Test completed!')
  console.log('\nNext steps:')
  console.log('1. Check the metadata URL is accessible')
  console.log('2. Verify the URL format being sent to contract')
  console.log('3. Check contract logs during actual claiming')
}

// Run the tests
runTests().catch(console.error)