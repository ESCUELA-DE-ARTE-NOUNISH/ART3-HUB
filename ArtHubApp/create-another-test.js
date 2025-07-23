#!/usr/bin/env node

/**
 * Create another test NFT for debugging
 */

console.log('🛠️ Creating Another Test NFT...\n')

async function createTestNFT() {
  try {
    
    const nftData = {
      title: 'Final Fix Test',
      description: 'Testing the final IPFS hash-only fix',
      claimCode: 'DEBUGTEST3',
      startDate: new Date().toISOString(),
      endDate: null,
      maxClaims: 0,
      status: 'published',
      imageUrl: 'https://via.placeholder.com/500x500.png?text=Debug+Test+2'
    }
    
    const response = await fetch('http://localhost:3000/api/admin/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': '0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f'
      },
      body: JSON.stringify(nftData)
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ NFT created:', {
        id: result.nft?.id,
        claimCode: result.nft?.claimCode,
        contractAddress: result.nft?.contractAddress
      })
    } else {
      const errorData = await response.json()
      console.error('❌ Failed:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createTestNFT()