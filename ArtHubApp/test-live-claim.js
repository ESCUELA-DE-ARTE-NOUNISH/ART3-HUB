#!/usr/bin/env node

/**
 * Test live NFT claiming to see exactly what happens
 */

console.log('🧪 Testing Live NFT Claim...\n')

async function testLiveClaim() {
  try {
    const claimCode = 'DEBUGTEST3'
    const testUserWallet = '0x2222222222222222222222222222222222222222'
    
    console.log('📋 Test Parameters:')
    console.log('🔑 Claim Code:', claimCode)
    console.log('👤 Test User:', testUserWallet)
    console.log()
    
    // First verify the code
    console.log('🔍 Step 1: Verifying claim code...')
    const verifyResponse = await fetch(`http://localhost:3000/api/nfts/claim?code=${claimCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Mock session - in real app this would be from Privy
        'x-wallet-address': testUserWallet
      }
    })
    
    if (!verifyResponse.ok) {
      console.error('❌ Verification failed:', verifyResponse.status, verifyResponse.statusText)
      return
    }
    
    const verifyData = await verifyResponse.json()
    console.log('✅ Verification result:', {
      valid: verifyData.valid,
      message: verifyData.message,
      nft: verifyData.nft ? {
        title: verifyData.nft.title,
        id: verifyData.nft.id
      } : null
    })
    
    if (!verifyData.valid) {
      console.log('❌ Code verification failed, stopping test')
      return
    }
    
    console.log('\n🚀 Step 2: Attempting to claim NFT...')
    
    // Now try to claim
    const claimResponse = await fetch('http://localhost:3000/api/nfts/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': testUserWallet
      },
      body: JSON.stringify({
        claimCode
      })
    })
    
    console.log('📊 Claim response status:', claimResponse.status, claimResponse.statusText)
    
    if (claimResponse.ok) {
      const claimData = await claimResponse.json()
      console.log('✅ Claim successful!')
      console.log('📋 Results:', {
        success: claimData.success,
        txHash: claimData.txHash,
        tokenId: claimData.tokenId,
        contractAddress: claimData.contractAddress,
        message: claimData.message
      })
      
      // Now check what the blockchain explorer shows
      if (claimData.contractAddress && claimData.tokenId !== undefined) {
        console.log('\n🔗 Blockchain explorer URLs:')
        console.log(`📍 Contract: https://base-sepolia.blockscout.com/address/${claimData.contractAddress}`)
        console.log(`🎯 Token: https://base-sepolia.blockscout.com/token/${claimData.contractAddress}/instance/${claimData.tokenId}`)
        console.log('🔍 Check these URLs to see if metadata is attached!')
      }
      
    } else {
      try {
        const errorData = await claimResponse.json()
        console.error('❌ Claim failed:', errorData)
      } catch (e) {
        const errorText = await claimResponse.text()
        console.error('❌ Claim failed (non-JSON response):', errorText.substring(0, 200))
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

// Run the test
testLiveClaim()