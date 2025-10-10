import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseUnits, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base, baseSepolia } from 'viem/chains'
import { FirebaseNFTService } from '@/lib/services/firebase-nft-service'
import { FirebaseSalesService } from '@/lib/services/firebase-sales-service'

// ERC20 USDC ABI
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// NFT Factory V6 ABI (correct V6 functions)
const FACTORY_V6_ABI = [
  {
    inputs: [
      { name: 'creator', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'image', type: 'string' },
      { name: 'externalUrl', type: 'string' },
      { name: 'royaltyRecipient', type: 'address' },
      { name: 'royaltyFeeNumerator', type: 'uint96' }
    ],
    name: 'createCollectionV6Gasless',
    outputs: [
      { name: '', type: 'address' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'collection', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' }
    ],
    name: 'mintNFTV6Gasless',
    outputs: [
      { name: '', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

function getUSDCAddress(isTestnet: boolean): Address {
  // Base Mainnet USDC
  if (!isTestnet) {
    return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address
  }
  // Base Sepolia USDC (mock or testnet USDC)
  return '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address
}

function getFactoryAddress(isTestnet: boolean): Address {
  if (!isTestnet) {
    return '0x8E8f86a2e5BCb6436474833764B3C68cEF89D18D' as Address // Base mainnet
  }
  return '0x87DfC71B55a41825fe8EAA8a8724D8982b92DeBe' as Address // Base Sepolia
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📥 Received collect-nft request body:', JSON.stringify(body, null, 2))

    const {
      nftId,
      collectorAddress,
      amountUSDC,
      artistAddress,
      metadata
    } = body

    console.log('🔍 Extracted fields:', {
      nftId,
      collectorAddress,
      amountUSDC,
      artistAddress,
      metadata
    })

    // Validation
    if (!nftId || !collectorAddress || !amountUSDC || !artistAddress || !metadata) {
      console.error('❌ Validation failed - missing fields:', {
        hasNftId: !!nftId,
        hasCollectorAddress: !!collectorAddress,
        hasAmountUSDC: !!amountUSDC,
        hasArtistAddress: !!artistAddress,
        hasMetadata: !!metadata
      })
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amountUSDC < 1) {
      return NextResponse.json(
        { success: false, message: 'Amount must be at least $1 USDC' },
        { status: 400 }
      )
    }

    console.log('🎨 Gallery NFT Collection Request:', {
      nftId,
      collectorAddress,
      amountUSDC,
      artistAddress
    })

    // Network configuration
    const isTestnet = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
    const chain = isTestnet ? baseSepolia : base
    const rpcUrl = isTestnet
      ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
      : process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'

    const treasuryWallet = process.env.NEXT_PUBLIC_TREASURY_WALLET as Address
    const gaslessRelayerKey = process.env.GASLESS_RELAYER_PRIVATE_KEY

    if (!treasuryWallet || !gaslessRelayerKey) {
      throw new Error('Missing treasury wallet or relayer configuration')
    }

    // Initialize clients
    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })

    const relayerAccount = privateKeyToAccount(`0x${gaslessRelayerKey}` as `0x${string}`)
    const walletClient = createWalletClient({
      account: relayerAccount,
      chain,
      transport: http(rpcUrl)
    })

    // USDC contract addresses
    const usdcAddress = getUSDCAddress(isTestnet)
    const factoryAddress = getFactoryAddress(isTestnet)

    // Calculate payment split
    const totalAmount = parseUnits(amountUSDC.toString(), 6) // USDC has 6 decimals
    const treasuryAmount = (totalAmount * 5n) / 100n // 5%
    const artistAmount = totalAmount - treasuryAmount // 95%

    console.log('💰 Payment Split:', {
      total: amountUSDC,
      treasury: (Number(treasuryAmount) / 1e6).toFixed(2),
      artist: (Number(artistAmount) / 1e6).toFixed(2)
    })

    // Step 1: Check collector's USDC balance and allowance
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [collectorAddress as Address]
    })

    if (balance < totalAmount) {
      return NextResponse.json(
        { success: false, message: `Insufficient USDC balance. Need $${amountUSDC}, have $${(Number(balance) / 1e6).toFixed(2)}` },
        { status: 400 }
      )
    }

    const allowance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [collectorAddress as Address, relayerAccount.address]
    })

    if (allowance < totalAmount) {
      return NextResponse.json(
        {
          success: false,
          message: 'Insufficient USDC allowance. Please approve the relayer to spend your USDC.',
          needsApproval: true,
          approvalData: {
            usdcAddress,
            spender: relayerAccount.address,
            amount: totalAmount.toString()
          }
        },
        { status: 400 }
      )
    }

    // Get initial nonce for relayer
    let currentNonce = await publicClient.getTransactionCount({
      address: relayerAccount.address,
      blockTag: 'pending'
    })

    console.log('🔢 Starting nonce:', currentNonce)

    // Step 2: Transfer USDC from collector to treasury (5%)
    console.log('💸 Transferring 5% to treasury...')
    const treasuryTxHash = await walletClient.writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'transferFrom',
      args: [collectorAddress as Address, treasuryWallet, treasuryAmount],
      nonce: currentNonce
    })

    await publicClient.waitForTransactionReceipt({ hash: treasuryTxHash })
    console.log('✅ Treasury payment:', treasuryTxHash)
    currentNonce++ // Increment nonce

    // Step 3: Transfer USDC from collector to artist (95%)
    console.log('💸 Transferring 95% to artist...')
    const artistTxHash = await walletClient.writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'transferFrom',
      args: [collectorAddress as Address, artistAddress as Address, artistAmount],
      nonce: currentNonce
    })

    await publicClient.waitForTransactionReceipt({ hash: artistTxHash })
    console.log('✅ Artist payment:', artistTxHash)
    currentNonce++ // Increment nonce

    // Step 4: Create collection using V6 Factory
    console.log('🎨 Creating NFT collection...')
    const collectionTxHash = await walletClient.writeContract({
      address: factoryAddress,
      abi: FACTORY_V6_ABI,
      functionName: 'createCollectionV6Gasless',
      args: [
        collectorAddress as Address, // creator
        metadata.name || 'Collected Artwork', // name
        'CLCT', // symbol
        metadata.description || `Collected from gallery for $${amountUSDC} USDC`, // description
        `ipfs://${metadata.image_ipfs_hash}`, // image
        '', // externalUrl
        artistAddress as Address, // royaltyRecipient
        250n // royaltyFeeNumerator (2.5%)
      ],
      nonce: currentNonce
    })

    const collectionReceipt = await publicClient.waitForTransactionReceipt({ hash: collectionTxHash })
    console.log('✅ Collection created:', collectionTxHash)
    currentNonce++ // Increment nonce

    // Parse collection address from logs (first topic after event signature)
    const collectionAddress = collectionReceipt.logs[0]?.address

    if (!collectionAddress) {
      throw new Error('Failed to get collection address from transaction receipt')
    }

    console.log('📦 Collection address:', collectionAddress)

    // Step 5: Mint NFT to collector
    console.log('🎨 Minting NFT to collector...')
    const tokenURI = metadata.metadata_ipfs_hash
      ? `ipfs://${metadata.metadata_ipfs_hash}`
      : `ipfs://${metadata.image_ipfs_hash}`

    const mintTxHash = await walletClient.writeContract({
      address: factoryAddress,
      abi: FACTORY_V6_ABI,
      functionName: 'mintNFTV6Gasless',
      args: [
        collectionAddress as Address, // collection
        collectorAddress as Address, // to
        tokenURI // tokenURI
      ],
      nonce: currentNonce
    })

    const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintTxHash })
    console.log('✅ NFT minted:', mintTxHash)

    // Step 6: Save collected NFT to Firebase
    const collectedNFT = await FirebaseNFTService.createNFT({
      name: metadata.name,
      description: metadata.description || `Collected from gallery for $${amountUSDC} USDC`,
      wallet_address: collectorAddress, // Use wallet_address (correct field name from NFT type)
      artist_name: metadata.artist_name || 'Artist',
      collection_address: collectionAddress || '0x0',
      token_id: '1',
      image_ipfs_hash: metadata.image_ipfs_hash,
      metadata_ipfs_hash: metadata.metadata_ipfs_hash || '',
      blockchain: chain.name,
      network: isTestnet ? 'base-sepolia' : 'base',
      royalty_percentage: 2.5,
      transaction_hash: mintTxHash, // Add mint transaction hash
      in_gallery: false,
      is_claimable: false,
      source: 'user_created' // Mark as user_created so it appears in profile
    })

    console.log('✅ Collected NFT saved to Firebase:', collectedNFT.id)

    // Step 7: Record the sale in sales registry
    const saleRecord = await FirebaseSalesService.recordSale({
      nft_id: nftId,
      nft_name: metadata.name,
      nft_image_ipfs_hash: metadata.image_ipfs_hash,
      nft_description: metadata.description,
      collection_address: collectionAddress || '0x0',
      token_id: '1',
      artist_wallet: artistAddress.toLowerCase(),
      artist_name: metadata.artist_name || 'Artist',
      collector_wallet: collectorAddress.toLowerCase(),
      amount_usdc: amountUSDC,
      treasury_amount: Number(treasuryAmount) / 1e6,
      artist_amount: Number(artistAmount) / 1e6,
      treasury_tx_hash: treasuryTxHash,
      artist_tx_hash: artistTxHash,
      mint_tx_hash: mintTxHash,
      blockchain: chain.name,
      network: isTestnet ? 'base-sepolia' : 'base',
      sale_type: 'gallery_collect'
    })

    console.log('✅ Sale recorded:', saleRecord.id)

    return NextResponse.json({
      success: true,
      message: 'NFT collected successfully',
      data: {
        nftId: collectedNFT.id,
        saleId: saleRecord.id,
        collectionAddress,
        collectionTxHash,
        treasuryTxHash,
        artistTxHash,
        mintTxHash,
        amountPaid: amountUSDC,
        treasuryAmount: Number(treasuryAmount) / 1e6,
        artistAmount: Number(artistAmount) / 1e6
      }
    })

  } catch (error: any) {
    console.error('❌ Collect NFT error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to collect NFT'
      },
      { status: 500 }
    )
  }
}
