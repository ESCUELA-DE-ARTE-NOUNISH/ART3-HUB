#!/usr/bin/env node

/**
 * Check what tokenURI is actually set on the contract
 */

import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
})

const CONTRACT_ADDRESS = '0xa2a88c1b419b705f8033166941a20d40654d18a1'
const TOKEN_ID = 0

const ERC721_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf', 
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
]

async function checkTokenURI() {
  try {
    console.log('🔍 Checking tokenURI for NFT...')
    console.log('📍 Contract:', CONTRACT_ADDRESS)
    console.log('🎯 Token ID:', TOKEN_ID)
    console.log()
    
    // Check owner
    const owner = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ERC721_ABI,
      functionName: 'ownerOf',
      args: [BigInt(TOKEN_ID)]
    })
    
    console.log('👤 Owner:', owner)
    
    // Check tokenURI
    const tokenURI = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ERC721_ABI,
      functionName: 'tokenURI',
      args: [BigInt(TOKEN_ID)]
    })
    
    console.log('📄 TokenURI:', tokenURI)
    
    // Test if the URI is accessible
    if (tokenURI && tokenURI.startsWith('http')) {
      console.log('\n🧪 Testing tokenURI accessibility...')
      try {
        const response = await fetch(tokenURI)
        if (response.ok) {
          const metadata = await response.json()
          console.log('✅ Metadata accessible!')
          console.log('📋 Metadata content:')
          console.log('  - Name:', metadata.name)
          console.log('  - Description:', metadata.description)
          console.log('  - Image:', metadata.image?.substring(0, 50) + '...')
        } else {
          console.log('❌ TokenURI not accessible:', response.status, response.statusText)
        }
      } catch (error) {
        console.log('❌ Error fetching tokenURI:', error.message)
      }
    } else if (tokenURI && tokenURI.startsWith('ipfs://')) {
      console.log('🔧 Converting IPFS URL for testing...')
      const httpUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
      console.log('🌐 HTTP URL:', httpUrl)
      
      try {
        const response = await fetch(httpUrl)
        if (response.ok) {
          const metadata = await response.json()
          console.log('✅ Metadata accessible via HTTP gateway!')
          console.log('📋 Metadata content:')
          console.log('  - Name:', metadata.name)
          console.log('  - Description:', metadata.description)
          console.log('  - Image:', metadata.image?.substring(0, 50) + '...')
        } else {
          console.log('❌ TokenURI not accessible via HTTP gateway:', response.status)
        }
      } catch (error) {
        console.log('❌ Error fetching via HTTP gateway:', error.message)
      }
    } else {
      console.log('⚠️ TokenURI is empty or invalid format:', tokenURI)
    }
    
  } catch (error) {
    console.error('❌ Error checking contract:', error.message)
    
    // More detailed error info
    if (error.cause) {
      console.error('❌ Cause:', error.cause)
    }
  }
}

checkTokenURI()