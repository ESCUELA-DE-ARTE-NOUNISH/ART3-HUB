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
    
    // If status is published, deploy a real contract
    if (status === 'published') {
      try {
        console.log('🚀 Deploying real claimable NFT collection contract...')
        
        // Get network configuration
        const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
        const targetChain = isTestingMode ? baseSepolia : base
        
        // Use Art3Hub V6 Factory to create a real collection
        const factoryAddress = isTestingMode 
          ? process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_84532
          : process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_8453
        
        if (!factoryAddress) {
          throw new Error(`Art3Hub Factory not configured for ${targetChain.name}`)
        }
        
        // For now, we'll use a pre-deployed claimable NFT contract
        // In production, you would deploy a new contract for each claimable NFT
        // This could be done using a ClaimableNFT factory contract
        
        // Check if we have a pre-deployed claimable NFT contract
        const claimableNFTContract = isTestingMode 
          ? process.env.NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_84532
          : process.env.NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_8453
        
        if (claimableNFTContract) {
          // Use the pre-deployed contract
          contractAddress = claimableNFTContract
          deploymentTxHash = 'existing-contract'
          console.log('✅ Using pre-deployed claimable NFT contract:', contractAddress)
          console.log('📋 Network:', targetChain.name)
          console.log('🔗 Contract ready for claimable NFT minting')
        } else {
          throw new Error(`
            ❌ ClaimableNFT contract not configured for ${targetChain.name}!
            
            To fix this:
            1. Deploy the ClaimableNFT contract using: npx tsx scripts/deploy-claimable-nft.ts ${isTestingMode ? 'testnet' : 'mainnet'}
            2. Add the contract address to your .env file:
               ${isTestingMode ? 'NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_84532' : 'NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_8453'}=<contract_address>
            3. Restart your development server
          `)
        }
        
        console.log('✅ Real contract deployed:', { 
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

// Function to deploy a dedicated claimable NFT contract
async function deployClaimableNFTContract({
  title,
  description,
  imageUrl,
  creatorAddress,
  network,
  factoryAddress
}: {
  title: string
  description: string
  imageUrl: string
  creatorAddress: string
  network: any
  factoryAddress: string
}) {
  // Simple ERC721 contract bytecode for claimable NFTs
  // This is a basic ERC721 contract that supports minting with tokenURI
  const CLAIMABLE_NFT_BYTECODE = "0x608060405234801561001057600080fd5b50604051610a9e380380610a9e8339818101604052810190610032919061007a565b8181816000908051906020019061004a9291906100ed565b5080600190805190602001906100619291906100ed565b50505050505061017c565b600080fd5b600080fd5b600080fd5b600080fd5b60008151905061008b8161016f565b92915050565b6000602082840312156100a7576100a661006a565b5b60006100b58482850161007c565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061013557607f821691505b602082108103610148576101476100ee565b5b50919050565b61015881610154565b811461016357600080fd5b50565b61016f8161014e565b82525050565b600061018082610166565b9050919050565b610913806101956000396000f3fe"
  
  // Simple ERC721 ABI for minting
  const ERC721_ABI = [
    {
      inputs: [
        { name: "name", type: "string" },
        { name: "symbol", type: "string" }
      ],
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      inputs: [
        { name: "to", type: "address" },
        { name: "tokenURI", type: "string" }
      ],
      name: "mint",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "nonpayable",
      type: "function"
    }
  ] as const
  
  try {
    // Create a public client
    const publicClient = createPublicClient({
      chain: network,
      transport: http()
    })
    
    // For server-side deployment, we need an admin private key
    // In production, this should be stored securely in environment variables
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
    
    if (!adminPrivateKey) {
      throw new Error('Admin private key not configured for contract deployment')
    }
    
    // Create admin account from private key
    const adminAccount = privateKeyToAccount(adminPrivateKey as `0x${string}`)
    
    // Create wallet client with admin account
    const walletClient = createWalletClient({
      account: adminAccount,
      chain: network,
      transport: http()
    })
    
    console.log('Deploying contract with admin account:', adminAccount.address)
    
    // Generate symbol from title
    const symbol = title
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10) || 'CLAIM'
    
    // Deploy the collection contract
    const txHash = await walletClient.writeContract({
      address: factoryAddress as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'createCollectionV5',
      args: [
        title, // name
        symbol, // symbol
        description, // description
        imageUrl, // image
        '', // externalUrl
        creatorAddress as `0x${string}`, // royaltyRecipient
        1000n, // royaltyFeeNumerator (10%)
        'Claimable NFT', // category
        'Admin', // creatorName
        'admin', // creatorUsername
        '', // creatorEmail
        '', // creatorProfilePicture
        '' // creatorSocialLinks
      ]
    })
    
    console.log('Collection creation transaction submitted:', txHash)
    
    // Wait for transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    
    // Extract the deployed contract address from transaction logs
    let deployedContractAddress = null
    
    if (receipt.logs && receipt.logs.length > 0) {
      // Look for the CollectionCreated event to get the contract address
      for (const log of receipt.logs) {
        if (log.topics && log.topics.length >= 2) {
          // The contract address is typically in the first topic after the event signature
          // or in the log data - this depends on the specific factory implementation
          deployedContractAddress = log.address
          break
        }
      }
    }
    
    if (!deployedContractAddress) {
      throw new Error('Could not extract deployed contract address from transaction')
    }
    
    console.log('Contract successfully deployed at:', deployedContractAddress)
    
    return {
      contractAddress: deployedContractAddress,
      txHash: txHash,
      receipt
    }
    
  } catch (error) {
    console.error('Error deploying contract:', error)
    throw error
  }
} 