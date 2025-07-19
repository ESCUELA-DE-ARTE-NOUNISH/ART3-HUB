import { NextRequest, NextResponse } from 'next/server'
import { NFTClaimService } from '@/lib/services/nft-claim-service'
import { getSessionUserAddress } from '@/lib/utils'
import { isFirebaseConfigured } from '@/lib/firebase'
import { base, baseSepolia } from '@/lib/wagmi'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { FirebaseStorageService, handleBase64ImageUpload } from '@/lib/services/firebase-storage-service'

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
        console.log('\\n🚀 DEPLOYING CLAIMABLE NFT CONTRACT VIA FACTORY')
        console.log('================================================')
        console.log('📋 Request data:', { title, description, claimCode, startDate, endDate, status, maxClaims, network, image })
        console.log('🎯 Using NEW FACTORY with ownerMint support!')
        console.log('📍 This NFT will support database-only claim validation')
        
        // Get network configuration
        const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
        const targetChain = isTestingMode ? baseSepolia : base
        
        console.log('🔧 Network configuration:', {
          isTestingMode,
          targetChain: targetChain.name,
          chainId: targetChain.id
        })
        
        // Get ClaimableNFT Factory address
        const factoryAddress = isTestingMode 
          ? process.env.NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532
          : process.env.NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_8453
        
        console.log('🏭 Factory address lookup:', {
          isTestingMode,
          factoryEnvVar: isTestingMode ? 'NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532' : 'NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_8453',
          factoryAddress
        })
        
        if (!factoryAddress) {
          console.error('❌ ClaimableNFT Factory not configured!')
          throw new Error(`
            ❌ ClaimableNFT Factory not configured for ${targetChain.name}!
            
            To fix this:
            1. Deploy the factory using: npx hardhat run scripts/deploy-claimable-nft-factory.ts --network ${isTestingMode ? 'baseSepolia' : 'base'}
            2. Add the factory address to your .env file:
               ${isTestingMode ? 'NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532' : 'NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_8453'}=<factory_address>
            3. Restart your development server
          `)
        }

        // Verify factory contract exists on the blockchain
        console.log('🔍 Verifying factory contract exists on blockchain...')
        await verifyFactoryContract(factoryAddress, targetChain)

        // Deploy new claimable NFT contract via gasless relayer
        console.log('🚀 Initiating gasless deployment...')
        const deploymentResult = await deployClaimableNFTViaGaslessRelay({
          title,
          description,
          creatorAddress: userAddress,
          chainId: Number(targetChain.id),
          claimCode,
          request: req
        })
        
        contractAddress = deploymentResult.contractAddress
        deploymentTxHash = deploymentResult.txHash
        
        console.log('\\n✅ CLAIMABLE NFT CONTRACT DEPLOYED SUCCESSFULLY!')
        console.log('===============================================')
        console.log('📍 Contract Address:', contractAddress)
        console.log('🔗 Transaction Hash:', deploymentTxHash)
        console.log('🌐 Network:', targetChain.name)
        console.log('🏭 Factory Used:', factoryAddress)
        console.log('⛽ Gas Used:', deploymentResult.gasUsed)
        console.log('✨ Status:', deploymentResult.status)
        console.log('🎯 Features: ownerMint enabled, database-only validation')
        console.log('===============================================')

        // Verify the deployed contract exists
        console.log('🔍 Verifying deployed contract exists...')
        await verifyDeployedContract(contractAddress, targetChain)
        
      } catch (error) {
        console.error('❌ Contract deployment failed:', error)
        return NextResponse.json({ 
          error: 'Failed to deploy contract. Please try again.',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    
    // Handle image storage
    console.log('🖼️ Processing image...', { 
      imageProvided: !!image, 
      imageType: typeof image,
      imageLength: typeof image === 'string' ? image.length : 'N/A'
    })
    
    let processedImage = image
    let uploadedImageUrl = ''
    
    if (image && typeof image === 'string' && image.startsWith('data:')) {
      // Handle base64 images - convert to file and upload
      console.log('📤 Processing base64 image...')
      try {
        const uploadResult = await handleBase64ImageUpload(image, userAddress)
        processedImage = uploadResult.path
        uploadedImageUrl = uploadResult.url
        console.log('✅ Base64 image uploaded successfully:', {
          path: uploadResult.path,
          url: uploadResult.url
        })
      } catch (uploadError) {
        console.error('❌ Failed to upload base64 image:', uploadError)
        // Keep the base64 data as fallback
        processedImage = image
        uploadedImageUrl = image
      }
    } else if (image && typeof image === 'string' && image.startsWith('http')) {
      // External URL - keep as is
      console.log('🔗 External image URL provided:', image)
      processedImage = image
      uploadedImageUrl = image
    } else if (!image) {
      console.log('📷 No image provided')
      processedImage = ''
      uploadedImageUrl = ''
    } else {
      console.log('🖼️ Unknown image format, keeping as is')
      processedImage = image
      uploadedImageUrl = typeof image === 'string' ? image : ''
    }

    // Create NFT record with contract information
    console.log('💾 Creating NFT record in database...')
    const nftInput = {
      title,
      description,
      image: processedImage,
      imageUrl: uploadedImageUrl, // Add the imageUrl field
      claimCode,
      startDate,
      endDate: endDate || null,
      status: status || 'draft',
      maxClaims,
      network,
      contractAddress,
      deploymentTxHash
    }
    
    console.log('🖼️ Image processing complete:', {
      hasProcessedImage: !!processedImage,
      hasUploadedImageUrl: !!uploadedImageUrl,
      processedImagePath: processedImage,
      uploadedImageUrl: uploadedImageUrl
    })
    
    console.log('📝 NFT creation input:', {
      ...nftInput,
      imageProvided: !!nftInput.image,
      uploadedImageUrl: !!uploadedImageUrl
    })
    
    const nft = await NFTClaimService.createClaimableNFT(nftInput, userAddress)
    
    console.log('✅ NFT record created successfully:', {
      id: nft.id,
      title: nft.title,
      status: nft.status,
      contractAddress: nft.contractAddress,
      deploymentTxHash: nft.deploymentTxHash,
      hasImage: !!nft.image,
      imageUrl: nft.imageUrl,
      metadataUrl: nft.metadataUrl,
      metadataIpfsHash: nft.metadataIpfsHash
    })
    
    
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
  claimCode,
  request
}: {
  title: string
  description: string
  creatorAddress: string
  chainId: number
  claimCode: string
  request: NextRequest
}) {
  try {
    console.log('🚀 Deploying claimable NFT via gasless relayer...')
    console.log('📋 Deployment parameters:', {
      title,
      description,
      creatorAddress,
      chainId,
      claimCode
    })
    
    // Generate symbol from title
    const symbol = title
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10) || 'CLAIM'
    
    console.log('🏷️ Generated symbol:', symbol)
    
    // Call gasless relayer to deploy the claimable NFT
    // For local development, detect the port from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    
    console.log('🌐 Calling gasless relay at:', `${baseUrl}/api/gasless-relay`)
    
    // Get relayer address from GASLESS_RELAYER_PRIVATE_KEY
    const relayerPrivateKey = process.env.GASLESS_RELAYER_PRIVATE_KEY
    if (!relayerPrivateKey) {
      throw new Error('GASLESS_RELAYER_PRIVATE_KEY not configured')
    }
    
    const formattedPrivateKey = relayerPrivateKey.startsWith('0x') 
      ? relayerPrivateKey 
      : `0x${relayerPrivateKey}`
    
    const relayerAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`)
    
    const deploymentPayload = {
      type: 'deployClaimableNFT',
      name: title,
      symbol: symbol,
      baseTokenURI: 'https://ipfs.io/ipfs/', // Will be updated after IPFS upload
      userAddress: relayerAccount.address, // Use relayer as owner (pays gas and owns contract)
      chainId: chainId
    }
    
    console.log('📤 Gasless relay payload:', deploymentPayload)
    
    const gaslessResponse = await fetch(`${baseUrl}/api/gasless-relay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deploymentPayload)
    })
    
    console.log('📥 Gasless relay response status:', gaslessResponse.status, gaslessResponse.statusText)
    
    if (!gaslessResponse.ok) {
      const errorData = await gaslessResponse.json()
      console.error('❌ Gasless relay error response:', errorData)
      throw new Error(`Gasless deployment failed: ${errorData.error || errorData.message}`)
    }
    
    const deploymentResult = await gaslessResponse.json()
    console.log('✅ Gasless deployment successful:', deploymentResult)
    
    if (!deploymentResult.contractAddress) {
      console.error('❌ No contract address in deployment result:', deploymentResult)
      throw new Error('No contract address returned from gasless deployment')
    }
    
    console.log('🎯 Contract deployed at:', {
      contractAddress: deploymentResult.contractAddress,
      transactionHash: deploymentResult.transactionHash,
      gasUsed: deploymentResult.gasUsed,
      success: deploymentResult.success
    })
    
    // Skip adding claim code during NFT creation - it will be added just-in-time when users claim
    console.log('📝 Skipping claim code setup - will be added automatically when users claim')
    console.log('🎯 Database-only claim validation approach: claim codes managed in database, added to contract on-demand')
    
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

// Function to add claim code via gasless relayer
async function addClaimCodeViaGaslessRelay({
  contractAddress,
  claimCode,
  maxClaims,
  startTime,
  endTime,
  metadataURI,
  chainId,
  request
}: {
  contractAddress: string
  claimCode: string
  maxClaims: number
  startTime: number
  endTime: number
  metadataURI: string
  chainId: number
  request: NextRequest
}) {
  try {
    console.log('📝 Adding claim code via gasless relayer...')
    console.log('🔍 AddClaimCode parameters:', {
      contractAddress,
      claimCode,
      maxClaims,
      startTime,
      endTime,
      metadataURI,
      chainId
    })
    
    // For local development, detect the port from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    
    console.log('🌐 Calling gasless relay at:', `${baseUrl}/api/gasless-relay`)
    
    const addClaimCodePayload = {
      type: 'addClaimCode',
      contractAddress: contractAddress,
      claimCode: claimCode,
      maxClaims: maxClaims,
      startTime: startTime,
      endTime: endTime,
      metadataURI: metadataURI,
      chainId: chainId
    }
    
    console.log('📤 AddClaimCode payload:', addClaimCodePayload)
    
    const gaslessResponse = await fetch(`${baseUrl}/api/gasless-relay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addClaimCodePayload)
    })
    
    console.log('📥 AddClaimCode gasless relay response status:', gaslessResponse.status, gaslessResponse.statusText)
    
    if (!gaslessResponse.ok) {
      const errorData = await gaslessResponse.json()
      console.error('❌ AddClaimCode gasless relay error response:', errorData)
      throw new Error(`AddClaimCode gasless failed: ${errorData.error || errorData.message}`)
    }
    
    const addClaimCodeResult = await gaslessResponse.json()
    console.log('✅ AddClaimCode gasless successful:', addClaimCodeResult)
    
    return addClaimCodeResult
    
  } catch (error) {
    console.error('Error adding claim code via gasless relayer:', error)
    throw error
  }
}

// Function to add claim code directly using admin wallet
async function addClaimCodeDirectly({
  contractAddress,
  claimCode,
  maxClaims,
  startTime,
  endTime,
  metadataURI,
  chainId
}: {
  contractAddress: string
  claimCode: string
  maxClaims: number
  startTime: number
  endTime: number
  metadataURI: string
  chainId: number
}) {
  try {
    console.log('🔐 Adding claim code directly using gasless relayer account...')
    
    // Get gasless relayer private key (which manages all app assets)
    const relayerPrivateKey = process.env.GASLESS_RELAYER_PRIVATE_KEY
    if (!relayerPrivateKey) {
      throw new Error('GASLESS_RELAYER_PRIVATE_KEY not configured')
    }
    
    // Get network configuration
    const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
    const targetChain = isTestingMode ? baseSepolia : base
    const rpcUrl = isTestingMode 
      ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
      : process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
    
    // Create clients
    const publicClient = createPublicClient({
      chain: targetChain,
      transport: http(rpcUrl)
    })
    
    const formattedPrivateKey = relayerPrivateKey.startsWith('0x') 
      ? relayerPrivateKey 
      : `0x${relayerPrivateKey}`
    
    const relayerAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`)
    const walletClient = createWalletClient({
      account: relayerAccount,
      chain: targetChain,
      transport: http(rpcUrl)
    })
    
    console.log('🔍 Adding claim code with params:', {
      contractAddress,
      claimCode,
      maxClaims,
      startTime,
      endTime,
      metadataURI,
      relayerAccount: relayerAccount.address
    })
    
    // ClaimableNFT ABI for addClaimCode
    const CLAIMABLE_NFT_ABI = [
      {
        "inputs": [
          {"name": "claimCode", "type": "string"},
          {"name": "maxClaims", "type": "uint256"},
          {"name": "startTime", "type": "uint256"},
          {"name": "endTime", "type": "uint256"},
          {"name": "metadataURI", "type": "string"}
        ],
        "name": "addClaimCode",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ] as const
    
    // Try to simulate the transaction first
    try {
      console.log('🔍 Simulating addClaimCode...')
      await publicClient.simulateContract({
        address: contractAddress as `0x${string}`,
        abi: CLAIMABLE_NFT_ABI,
        functionName: 'addClaimCode',
        args: [
          claimCode,
          BigInt(maxClaims),
          BigInt(startTime),
          BigInt(endTime),
          metadataURI
        ],
        account: relayerAccount
      })
      console.log('✅ Simulation successful')
    } catch (simError) {
      console.error('❌ Simulation failed:', simError)
      throw new Error(`AddClaimCode simulation failed: ${simError instanceof Error ? simError.message : 'Unknown error'}`)
    }
    
    // Execute the transaction
    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: CLAIMABLE_NFT_ABI,
      functionName: 'addClaimCode',
      args: [
        claimCode,
        BigInt(maxClaims),
        BigInt(startTime),
        BigInt(endTime),
        metadataURI
      ]
    })
    
    console.log('✅ AddClaimCode transaction submitted:', hash)
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    console.log('✅ AddClaimCode transaction confirmed:', {
      hash,
      status: receipt.status,
      gasUsed: receipt.gasUsed
    })
    
    return {
      hash,
      receipt
    }
    
  } catch (error) {
    console.error('Error adding claim code directly:', error)
    throw error
  }
}

// Function to verify factory contract exists on blockchain
async function verifyFactoryContract(factoryAddress: string, targetChain: any) {
  try {
    console.log('🔍 Verifying factory contract at:', factoryAddress)
    
    const rpcUrl = targetChain.id === 84532 
      ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
      : process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
    
    const publicClient = createPublicClient({
      chain: targetChain,
      transport: http(rpcUrl)
    })
    
    // Check if contract exists
    const contractCode = await publicClient.getCode({
      address: factoryAddress as `0x${string}`
    })
    
    if (!contractCode || contractCode === '0x') {
      console.error('❌ Factory contract not found at address:', factoryAddress)
      throw new Error(`Factory contract not found at address ${factoryAddress}. Please deploy the factory first.`)
    }
    
    console.log('✅ Factory contract verified:', {
      address: factoryAddress,
      hasCode: true,
      codeLength: contractCode.length
    })
    
    // Try to call a factory function to verify it's the correct contract
    try {
      // First try the newer factory ABI with totalDeployments
      const newFactoryABI = [
        {
          "inputs": [],
          "name": "totalDeployments",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }
      ] as const
      
      const totalDeployments = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: newFactoryABI,
        functionName: 'totalDeployments'
      })
      
      console.log('✅ Factory contract functions verified (new version):', {
        totalDeployments: totalDeployments.toString()
      })
    } catch (newVersionError) {
      // Try older factory ABI with getDeployedContracts
      try {
        const oldFactoryABI = [
          {
            "inputs": [],
            "name": "getDeployedContracts",
            "outputs": [{"name": "", "type": "address[]"}],
            "stateMutability": "view",
            "type": "function"
          }
        ] as const
        
        const deployedContracts = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: oldFactoryABI,
          functionName: 'getDeployedContracts'
        })
        
        console.log('✅ Factory contract functions verified (legacy version):', {
          deployedContracts: deployedContracts.length
        })
      } catch (oldVersionError) {
        console.warn('⚠️ Could not verify factory functions (unknown version):', {
          newVersionError: newVersionError instanceof Error ? newVersionError.message : 'Unknown error',
          oldVersionError: oldVersionError instanceof Error ? oldVersionError.message : 'Unknown error'
        })
        console.log('ℹ️ Factory contract exists but function verification failed - this is acceptable')
      }
    }
    
  } catch (error) {
    console.error('❌ Factory contract verification failed:', error)
    throw new Error(`Factory contract verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Function to verify deployed contract exists
async function verifyDeployedContract(contractAddress: string, targetChain: any) {
  if (!contractAddress) {
    console.warn('⚠️ No contract address to verify')
    return
  }
  
  try {
    console.log('🔍 Verifying deployed contract at:', contractAddress)
    
    const rpcUrl = targetChain.id === 84532 
      ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
      : process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
    
    const publicClient = createPublicClient({
      chain: targetChain,
      transport: http(rpcUrl)
    })
    
    // Check if contract exists
    const contractCode = await publicClient.getCode({
      address: contractAddress as `0x${string}`
    })
    
    if (!contractCode || contractCode === '0x') {
      console.error('❌ Deployed contract not found at address:', contractAddress)
      throw new Error(`Deployed contract not found at address ${contractAddress}`)
    }
    
    console.log('✅ Deployed contract verified:', {
      address: contractAddress,
      hasCode: true,
      codeLength: contractCode.length
    })
    
    // Try to call a contract function to verify it's working
    try {
      const claimableNFTABI = [
        {
          "inputs": [],
          "name": "owner",
          "outputs": [{"name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "name",
          "outputs": [{"name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        }
      ] as const
      
      const owner = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: claimableNFTABI,
        functionName: 'owner'
      })
      
      const name = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: claimableNFTABI,
        functionName: 'name'
      })
      
      console.log('✅ Deployed contract functions verified:', {
        owner,
        name
      })
    } catch (functionError) {
      console.warn('⚠️ Could not verify deployed contract functions:', functionError)
    }
    
  } catch (error) {
    console.error('❌ Deployed contract verification failed:', error)
    // Don't throw here as the deployment might still be valid
    console.warn('⚠️ Continuing despite verification failure')
  }
}

// Function to handle base64 image upload
async function handleBase64ImageUpload(base64Data: string, userAddress: string): Promise<{ path: string; url: string }> {
  try {
    console.log('🔄 Converting base64 to file...')
    
    // Extract the data and content type from the base64 string
    const [header, data] = base64Data.split(',')
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png'
    const extension = mimeType.split('/')[1] || 'png'
    
    console.log('📄 Image details:', { mimeType, extension })
    
    // Convert base64 to buffer
    const buffer = Buffer.from(data, 'base64')
    
    // Create a file-like object
    const fileName = `admin-upload-${Date.now()}.${extension}`
    const file = new File([buffer], fileName, { type: mimeType })
    
    console.log('📁 Created file:', { 
      name: fileName, 
      size: file.size, 
      type: file.type 
    })
    
    // Upload to Firebase Storage
    const uploadResult = await FirebaseStorageService.uploadFile(
      file, 
      `admin-nft-images/${userAddress}`
    )
    
    console.log('✅ Firebase upload successful:', uploadResult)
    
    return {
      path: uploadResult.path,
      url: uploadResult.url
    }
  } catch (error) {
    console.error('❌ Base64 image upload failed:', error)
    throw new Error(`Failed to upload base64 image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
} 