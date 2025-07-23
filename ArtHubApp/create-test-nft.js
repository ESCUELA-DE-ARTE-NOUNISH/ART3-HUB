#!/usr/bin/env node

/**
 * Create a test NFT to debug metadata issues
 */

console.log('🛠️ Creating Test NFT for Metadata Debug...\n')

async function createTestNFT() {
  try {
    
    // Create a simple test NFT
    const nftData = {
      title: 'Metadata Test NFT',
      description: 'This NFT is created to test metadata attachment',
      claimCode: 'METADATATEST',
      startDate: new Date().toISOString(),
      endDate: null,
      maxClaims: 0,
      status: 'published',
      imageUrl: 'https://via.placeholder.com/400x400.png?text=Test+NFT'
    }
    
    console.log('📤 Creating NFT with data:', {
      title: nftData.title,
      claimCode: nftData.claimCode,
      imageUrl: nftData.imageUrl.substring(0, 50) + '...'
    })
    
    const response = await fetch('http://localhost:3000/api/admin/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f' // Admin wallet
      },
      body: JSON.stringify(nftData)
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ NFT created successfully!')
      console.log('📋 Result:', {
        success: result.success,
        id: result.nft?.id,
        title: result.nft?.title,
        claimCode: result.nft?.claimCode,
        status: result.nft?.status,
        metadataUrl: result.nft?.metadataUrl,
        contractAddress: result.nft?.contractAddress
      })
      
      if (result.nft?.contractAddress) {
        console.log('\n🎯 Ready for testing!')
        console.log('🔑 Claim Code:', result.nft.claimCode)
        console.log('📍 Contract:', result.nft.contractAddress)
      } else {
        console.log('\n⚠️ Contract not yet deployed, waiting for deployment...')
      }
      
    } else {
      const errorData = await response.json()
      console.error('❌ Failed to create NFT:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createTestNFT()