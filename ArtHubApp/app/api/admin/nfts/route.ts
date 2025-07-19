import { NextRequest, NextResponse } from 'next/server'
import { NFTClaimService } from '@/lib/services/nft-claim-service'
import { getSessionUserAddress } from '@/lib/utils'
import { isFirebaseConfigured } from '@/lib/firebase'
import { base, baseSepolia } from '@/lib/wagmi'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// List all NFTs or create a new one
export async function GET(req: NextRequest) {
  try {
    const nfts = await NFTClaimService.getAllClaimableNFTs()
    return NextResponse.json({ nfts })
  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 })
  }
}

// Create a new NFT with contract deployment
export async function POST(req: NextRequest) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Service not available' }, { status: 503 })
    }
    
    const body = await req.json()
    const { title, description, claimCode, startDate, endDate, status, maxClaims, network, image } = body
    
    // Validate required fields
    if (!title || !description || !claimCode || !startDate) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, description, claimCode, startDate' 
      }, { status: 400 })
    }
    
    // Get wallet address from session
    const userAddress = await getSessionUserAddress(req)
    if (!userAddress) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Check admin authorization
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase()
    if (!adminWallet || userAddress.toLowerCase() !== adminWallet) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    let contractAddress = null
    let deploymentTxHash = null
    
    // If status is published, deploy a real contract via factory
    if (status === 'published') {
      try {
        console.log('🚀 Deploying claimable NFT contract via factory...')
        
        // Get network configuration
        const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
        const targetChain = isTestingMode ? baseSepolia : base
        
        // Get ClaimableNFT Factory address
        const factoryAddress = isTestingMode 
          ? process.env.NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532
          : process.env.NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_8453
        
        if (!factoryAddress) {
          throw new Error(`
            ❌ ClaimableNFT Factory not configured for ${targetChain.name}!
            
            To fix this:
            1. Deploy the factory using: npx hardhat run scripts/deploy-claimable-nft-factory.ts --network ${isTestingMode ? 'baseSepolia' : 'base'}
            2. Add the factory address to your .env file:
               ${isTestingMode ? 'NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532' : 'NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_8453'}=<factory_address>
            3. Restart your development server
          `)
        }

        // Deploy new claimable NFT contract via gasless relayer
        const deploymentResult = await deployClaimableNFTViaGaslessRelay({
          title,
          description,
          creatorAddress: userAddress,
          chainId: Number(targetChain.id),
          claimCode
        })
        
        contractAddress = deploymentResult.contractAddress
        deploymentTxHash = deploymentResult.txHash
        
        console.log('✅ Claimable NFT contract deployed via factory:', { 
          contractAddress, 
          deploymentTxHash,
          network: targetChain.name,
          factoryAddress
        })
        
      } catch (error) {
        console.error('❌ Contract deployment failed:', error)
        return NextResponse.json({ 
          error: 'Failed to deploy contract. Please try again.' 
        }, { status: 500 })
      }
    }
    
    // Create NFT record with contract information
    const nft = await NFTClaimService.createClaimableNFT({
      title,
      description,
      image,
      claimCode,
      startDate,
      endDate: endDate || null,
      status: status || 'draft',
      maxClaims,
      network,
      contractAddress,
      deploymentTxHash
    }, userAddress)
    
    return NextResponse.json({ 
      nft,
      contractDeployment: contractAddress ? {
        contractAddress,
        txHash: deploymentTxHash,
        network: network || 'base'
      } : null
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating NFT:', error)
    return NextResponse.json({ error: 'Failed to create NFT' }, { status: 500 })
  }
}

// Function to deploy a claimable NFT contract via gasless relayer
async function deployClaimableNFTViaGaslessRelay({
  title,
  description,
  creatorAddress,
  chainId,
  claimCode
}: {
  title: string
  description: string
  creatorAddress: string
  chainId: number
  claimCode: string
}) {
  try {
    console.log('🚀 Deploying claimable NFT via gasless relayer...')
    
    // Generate symbol from title
    const symbol = title
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10) || 'CLAIM'
    
    // Call gasless relayer to deploy the claimable NFT
    const gaslessResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/gasless-relay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'deployClaimableNFT',
        name: title,
        symbol: symbol,
        baseTokenURI: 'https://ipfs.io/ipfs/', // Will be updated after IPFS upload
        userAddress: creatorAddress,
        chainId: chainId
      })
    })
    
    if (!gaslessResponse.ok) {
      const errorData = await gaslessResponse.json()
      throw new Error(`Gasless deployment failed: ${errorData.error || errorData.message}`)
    }
    
    const deploymentResult = await gaslessResponse.json()
    console.log('✅ Gasless deployment successful:', deploymentResult)
    
    if (!deploymentResult.contractAddress) {
      throw new Error('No contract address returned from gasless deployment')
    }
    
    // Now add the claim code to the deployed contract
    console.log('📝 Adding claim code to deployed contract...')
    
    const currentTime = Math.floor(Date.now() / 1000)
    const endTime = currentTime + (365 * 24 * 60 * 60) // 1 year from now
    
    const addClaimCodeResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/gasless-relay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'addClaimCode',
        contractAddress: deploymentResult.contractAddress,
        claimCode: claimCode,
        maxClaims: 0, // Unlimited for now
        startTime: currentTime,
        endTime: endTime,
        metadataURI: 'https://ipfs.io/ipfs/', // Will be updated after IPFS upload
        chainId: chainId
      })
    })
    
    if (!addClaimCodeResponse.ok) {
      const errorData = await addClaimCodeResponse.json()
      console.warn('⚠️ Failed to add claim code:', errorData.error || errorData.message)
      // Don't throw here, the contract is deployed successfully
    } else {
      const claimCodeResult = await addClaimCodeResponse.json()
      console.log('✅ Claim code added successfully:', claimCodeResult)
    }
    
    return {
      contractAddress: deploymentResult.contractAddress,
      txHash: deploymentResult.transactionHash,
      receipt: deploymentResult
    }
    
  } catch (error) {
    console.error('Error deploying claimable NFT via gasless relayer:', error)
    throw error
  }
} 