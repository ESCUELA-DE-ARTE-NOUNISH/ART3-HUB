// Gasless Relay API - Backend endpoint that submits transactions on behalf of users
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia, base } from 'viem/chains'

// Types for the gasless relay requests
interface GaslessRelayRequest {
  type: 'mint' | 'createCollection' | 'upgradeSubscription' | 'approveUSDC' | 'mintV4' | 'createCollectionV4' | 'mintV6' | 'createCollectionV6' | 'upgradeToMaster' | 'upgradeToElite' | 'downgradeSubscription' | 'claimNFT' | 'deployClaimableNFT' | 'addClaimCode' | 'createNFTWithCollection' | 'mintToExistingCollection'
  voucher?: any
  signature?: string
  collectionAddress?: string
  contractAddress?: string
  claimCode?: string
  userAddress?: string
  autoRenew?: boolean
  spender?: string
  amount?: string
  chainId: number
  // For claimable NFT operations
  name?: string
  symbol?: string
  baseTokenURI?: string
  maxClaims?: number
  startTime?: number
  endTime?: number
  metadataURI?: string
  // For simple NFT creation
  nftData?: {
    name: string
    symbol: string
    description: string
    imageURI: string
    externalUrl: string
    artist: string
    royaltyBPS: number
    recipient: string
  }
  recipient?: string
  tokenURI?: string
}

// Art3HubFactoryV3 ABI with gasless functions
const ART3HUB_FACTORY_V3_GASLESS_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "name": "collection", "type": "address" },
          { "name": "to", "type": "address" },
          { "name": "tokenURI", "type": "string" },
          { "name": "nonce", "type": "uint256" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "voucher",
        "type": "tuple"
      },
      { "name": "signature", "type": "bytes" }
    ],
    "name": "mintNFTGasless",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "name": "name", "type": "string" },
          { "name": "symbol", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "image", "type": "string" },
          { "name": "externalUrl", "type": "string" },
          { "name": "artist", "type": "address" },
          { "name": "royaltyRecipient", "type": "address" },
          { "name": "royaltyFeeNumerator", "type": "uint96" },
          { "name": "nonce", "type": "uint256" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "voucher",
        "type": "tuple"
      },
      { "name": "signature", "type": "bytes" }
    ],
    "name": "createCollectionGasless",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Art3HubSubscriptionV3 ABI for gasless upgrade
const ART3HUB_SUBSCRIPTION_V3_GASLESS_ABI = [
  {
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "autoRenew", "type": "bool" }
    ],
    "name": "subscribeToMasterPlanGasless",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Simple ERC721 Contract ABI for direct NFT creation
const SIMPLE_ERC721_ABI = [
  {
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "symbol", "type": "string"},
      {"name": "owner", "type": "address"},
      {"name": "royaltyRecipient", "type": "address"},
      {"name": "royaltyBPS", "type": "uint96"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "tokenURI", "type": "string"}
    ],
    "name": "mint",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "from", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "tokenId", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Art3HubFactoryV6 (V5) ABI with gasless functions - Updated for V6 deployment
const ART3HUB_FACTORY_V6_GASLESS_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "name": "collection", "type": "address" },
          { "name": "to", "type": "address" },
          { "name": "tokenURI", "type": "string" },
          { "name": "category", "type": "string" },
          { "name": "tags", "type": "string[]" },
          { "name": "ipfsImageHash", "type": "string" },
          { "name": "ipfsMetadataHash", "type": "string" },
          { "name": "royaltyBPS", "type": "uint256" },
          { "name": "additionalMetadata", "type": "string" },
          { "name": "nonce", "type": "uint256" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "voucher",
        "type": "tuple"
      },
      { "name": "signature", "type": "bytes" }
    ],
    "name": "mintNFTV5Gasless",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "name": "name", "type": "string" },
          { "name": "symbol", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "image", "type": "string" },
          { "name": "externalUrl", "type": "string" },
          { "name": "artist", "type": "address" },
          { "name": "royaltyRecipient", "type": "address" },
          { "name": "royaltyFeeNumerator", "type": "uint96" },
          { "name": "creatorName", "type": "string" },
          { "name": "creatorUsername", "type": "string" },
          { "name": "creatorEmail", "type": "string" },
          { "name": "creatorProfilePicture", "type": "string" },
          { "name": "creatorSocialLinks", "type": "string" },
          { "name": "nonce", "type": "uint256" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "voucher",
        "type": "tuple"
      },
      { "name": "signature", "type": "bytes" }
    ],
    "name": "createCollectionV5Gasless",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Art3HubFactoryV4 ABI with gasless functions (for backward compatibility)
const ART3HUB_FACTORY_V4_GASLESS_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "name": "collection", "type": "address" },
          { "name": "to", "type": "address" },
          { "name": "tokenURI", "type": "string" },
          { "name": "nonce", "type": "uint256" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "voucher",
        "type": "tuple"
      },
      { "name": "signature", "type": "bytes" }
    ],
    "name": "mintNFTGasless",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "name": "name", "type": "string" },
          { "name": "symbol", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "image", "type": "string" },
          { "name": "externalUrl", "type": "string" },
          { "name": "artist", "type": "address" },
          { "name": "royaltyRecipient", "type": "address" },
          { "name": "royaltyFeeNumerator", "type": "uint96" },
          { "name": "nonce", "type": "uint256" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "voucher",
        "type": "tuple"
      },
      { "name": "signature", "type": "bytes" }
    ],
    "name": "createCollectionGasless",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Art3HubSubscriptionV4 ABI for gasless upgrade with Elite plan support
const ART3HUB_SUBSCRIPTION_V4_GASLESS_ABI = [
  {
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "autoRenew", "type": "bool" }
    ],
    "name": "subscribeToMasterPlanGasless",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "autoRenew", "type": "bool" }
    ],
    "name": "subscribeToElitePlanGasless",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "newPlan", "type": "uint8" }
    ],
    "name": "downgradeSubscriptionGasless",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// USDC ABI for gasless approval
const USDC_ABI = [
  {
    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// ClaimableNFT Factory ABI
const CLAIMABLE_NFT_FACTORY_ABI = [
  {
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "symbol", "type": "string"},
      {"name": "baseTokenURI", "type": "string"},
      {"name": "collectionOwner", "type": "address"}
    ],
    "name": "deployClaimableNFT",
    "outputs": [{"name": "nftAddress", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// ClaimableNFT ABI
const CLAIMABLE_NFT_ABI = [
  {
    "inputs": [{"name": "claimCode", "type": "string"}],
    "name": "claimNFT",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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
  },
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "metadataURI", "type": "string"}
    ],
    "name": "ownerMint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "claimCode", "type": "string"},
      {"name": "user", "type": "address"}
    ],
    "name": "validateClaimCode",
    "outputs": [
      {"name": "valid", "type": "bool"},
      {"name": "message", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "from", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "tokenId", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Get USDC contract address based on chain
function getUSDCAddress(chainId: number): string | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    case 8453: // Base Mainnet  
      return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    case 999999999: // Zora Sepolia
      return process.env.NEXT_PUBLIC_USDC_999999999 || null
    case 7777777: // Zora Mainnet
      return process.env.NEXT_PUBLIC_USDC_7777777 || null
    case 44787: // Celo Alfajores
      return process.env.NEXT_PUBLIC_USDC_44787 || null
    case 42220: // Celo Mainnet
      return process.env.NEXT_PUBLIC_USDC_42220 || null
    default:
      return null
  }
}

// Get Art3HubFactoryV3 contract address based on chain
function getFactoryAddress(chainId: number): string | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_84532 || null
    case 8453: // Base Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_8453 || null
    case 999999999: // Zora Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_999999999 || null
    case 7777777: // Zora Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_7777777 || null
    case 44787: // Celo Alfajores
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_44787 || null
    case 42220: // Celo Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_42220 || null
    default:
      return null
  }
}

// Get Art3HubSubscriptionV3 contract address based on chain
function getSubscriptionAddress(chainId: number): string | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_84532 || null
    case 8453: // Base Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_8453 || null
    case 999999999: // Zora Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_999999999 || null
    case 7777777: // Zora Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_7777777 || null
    case 44787: // Celo Alfajores
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_44787 || null
    case 42220: // Celo Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_42220 || null
    default:
      return null
  }
}

// Get Art3HubFactoryV6 contract address based on chain
function getFactoryV4Address(chainId: number): string | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_84532 || null
    case 8453: // Base Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_8453 || null
    case 999999999: // Zora Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_999999999 || null
    case 7777777: // Zora Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_7777777 || null
    case 44787: // Celo Alfajores
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_44787 || null
    case 42220: // Celo Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V6_42220 || null
    default:
      return null
  }
}

// Get Art3HubSubscriptionV6 contract address based on chain
function getSubscriptionV4Address(chainId: number): string | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_84532 || null
    case 8453: // Base Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_8453 || null
    case 999999999: // Zora Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_999999999 || null
    case 7777777: // Zora Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_7777777 || null
    case 44787: // Celo Alfajores
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_44787 || null
    case 42220: // Celo Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V6_42220 || null
    default:
      return null
  }
}

// Get RPC URL based on chain
function getRpcUrl(chainId: number): string {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
    case 8453: // Base Mainnet
      return process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'
    case 999999999: // Zora Sepolia
      return process.env.NEXT_PUBLIC_ZORA_SEPOLIA_RPC_URL || 'https://sepolia.rpc.zora.energy'
    case 7777777: // Zora Mainnet
      return process.env.NEXT_PUBLIC_ZORA_RPC_URL || 'https://rpc.zora.energy'
    case 44787: // Celo Alfajores
      return process.env.NEXT_PUBLIC_CELO_ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
    case 42220: // Celo Mainnet
      return process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

// Get ClaimableNFT Factory address based on chain
function getClaimableNFTFactoryAddress(chainId: number): string | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_84532 || null
    case 8453: // Base Mainnet
      return process.env.NEXT_PUBLIC_CLAIMABLE_NFT_FACTORY_8453 || null
    default:
      return null
  }
}

// Get chain config
function getChain(chainId: number) {
  switch (chainId) {
    case 84532:
      return baseSepolia
    case 8453:
      return base
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Gasless relay API called')
    
    const body: GaslessRelayRequest = await request.json()
    console.log('📋 Relay request:', {
      type: body.type,
      chainId: body.chainId,
      hasVoucher: !!body.voucher,
      hasSignature: !!body.signature
    })

    // Declare variables that will be used throughout the function
    let contractAddress = null
    let tokenId = null
    let claimTokenId: bigint | null = null

    // Validate request based on type
    if (body.type === 'upgradeSubscription' || body.type === 'upgradeToMaster' || body.type === 'upgradeToElite' || body.type === 'downgradeSubscription') {
      if (!body.userAddress || !body.chainId) {
        return NextResponse.json(
          { error: 'Missing required fields for subscription operation: userAddress, chainId' },
          { status: 400 }
        )
      }
    } else if (body.type === 'approveUSDC') {
      if (!body.userAddress || !body.spender || !body.amount || !body.chainId) {
        return NextResponse.json(
          { error: 'Missing required fields for USDC approval: userAddress, spender, amount, chainId' },
          { status: 400 }
        )
      }
    } else if (body.type === 'claimNFT') {
      if (!body.contractAddress || !body.userAddress || !body.chainId) {
        return NextResponse.json(
          { error: 'Missing required fields for ownerMint: contractAddress, userAddress, chainId' },
          { status: 400 }
        )
      }
    } else if (body.type === 'deployClaimableNFT') {
      if (!body.name || !body.symbol || !body.userAddress || !body.chainId) {
        return NextResponse.json(
          { error: 'Missing required fields for ClaimableNFT deployment: name, symbol, userAddress, chainId' },
          { status: 400 }
        )
      }
    } else if (body.type === 'addClaimCode') {
      if (!body.contractAddress || !body.claimCode || !body.chainId) {
        return NextResponse.json(
          { error: 'Missing required fields for adding claim code: contractAddress, claimCode, chainId' },
          { status: 400 }
        )
      }
    } else if (body.type === 'createNFTWithCollection') {
      if (!body.nftData || !body.chainId) {
        return NextResponse.json(
          { error: 'Missing required fields for createNFTWithCollection: nftData, chainId' },
          { status: 400 }
        )
      }
    } else if (body.type === 'mintToExistingCollection') {
      if (!body.collectionAddress || !body.recipient || !body.tokenURI || !body.chainId) {
        return NextResponse.json(
          { error: 'Missing required fields for mintToExistingCollection: collectionAddress, recipient, tokenURI, chainId' },
          { status: 400 }
        )
      }
    } else {
      if (!body.voucher || !body.signature || !body.chainId) {
        return NextResponse.json(
          { error: 'Missing required fields: voucher, signature, chainId' },
          { status: 400 }
        )
      }
    }

    // Get factory address (V3, V4, or V6 based on request type)
    let factoryAddress: string | null = null
    const isV4Request = ['mintV4', 'createCollectionV4'].includes(body.type)
    const isV6Request = ['mintV6', 'createCollectionV6', 'upgradeToMaster', 'upgradeToElite', 'downgradeSubscription'].includes(body.type)
    const isClaimableNFTRequest = ['claimNFT', 'deployClaimableNFT', 'addClaimCode'].includes(body.type)
    const isSimpleNFTRequest = ['createNFTWithCollection', 'mintToExistingCollection'].includes(body.type)
    
    if (isClaimableNFTRequest) {
      // Claimable NFT operations don't need the main factory check
      // They will validate their own factory addresses later
      factoryAddress = null
    } else if (isSimpleNFTRequest) {
      // Simple NFT operations use V6 factory for direct creation
      factoryAddress = getFactoryV4Address(body.chainId)
      if (!factoryAddress) {
        return NextResponse.json(
          { error: `Art3HubFactoryV6 not deployed on chain ${body.chainId}` },
          { status: 400 }
        )
      }
    } else if (isV6Request || isV4Request) {
      // Both V4 and V6 requests use the same V6 factory address (V6 is deployed with V5 code)
      factoryAddress = getFactoryV4Address(body.chainId)
      if (!factoryAddress) {
        return NextResponse.json(
          { error: `Art3HubFactoryV6 not deployed on chain ${body.chainId}` },
          { status: 400 }
        )
      }
    } else {
      factoryAddress = getFactoryAddress(body.chainId)
      if (!factoryAddress) {
        return NextResponse.json(
          { error: `Art3HubFactoryV3 not deployed on chain ${body.chainId}` },
          { status: 400 }
        )
      }
    }

    // Check if we have relayer private key (for demo purposes)
    const relayerPrivateKey = process.env.GASLESS_RELAYER_PRIVATE_KEY
    if (!relayerPrivateKey) {
      console.log('⚠️ No relayer private key configured, this is a demo endpoint')
      return NextResponse.json(
        { 
          error: 'Gasless relayer not configured. This is a demo - implement your own relayer backend.',
          demo: true,
          message: 'In production, this endpoint would submit the transaction using the relayer private key'
        },
        { status: 501 }
      )
    }

    // Create clients
    const chain = getChain(body.chainId)
    const rpcUrl = getRpcUrl(body.chainId)
    
    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })

    // Ensure private key has 0x prefix
    const formattedPrivateKey = relayerPrivateKey.startsWith('0x') 
      ? relayerPrivateKey 
      : `0x${relayerPrivateKey}`
    
    const relayerAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`)
    const walletClient = createWalletClient({
      account: relayerAccount,
      chain,
      transport: http(rpcUrl)
    })

    console.log('🔧 Relayer setup:', {
      factoryAddress,
      relayerAccount: relayerAccount.address,
      chainId: body.chainId
    })

    // Verify factory contract exists and has correct functions (skip for claimable NFT operations)
    if (!isClaimableNFTRequest && factoryAddress) {
      try {
        console.log('🔍 Verifying factory contract...')
        const contractCode = await publicClient.getCode({
          address: factoryAddress as `0x${string}`
        })
        
        if (!contractCode || contractCode === '0x') {
          return NextResponse.json(
            { 
              error: 'Factory contract not found',
              address: factoryAddress,
              chainId: body.chainId
            },
            { status: 404 }
          )
        }
        
        console.log('✅ Factory contract found with bytecode')
      
      // Check what gasless relayer is set in the contract
      try {
        const contractGaslessRelayer = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: [
            {
              "inputs": [],
              "name": "gaslessRelayer",
              "outputs": [{"name": "", "type": "address"}],
              "stateMutability": "view",
              "type": "function"
            }
          ] as const,
          functionName: 'gaslessRelayer'
        })
        
        console.log('🔍 Contract gasless relayer check:', {
          contractGaslessRelayer,
          ourRelayerAccount: relayerAccount.address,
          match: contractGaslessRelayer.toLowerCase() === relayerAccount.address.toLowerCase()
        })
        
        if (contractGaslessRelayer.toLowerCase() !== relayerAccount.address.toLowerCase()) {
          return NextResponse.json(
            { 
              error: 'Relayer address mismatch',
              details: `Contract expects gasless relayer ${contractGaslessRelayer} but we are using ${relayerAccount.address}`,
              contractGaslessRelayer,
              ourRelayerAccount: relayerAccount.address
            },
            { status: 403 }
          )
        }
        
      } catch (relayerCheckError) {
        console.warn('⚠️ Could not check gasless relayer from contract:', relayerCheckError)
      }
      
      } catch (contractError) {
        console.error('❌ Contract verification failed:', contractError)
        return NextResponse.json(
          { 
            error: 'Failed to verify factory contract',
            details: contractError instanceof Error ? contractError.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    }

    // Check relayer balance
    const balance = await publicClient.getBalance({
      address: relayerAccount.address
    })

    const minBalance = parseEther('0.001') // Minimum 0.001 ETH
    if (balance < minBalance) {
      return NextResponse.json(
        { 
          error: 'Relayer has insufficient funds',
          balance: balance.toString(),
          required: minBalance.toString()
        },
        { status: 503 }
      )
    }

    console.log('💰 Relayer balance check passed:', {
      balance: (Number(balance) / 1e18).toFixed(6),
      sufficient: true
    })

    let hash: string

    // Execute the appropriate transaction
    if (body.type === 'mint') {
      // Convert string values back to BigInt for mint voucher
      if (body.voucher.nonce && typeof body.voucher.nonce === 'string') {
        body.voucher.nonce = BigInt(body.voucher.nonce)
      }
      if (body.voucher.deadline && typeof body.voucher.deadline === 'string') {
        body.voucher.deadline = BigInt(body.voucher.deadline)
      }

      console.log('🎯 Executing gasless mint via Art3HubFactoryV3...')
      console.log('🔍 Mint params:', {
        factoryAddress,
        voucher: body.voucher,
        signature: body.signature,
        relayerAccount: relayerAccount.address
      })

      // Try to simulate the transaction first to get better error info
      try {
        console.log('🔍 Simulating gasless mint...')
        await publicClient.simulateContract({
          address: factoryAddress as `0x${string}`,
          abi: ART3HUB_FACTORY_V3_GASLESS_ABI,
          functionName: 'mintNFTGasless',
          args: [body.voucher, body.signature as `0x${string}`],
          account: relayerAccount
        })
        console.log('✅ Simulation successful')
      } catch (simError) {
        console.error('❌ Simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'Transaction simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: factoryAddress as `0x${string}`,
        abi: ART3HUB_FACTORY_V3_GASLESS_ABI,
        functionName: 'mintNFTGasless',
        args: [body.voucher, body.signature as `0x${string}`],
        chain
      })

    } else if (body.type === 'createCollection') {
      // Convert string values back to BigInt for collection voucher
      if (body.voucher.nonce && typeof body.voucher.nonce === 'string') {
        body.voucher.nonce = BigInt(body.voucher.nonce)
      }
      if (body.voucher.deadline && typeof body.voucher.deadline === 'string') {
        body.voucher.deadline = BigInt(body.voucher.deadline)
      }
      if (body.voucher.royaltyFeeNumerator && typeof body.voucher.royaltyFeeNumerator === 'string') {
        body.voucher.royaltyFeeNumerator = BigInt(body.voucher.royaltyFeeNumerator)
      }

      console.log('🏭 Executing gasless collection creation via Art3HubFactoryV3...')
      console.log('🔍 Collection creation params:', {
        factoryAddress,
        voucher: body.voucher,
        signature: body.signature,
        relayerAccount: relayerAccount.address
      })

      // Debug voucher validation before simulation
      console.log('🔍 Debugging voucher before simulation...')
      console.log('Current timestamp:', Math.floor(Date.now() / 1000))
      console.log('Voucher deadline:', body.voucher.deadline)
      console.log('Deadline valid?', Math.floor(Date.now() / 1000) <= parseInt(body.voucher.deadline))
      
      // Check user nonce
      try {
        const currentNonce = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: [
            {
              "inputs": [{"name": "user", "type": "address"}],
              "name": "userNonces",
              "outputs": [{"name": "", "type": "uint256"}],
              "stateMutability": "view",
              "type": "function"
            }
          ] as const,
          functionName: 'userNonces',
          args: [body.voucher.artist as `0x${string}`]
        })
        
        // Ensure both nonces are BigInt for proper comparison
        const currentNonceBigInt = BigInt(currentNonce)
        const voucherNonceBigInt = BigInt(body.voucher.nonce)
        
        console.log('🔍 Nonce check:', {
          userAddress: body.voucher.artist,
          currentNonce: currentNonceBigInt.toString(),
          voucherNonce: voucherNonceBigInt.toString(),
          nonceValid: currentNonceBigInt === voucherNonceBigInt
        })
      } catch (nonceError) {
        console.warn('⚠️ Could not check user nonce:', nonceError)
      }

      // Debug the signature verification manually before simulation
      console.log('🔍 Manual signature verification before simulation...')
      try {
        // Check if relayer is authorized
        const contractGaslessRelayer = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: [
            {
              "inputs": [],
              "name": "gaslessRelayer",
              "outputs": [{"name": "", "type": "address"}],
              "stateMutability": "view",
              "type": "function"
            }
          ] as const,
          functionName: 'gaslessRelayer'
        })
        
        console.log('🔍 Authorization check:', {
          contractGaslessRelayer,
          relayerAccount: relayerAccount.address,
          authorized: contractGaslessRelayer.toLowerCase() === relayerAccount.address.toLowerCase()
        })
        
        // Check signature recovery manually
        const domain = {
          name: 'Art3HubFactoryV3',
          version: '1',
          chainId: body.chainId,
          verifyingContract: factoryAddress as `0x${string}`
        }
        
        const types = {
          CollectionVoucher: [
            { name: 'name', type: 'string' },
            { name: 'symbol', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'image', type: 'string' },
            { name: 'externalUrl', type: 'string' },
            { name: 'artist', type: 'address' },
            { name: 'royaltyRecipient', type: 'address' },
            { name: 'royaltyFeeNumerator', type: 'uint96' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        }
        
        // Recreate the exact message that should have been signed
        const message = {
          name: body.voucher.name,
          symbol: body.voucher.symbol,
          description: body.voucher.description,
          image: body.voucher.image,
          externalUrl: body.voucher.externalUrl,
          artist: body.voucher.artist,
          royaltyRecipient: body.voucher.royaltyRecipient,
          royaltyFeeNumerator: body.voucher.royaltyFeeNumerator,
          nonce: body.voucher.nonce,
          deadline: body.voucher.deadline
        }
        
        console.log('🔍 EIP-712 verification details:', {
          domain,
          types: types.CollectionVoucher,
          message,
          signature: body.signature
        })
        
        // Try to recover the signer
        const { verifyTypedData } = await import('viem')
        const isValidSignature = await verifyTypedData({
          address: body.voucher.artist as `0x${string}`,
          domain,
          types,
          primaryType: 'CollectionVoucher',
          message,
          signature: body.signature as `0x${string}`
        })
        
        console.log('🔍 Signature verification result:', {
          expectedSigner: body.voucher.artist,
          signatureValid: isValidSignature
        })
        
      } catch (debugError) {
        console.warn('⚠️ Manual signature verification failed:', debugError)
      }

      // Try to simulate the transaction first to get better error info
      try {
        console.log('🔍 Simulating gasless collection creation...')
        const result = await publicClient.simulateContract({
          address: factoryAddress as `0x${string}`,
          abi: ART3HUB_FACTORY_V3_GASLESS_ABI,
          functionName: 'createCollectionGasless',
          args: [body.voucher, body.signature as `0x${string}`],
          account: relayerAccount
        })
        console.log('✅ Simulation successful, collection will be deployed at:', result.result)
      } catch (simError) {
        console.error('❌ Simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'Transaction simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: factoryAddress as `0x${string}`,
        abi: ART3HUB_FACTORY_V3_GASLESS_ABI,
        functionName: 'createCollectionGasless',
        args: [body.voucher, body.signature as `0x${string}`],
        chain
      })

    } else if (body.type === 'upgradeSubscription') {
      console.log('💎 Executing gasless subscription upgrade via Art3HubSubscriptionV3...')
      
      // Get subscription address
      const subscriptionAddress = getSubscriptionAddress(body.chainId)
      if (!subscriptionAddress) {
        return NextResponse.json(
          { error: `Art3HubSubscriptionV3 not deployed on chain ${body.chainId}` },
          { status: 400 }
        )
      }
      
      console.log('🔍 Subscription upgrade params:', {
        subscriptionAddress,
        userAddress: body.userAddress,
        autoRenew: body.autoRenew || false,
        relayerAccount: relayerAccount.address
      })

      // Try to simulate the transaction first
      try {
        console.log('🔍 Simulating gasless subscription upgrade...')
        await publicClient.simulateContract({
          address: subscriptionAddress as `0x${string}`,
          abi: ART3HUB_SUBSCRIPTION_V3_GASLESS_ABI,
          functionName: 'subscribeToMasterPlanGasless',
          args: [body.userAddress as `0x${string}`, body.autoRenew || false],
          account: relayerAccount
        })
        console.log('✅ Simulation successful')
      } catch (simError) {
        console.error('❌ Simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'Transaction simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: subscriptionAddress as `0x${string}`,
        abi: ART3HUB_SUBSCRIPTION_V3_GASLESS_ABI,
        functionName: 'subscribeToMasterPlanGasless',
        args: [body.userAddress as `0x${string}`, body.autoRenew || false],
        chain
      })

    } else if (body.type === 'approveUSDC') {
      console.log('💰 Executing gasless USDC approval...')
      
      // Get USDC address
      const usdcAddress = getUSDCAddress(body.chainId)
      if (!usdcAddress) {
        return NextResponse.json(
          { error: `USDC not deployed on chain ${body.chainId}` },
          { status: 400 }
        )
      }
      
      console.log('🔍 USDC approval params:', {
        usdcAddress,
        userAddress: body.userAddress,
        spender: body.spender,
        amount: body.amount,
        relayerAccount: relayerAccount.address
      })

      // Convert amount string to BigInt
      const amount = BigInt(body.amount!)

      // Try to simulate the transaction first
      try {
        console.log('🔍 Simulating gasless USDC approval...')
        await publicClient.simulateContract({
          address: usdcAddress as `0x${string}`,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [body.spender as `0x${string}`, amount],
          account: relayerAccount
        })
        console.log('✅ Simulation successful')
      } catch (simError) {
        console.error('❌ Simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'Transaction simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: usdcAddress as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [body.spender as `0x${string}`, amount],
        chain
      })

    } else if (body.type === 'mintV4') {
      // Convert string values back to BigInt for V4 mint voucher
      if (body.voucher.nonce && typeof body.voucher.nonce === 'string') {
        body.voucher.nonce = BigInt(body.voucher.nonce)
      }
      if (body.voucher.deadline && typeof body.voucher.deadline === 'string') {
        body.voucher.deadline = BigInt(body.voucher.deadline)
      }

      console.log('🎯 Executing gasless V4 mint via Art3HubFactoryV4...')
      console.log('🔍 V4 Mint params:', {
        factoryAddress,
        voucher: body.voucher,
        signature: body.signature,
        relayerAccount: relayerAccount.address
      })

      // Try to simulate the transaction first
      try {
        console.log('🔍 Simulating gasless V4 mint...')
        await publicClient.simulateContract({
          address: factoryAddress as `0x${string}`,
          abi: ART3HUB_FACTORY_V4_GASLESS_ABI,
          functionName: 'mintNFTGasless',
          args: [body.voucher, body.signature as `0x${string}`],
          account: relayerAccount
        })
        console.log('✅ V4 Simulation successful')
      } catch (simError) {
        console.error('❌ V4 Simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'V4 Transaction simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: factoryAddress as `0x${string}`,
        abi: ART3HUB_FACTORY_V4_GASLESS_ABI,
        functionName: 'mintNFTGasless',
        args: [body.voucher, body.signature as `0x${string}`],
        chain
      })

    } else if (body.type === 'createCollectionV4') {
      // Convert string values back to BigInt for V4 collection voucher
      if (body.voucher.nonce && typeof body.voucher.nonce === 'string') {
        body.voucher.nonce = BigInt(body.voucher.nonce)
      }
      if (body.voucher.deadline && typeof body.voucher.deadline === 'string') {
        body.voucher.deadline = BigInt(body.voucher.deadline)
      }
      if (body.voucher.royaltyFeeNumerator && typeof body.voucher.royaltyFeeNumerator === 'string') {
        body.voucher.royaltyFeeNumerator = BigInt(body.voucher.royaltyFeeNumerator)
      }

      console.log('🏭 Executing gasless V4 collection creation via Art3HubFactoryV4...')
      console.log('🔍 V4 Collection creation params:', {
        factoryAddress,
        voucher: body.voucher,
        signature: body.signature,
        relayerAccount: relayerAccount.address
      })

      // Try to simulate the transaction first
      try {
        console.log('🔍 Simulating gasless V4 collection creation...')
        const result = await publicClient.simulateContract({
          address: factoryAddress as `0x${string}`,
          abi: ART3HUB_FACTORY_V4_GASLESS_ABI,
          functionName: 'createCollectionGasless',
          args: [body.voucher, body.signature as `0x${string}`],
          account: relayerAccount
        })
        console.log('✅ V4 Simulation successful, collection will be deployed at:', result.result)
      } catch (simError) {
        console.error('❌ V4 Simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'V4 Transaction simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: factoryAddress as `0x${string}`,
        abi: ART3HUB_FACTORY_V4_GASLESS_ABI,
        functionName: 'createCollectionGasless',
        args: [body.voucher, body.signature as `0x${string}`],
        chain
      })

    } else if (body.type === 'createCollectionV6') {
      // Convert string values back to BigInt for V6 collection voucher
      if (body.voucher.nonce && typeof body.voucher.nonce === 'string') {
        body.voucher.nonce = BigInt(body.voucher.nonce)
      }
      if (body.voucher.deadline && typeof body.voucher.deadline === 'string') {
        body.voucher.deadline = BigInt(body.voucher.deadline)
      }
      if (body.voucher.royaltyFeeNumerator && typeof body.voucher.royaltyFeeNumerator === 'string') {
        body.voucher.royaltyFeeNumerator = BigInt(body.voucher.royaltyFeeNumerator)
      }

      console.log('🏭 Executing gasless V6 collection creation via Art3HubFactoryV6...')
      console.log('🔍 V6 Collection creation params:', {
        factoryAddress,
        voucher: body.voucher,
        signature: body.signature,
        relayerAccount: relayerAccount.address
      })

      // Try to simulate the transaction first
      let predictedContractAddress = null
      try {
        console.log('🔍 Simulating gasless V6 collection creation...')
        const result = await publicClient.simulateContract({
          address: factoryAddress as `0x${string}`,
          abi: ART3HUB_FACTORY_V6_GASLESS_ABI,
          functionName: 'createCollectionV5Gasless',
          args: [body.voucher, body.signature as `0x${string}`],
          account: relayerAccount
        })
        predictedContractAddress = result.result
        console.log('✅ V6 Simulation successful, collection will be deployed at:', predictedContractAddress)
      } catch (simError) {
        console.error('❌ V6 Simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'V6 Transaction simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: factoryAddress as `0x${string}`,
        abi: ART3HUB_FACTORY_V6_GASLESS_ABI,
        functionName: 'createCollectionV5Gasless',
        args: [body.voucher, body.signature as `0x${string}`],
        chain
      })

    } else if (body.type === 'createNFTWithCollection') {
      console.log('🎨 Executing simple NFT creation with collection-per-NFT architecture...')
      
      if (!body.nftData) {
        return NextResponse.json(
          { error: 'NFT data is required for createNFTWithCollection' },
          { status: 400 }
        )
      }

      console.log('🔍 Simple NFT creation params:', {
        name: body.nftData.name,
        symbol: body.nftData.symbol,
        artist: body.nftData.artist,
        recipient: body.nftData.recipient,
        relayerAccount: relayerAccount.address
      })

      try {
        // Import ethers for contract deployment
        const { ethers } = await import('ethers')
        
        // Get the contract owner private key (using gasless relayer key)
        const ownerPrivateKey = process.env.GASLESS_RELAYER_PRIVATE_KEY
        if (!ownerPrivateKey) {
          throw new Error('GASLESS_RELAYER_PRIVATE_KEY not found in environment variables')
        }

        // Create provider and signer for contract deployment
        const provider = new ethers.JsonRpcProvider(
          body.chainId === 84532 ? 'https://sepolia.base.org' : 'https://mainnet.base.org'
        )
        const ownerSigner = new ethers.Wallet(ownerPrivateKey, provider)

        console.log('🔍 Contract owner address:', ownerSigner.address)

        // Simple ERC721 contract bytecode (OpenZeppelin-based)
        // This would normally be imported from compiled contracts
        // For now, we'll deploy using a factory pattern or use existing V6 contracts
        
        // Use the existing V6 factory to create a collection, then mint directly
        const factoryAddress = getFactoryV4Address(body.chainId)
        if (!factoryAddress) {
          throw new Error(`Factory V6 not deployed on chain ${body.chainId}`)
        }

        // Create collection using direct call (no voucher needed since we're the relayer)
        // Make collection name unique by adding timestamp
        const timestamp = Date.now()
        const uniqueCollectionName = `${body.nftData.name} #${timestamp}`
        const uniqueSymbol = `${body.nftData.symbol}${timestamp.toString().slice(-4)}` // Last 4 digits of timestamp
        
        console.log('🏭 Creating collection directly using V6 createCollectionV6Gasless...')
        console.log('📝 Unique collection name:', uniqueCollectionName)
        console.log('📝 V6 Args:', [
          body.nftData.artist, // creator
          uniqueCollectionName,
          uniqueSymbol,
          body.nftData.description,
          body.nftData.imageURI,
          body.nftData.externalUrl || '',
          body.nftData.artist, // royalty recipient = artist
          body.nftData.royaltyBPS
        ])
        
        const createCollectionTx = await walletClient.writeContract({
          address: factoryAddress as `0x${string}`,
          abi: [
            {
              "inputs": [
                {"name": "creator", "type": "address"},
                {"name": "name", "type": "string"},
                {"name": "symbol", "type": "string"},
                {"name": "description", "type": "string"},
                {"name": "image", "type": "string"},
                {"name": "externalUrl", "type": "string"},
                {"name": "royaltyRecipient", "type": "address"},
                {"name": "royaltyFeeNumerator", "type": "uint96"}
              ],
              "name": "createCollectionV6Gasless",
              "outputs": [{"name": "", "type": "address"}],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'createCollectionV6Gasless',
          args: [
            body.nftData.artist as `0x${string}`, // creator
            uniqueCollectionName,
            uniqueSymbol,
            body.nftData.description,
            body.nftData.imageURI,
            body.nftData.externalUrl || '',
            body.nftData.artist as `0x${string}`, // royalty recipient = artist
            BigInt(body.nftData.royaltyBPS)
          ],
          chain
        })

        console.log('✅ Collection creation transaction sent:', createCollectionTx)

        // Wait for collection creation
        const createReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: createCollectionTx as `0x${string}` 
        })

        console.log('✅ Collection created, extracting address...')

        // Extract collection address from logs
        let collectionAddress = null
        const { keccak256, toHex } = await import('viem')
        // Different event signatures for different versions
        const collectionCreatedV6Topic = keccak256(toHex('CollectionCreated(address,address,string,string)')) // V6
        const collectionCreatedTopic = keccak256(toHex('CollectionCreated(address,address,string,string,uint256)')) // V4
        const collectionCreatedV5Topic = keccak256(toHex('CollectionCreated(address,address,string,string,string,uint256)')) // V5
        
        console.log('🔍 Looking for collection address in', createReceipt.logs.length, 'logs')
        console.log('🔍 Factory address:', factoryAddress)
        console.log('🔍 Expected topics:', {
          v6: collectionCreatedV6Topic,
          v4: collectionCreatedTopic,
          v5: collectionCreatedV5Topic
        })
        
        for (const log of createReceipt.logs) {
          console.log(`🔍 Checking log from ${log.address} with topic ${log.topics[0]}`)
          if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
            console.log('✅ Log is from factory, checking topic...')
            if (log.topics[0] === collectionCreatedV6Topic || log.topics[0] === collectionCreatedTopic || log.topics[0] === collectionCreatedV5Topic) {
              collectionAddress = log.topics[1] as string
              collectionAddress = '0x' + collectionAddress.slice(-40)
              console.log('✅ Found collection address via event topic:', collectionAddress)
              break
            } else {
              // The actual event topic we see in logs
              if (log.topics[0] === '0x379c58d25a3ec97a25e5e7411e075757ce89019d59c46fd2a54704748853d75f') {
                collectionAddress = log.topics[2] as string // Collection is in topics[2], not topics[1]
                collectionAddress = '0x' + collectionAddress.slice(-40)
                console.log('✅ Found collection address via actual topic:', collectionAddress)
                break
              }
            }
          }
        }

        if (!collectionAddress) {
          console.error('❌ Could not extract collection address from', createReceipt.logs.length, 'logs')
          console.error('Factory address:', factoryAddress)
          console.error('Expected topic:', collectionCreatedTopic)
          for (let i = 0; i < createReceipt.logs.length; i++) {
            const log = createReceipt.logs[i]
            console.error(`Log ${i}:`, {
              address: log.address,
              topics: log.topics,
              data: log.data
            })
          }
          throw new Error('Could not extract collection address from creation transaction')
        }

        console.log('🎯 Collection deployed at:', collectionAddress)

        // Verify collection authorization before minting
        try {
          const collectionArtist = await publicClient.readContract({
            address: collectionAddress as `0x${string}`,
            abi: [{"inputs":[],"name":"artist","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"}],
            functionName: 'artist'
          })
          
          const collectionOwner = await publicClient.readContract({
            address: collectionAddress as `0x${string}`,
            abi: [{"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"}],
            functionName: 'owner'
          })
          
          console.log('🔍 Collection authorization check:', {
            collectionAddress,
            collectionArtist,
            collectionOwner,
            relayerAccount: relayerAccount.address,
            factoryAddress,
            artistMatch: collectionArtist === relayerAccount.address,
            ownerMatch: collectionOwner === relayerAccount.address,
            factoryMatch: factoryAddress === relayerAccount.address
          })
        } catch (authError) {
          console.warn('⚠️ Could not verify collection authorization:', authError)
        }

        // Mint NFT via factory's V6 gasless minting function
        console.log('🎨 Minting NFT via factory V6 gasless function to user:', body.nftData.recipient)
        
        const mintTx = await walletClient.writeContract({
          address: factoryAddress as `0x${string}`,
          abi: [
            {
              "inputs": [
                {"name": "collection", "type": "address"},
                {"name": "to", "type": "address"},
                {"name": "tokenURI", "type": "string"}
              ],
              "name": "mintNFTV6Gasless",
              "outputs": [{"name": "", "type": "uint256"}],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'mintNFTV6Gasless',
          args: [
            collectionAddress as `0x${string}`, // Collection address
            body.nftData.recipient as `0x${string}`, // Mint directly to user
            body.nftData.imageURI // Use metadata URI as token URI
          ],
          chain
        })

        console.log('✅ NFT minted via factory to user:', mintTx)

        // Wait for mint transaction
        const mintReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: mintTx as `0x${string}` 
        })

        console.log('🎉 Simple NFT creation completed successfully!')

        // Set the final transaction hash and collection address for response
        hash = mintTx
        contractAddress = collectionAddress
        tokenId = 0

      } catch (error) {
        console.error('❌ Simple NFT creation failed:', error)
        return NextResponse.json(
          { 
            error: 'Simple NFT creation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

    } else if (body.type === 'mintToExistingCollection') {
      console.log('🔄 Minting additional NFT to existing collection...')
      
      if (!body.collectionAddress || !body.recipient || !body.tokenURI) {
        return NextResponse.json(
          { error: 'Collection address, recipient, and tokenURI are required' },
          { status: 400 }
        )
      }

      console.log('🔍 Additional mint params:', {
        collectionAddress: body.collectionAddress,
        recipient: body.recipient,
        tokenURI: body.tokenURI,
        relayerAccount: relayerAccount.address
      })

      try {
        // Mint directly to user (no transfer needed)
        const mintTx = await walletClient.writeContract({
          address: body.collectionAddress as `0x${string}`,
          abi: SIMPLE_ERC721_ABI,
          functionName: 'mint',
          args: [
            body.recipient as `0x${string}`,
            body.tokenURI
          ],
          chain
        })

        console.log('✅ Additional NFT minted:', mintTx)

        // Wait for transaction
        const mintReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: mintTx as `0x${string}` 
        })

        console.log('🎉 Additional mint completed successfully!')

        // Set response data
        hash = mintTx
        contractAddress = body.collectionAddress
        tokenId = 1 // Assuming this is the second token

      } catch (error) {
        console.error('❌ Additional mint failed:', error)
        return NextResponse.json(
          { 
            error: 'Additional mint failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

    } else if (body.type === 'upgradeToMaster') {
      console.log('💎 Executing gasless V4 Master plan upgrade...')
      
      // Get V6 subscription address
      const subscriptionV4Address = getSubscriptionV4Address(body.chainId)
      if (!subscriptionV4Address) {
        return NextResponse.json(
          { error: `Art3HubSubscriptionV6 not deployed on chain ${body.chainId}` },
          { status: 400 }
        )
      }
      
      console.log('🔍 V4 Master upgrade params:', {
        subscriptionV4Address,
        userAddress: body.userAddress,
        autoRenew: body.autoRenew || false,
        relayerAccount: relayerAccount.address
      })

      // Try to simulate the transaction first
      try {
        console.log('🔍 Simulating gasless V4 Master upgrade...')
        await publicClient.simulateContract({
          address: subscriptionV4Address as `0x${string}`,
          abi: ART3HUB_SUBSCRIPTION_V4_GASLESS_ABI,
          functionName: 'subscribeToMasterPlanGasless',
          args: [body.userAddress as `0x${string}`, body.autoRenew || false],
          account: relayerAccount
        })
        console.log('✅ V4 Master simulation successful')
      } catch (simError) {
        console.error('❌ V4 Master simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'V4 Master upgrade simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: subscriptionV4Address as `0x${string}`,
        abi: ART3HUB_SUBSCRIPTION_V4_GASLESS_ABI,
        functionName: 'subscribeToMasterPlanGasless',
        args: [body.userAddress as `0x${string}`, body.autoRenew || false],
        chain
      })

    } else if (body.type === 'upgradeToElite') {
      console.log('⭐ Executing gasless V4 Elite plan upgrade...')
      
      // Get V6 subscription address
      const subscriptionV4Address = getSubscriptionV4Address(body.chainId)
      if (!subscriptionV4Address) {
        return NextResponse.json(
          { error: `Art3HubSubscriptionV6 not deployed on chain ${body.chainId}` },
          { status: 400 }
        )
      }
      
      console.log('🔍 V4 Elite upgrade params:', {
        subscriptionV4Address,
        userAddress: body.userAddress,
        autoRenew: body.autoRenew || false,
        relayerAccount: relayerAccount.address
      })

      // Try to simulate the transaction first
      try {
        console.log('🔍 Simulating gasless V4 Elite upgrade...')
        await publicClient.simulateContract({
          address: subscriptionV4Address as `0x${string}`,
          abi: ART3HUB_SUBSCRIPTION_V4_GASLESS_ABI,
          functionName: 'subscribeToElitePlanGasless',
          args: [body.userAddress as `0x${string}`, body.autoRenew || false],
          account: relayerAccount
        })
        console.log('✅ V4 Elite simulation successful')
      } catch (simError) {
        console.error('❌ V4 Elite simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'V4 Elite upgrade simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: subscriptionV4Address as `0x${string}`,
        abi: ART3HUB_SUBSCRIPTION_V4_GASLESS_ABI,
        functionName: 'subscribeToElitePlanGasless',
        args: [body.userAddress as `0x${string}`, body.autoRenew || false],
        chain
      })

    } else if (body.type === 'downgradeSubscription') {
      console.log('⬇️ Executing gasless V4 subscription downgrade...')
      
      // Get V6 subscription address
      const subscriptionV4Address = getSubscriptionV4Address(body.chainId)
      if (!subscriptionV4Address) {
        return NextResponse.json(
          { error: `Art3HubSubscriptionV6 not deployed on chain ${body.chainId}` },
          { status: 400 }
        )
      }
      
      // Default to FREE plan (0) if no plan specified
      const newPlan = body.userAddress ? 0 : 0 // FREE plan
      
      console.log('🔍 V4 Downgrade params:', {
        subscriptionV4Address,
        userAddress: body.userAddress,
        newPlan,
        relayerAccount: relayerAccount.address
      })

      // Try to simulate the transaction first
      try {
        console.log('🔍 Simulating gasless V4 downgrade...')
        await publicClient.simulateContract({
          address: subscriptionV4Address as `0x${string}`,
          abi: ART3HUB_SUBSCRIPTION_V4_GASLESS_ABI,
          functionName: 'downgradeSubscriptionGasless',
          args: [body.userAddress as `0x${string}`, newPlan],
          account: relayerAccount
        })
        console.log('✅ V4 Downgrade simulation successful')
      } catch (simError) {
        console.error('❌ V4 Downgrade simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'V4 Downgrade simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: subscriptionV4Address as `0x${string}`,
        abi: ART3HUB_SUBSCRIPTION_V4_GASLESS_ABI,
        functionName: 'downgradeSubscriptionGasless',
        args: [body.userAddress as `0x${string}`, newPlan],
        chain
      })

    } else if (body.type === 'claimNFT') {
      console.log('\\n🎯 EXECUTING GASLESS NFT MINTING')
      console.log('=================================')
      console.log('📍 Contract:', body.contractAddress)
      console.log('👤 User:', body.userAddress)
      console.log('🤖 Relayer:', relayerAccount.address)
      console.log('🔑 Claim Code:', body.claimCode || 'None (database-only)')
      console.log('🖼️ Metadata URI:', body.metadataURI || 'Default IPFS')
      console.log('🎯 Strategy: Database-only validation + ownerMint with metadata')
      console.log('=================================\\n')

      // 🎯 DATABASE-ONLY CLAIM VALIDATION APPROACH
      // Claims are validated in database only, contracts use ownerMint directly with metadata
      let metadataURI = body.metadataURI || 'https://ipfs.io/ipfs/QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L'
      
      // 🔧 CRITICAL FIX: The smart contracts are adding their own IPFS gateway prefix!
      // We need to send only the IPFS hash, not the full URL
      console.log('🔍 Original metadataURI received:', metadataURI)
      
      let ipfsHash = ''
      if (metadataURI.startsWith('ipfs://')) {
        // Extract hash from ipfs:// protocol
        ipfsHash = metadataURI.replace('ipfs://', '')
        console.log('🔧 Extracted IPFS hash from ipfs:// protocol:', ipfsHash)
      } else if (metadataURI.includes('ipfs.io/ipfs/')) {
        // Extract hash from gateway URL
        const match = metadataURI.match(/\/ipfs\/([^/?]+)/)
        if (match) {
          ipfsHash = match[1]
          console.log('🔧 Extracted IPFS hash from gateway URL:', ipfsHash)
        }
      } else {
        // Assume it's already just a hash
        ipfsHash = metadataURI
        console.log('🔧 Using provided string as IPFS hash:', ipfsHash)
      }
      
      // 🎯 CRITICAL: Send only the IPFS hash - let the contract add the prefix
      metadataURI = ipfsHash
      console.log('🔧 Final metadataURI (hash only for contract):', metadataURI)
      
      console.log('\\n🎯 DATABASE-ONLY CLAIM VALIDATION')
      console.log('===================================')
      console.log('📝 Strategy: All contracts use ownerMint directly')
      console.log('🔐 Claim codes validated in database only (not on contract)')
      console.log('📄 Metadata URI attached to each individual token')
      console.log('🚫 No claim codes stored on smart contracts')
      console.log('===================================')
      
      // Always use ownerMint - database handles claim validation
      try {
        console.log('🔍 Testing ownerMint with metadata URI...')
        console.log('📄 Metadata URI:', metadataURI)
        const simResult = await publicClient.simulateContract({
          address: body.contractAddress as `0x${string}`,
          abi: CLAIMABLE_NFT_ABI,
          functionName: 'ownerMint',
          args: [body.userAddress! as `0x${string}`, metadataURI],
          account: relayerAccount
        })
        claimTokenId = simResult.result as bigint
        console.log('✅ OwnerMint simulation successful!')
        console.log('🎯 Token ID will be:', claimTokenId.toString())
        console.log('📄 Metadata will be attached to token via ownerMint')
      } catch (ownerMintError) {
        console.error('❌ OwnerMint failed - contract may not support this function:', ownerMintError)
        return NextResponse.json(
          { 
            error: 'Contract does not support ownerMint',
            details: 'This contract was deployed with an older version. Please recreate the claimable NFT to use the database-only approach.',
            suggestion: 'Delete and recreate the claimable NFT to get a contract with ownerMint support',
            technicalDetails: ownerMintError instanceof Error ? ownerMintError.message : 'Unknown simulation error'
          },
          { status: 400 }
        )
      }

      // Execute ownerMint transaction with metadata (database-only validation)
      console.log('🔨 Executing ownerMint transaction with metadata URI...')
      console.log('📄 Final metadata URI for minting:', metadataURI)
      console.log('🔍 DETAILED TRANSACTION INFO:')
      console.log('  - Contract:', body.contractAddress)
      console.log('  - User:', body.userAddress)
      console.log('  - Metadata URI:', metadataURI)
      console.log('  - URI Length:', metadataURI?.length)
      console.log('  - URI Type:', typeof metadataURI)
      console.log('  - Chain:', chain.id)
      
      // 🧪 TEST: Verify metadata URI one more time before contract call
      if (metadataURI && metadataURI.startsWith('http')) {
        try {
          console.log('🧪 FINAL METADATA TEST before contract call...')
          const finalTestResponse = await fetch(metadataURI)
          if (finalTestResponse.ok) {
            const finalTestMetadata = await finalTestResponse.json()
            console.log('✅ FINAL METADATA TEST PASSED:', {
              accessible: true,
              hasName: !!finalTestMetadata.name,
              hasDescription: !!finalTestMetadata.description,
              hasImage: !!finalTestMetadata.image
            })
          } else {
            console.error('❌ FINAL METADATA TEST FAILED:', finalTestResponse.status)
          }
        } catch (finalTestError) {
          console.error('❌ FINAL METADATA TEST ERROR:', finalTestError.message)
        }
      }
      
      // Log the exact arguments being passed to the contract
      const contractArgs = [body.userAddress! as `0x${string}`, metadataURI]
      console.log('🔍 EXACT CONTRACT ARGUMENTS:')
      console.log('  - Arg 0 (to address):', contractArgs[0])
      console.log('  - Arg 1 (metadataURI):', JSON.stringify(contractArgs[1]))
      console.log('  - Arg 1 raw string:', contractArgs[1])
      console.log('  - Arg 1 length:', contractArgs[1].length)
      console.log('  - Arg 1 type:', typeof contractArgs[1])
      
      hash = await walletClient.writeContract({
        address: body.contractAddress as `0x${string}`,
        abi: CLAIMABLE_NFT_ABI,
        functionName: 'ownerMint',
        args: contractArgs,
        chain
      })

      // Wait for the ownerMint transaction to complete
      console.log('⏳ Waiting for ownerMint transaction to complete...')
      const claimReceipt = await publicClient.waitForTransactionReceipt({ 
        hash: hash as `0x${string}` 
      })

      console.log('✅ OwnerMint transaction completed successfully!')
      console.log('📊 Transaction details:', {
        hash,
        status: claimReceipt.status,
        gasUsed: claimReceipt.gasUsed.toString(),
        tokenId: claimTokenId?.toString()
      })

      // Verify token was minted correctly
      if (claimTokenId === null) {
        return NextResponse.json(
          { error: 'Failed to get token ID from ownerMint' },
          { status: 500 }
        )
      }
      
      tokenId = Number(claimTokenId)
      
      console.log('🎉 NFT minted successfully with metadata!')
      console.log('👤 Owner:', body.userAddress)
      console.log('🎯 Token ID:', tokenId)
      console.log('📄 Metadata URI:', metadataURI)
      console.log('🔐 Database-only claim validation completed')

    } else if (body.type === 'deployClaimableNFT') {
      console.log('🏭 Executing gasless ClaimableNFT deployment...')
      
      // Get factory address
      const claimableFactoryAddress = getClaimableNFTFactoryAddress(body.chainId)
      if (!claimableFactoryAddress) {
        return NextResponse.json(
          { error: `ClaimableNFT Factory not deployed on chain ${body.chainId}` },
          { status: 400 }
        )
      }
      
      console.log('🔍 ClaimableNFT deployment params:', {
        factoryAddress: claimableFactoryAddress,
        name: body.name,
        symbol: body.symbol,
        baseTokenURI: body.baseTokenURI || 'https://ipfs.io/ipfs/',
        owner: body.userAddress,
        relayerAccount: relayerAccount.address
      })

      // Try to simulate the transaction first
      try {
        console.log('🔍 Simulating gasless ClaimableNFT deployment...')
        const simResult = await publicClient.simulateContract({
          address: claimableFactoryAddress as `0x${string}`,
          abi: CLAIMABLE_NFT_FACTORY_ABI,
          functionName: 'deployClaimableNFT',
          args: [
            body.name!,
            body.symbol!,
            body.baseTokenURI || 'https://ipfs.io/ipfs/',
            body.userAddress as `0x${string}`
          ],
          account: relayerAccount
        })
        console.log('✅ ClaimableNFT deployment simulation successful, address:', simResult.result)
      } catch (simError) {
        console.error('❌ ClaimableNFT deployment simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'ClaimableNFT deployment simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: claimableFactoryAddress as `0x${string}`,
        abi: CLAIMABLE_NFT_FACTORY_ABI,
        functionName: 'deployClaimableNFT',
        args: [
          body.name!,
          body.symbol!,
          body.baseTokenURI || 'https://ipfs.io/ipfs/',
          body.userAddress as `0x${string}`
        ],
        chain
      })

    } else if (body.type === 'addClaimCode') {
      console.log('📝 Executing gasless addClaimCode with timestamp fix...')
      
      // Use exact timestamps from request - do NOT recalculate to avoid timing issues
      const startTimestamp = body.startTime
      const endTimestamp = body.endTime
      
      if (!startTimestamp || !endTimestamp) {
        return NextResponse.json(
          { error: 'Missing required startTime or endTime for addClaimCode' },
          { status: 400 }
        )
      }
      
      console.log('🔍 AddClaimCode params:', {
        contractAddress: body.contractAddress,
        claimCode: body.claimCode,
        maxClaims: body.maxClaims || 0,
        startTime: startTimestamp,
        endTime: endTimestamp,
        metadataURI: body.metadataURI || '',
        relayerAccount: relayerAccount.address,
        providedTimestamps: 'Using exact timestamps from request'
      })

      // Try to simulate the transaction first
      try {
        console.log('🔍 Simulating gasless addClaimCode...')
        await publicClient.simulateContract({
          address: body.contractAddress as `0x${string}`,
          abi: CLAIMABLE_NFT_ABI,
          functionName: 'addClaimCode',
          args: [
            body.claimCode!,
            BigInt(body.maxClaims || 0),
            BigInt(startTimestamp),
            BigInt(endTimestamp),
            body.metadataURI || ''
          ],
          account: relayerAccount
        })
        console.log('✅ AddClaimCode simulation successful')
      } catch (simError) {
        console.error('❌ AddClaimCode simulation failed:', simError)
        return NextResponse.json(
          { 
            error: 'AddClaimCode simulation failed',
            details: simError instanceof Error ? simError.message : 'Unknown simulation error',
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: body.contractAddress as `0x${string}`,
        abi: CLAIMABLE_NFT_ABI,
        functionName: 'addClaimCode',
        args: [
          body.claimCode!,
          BigInt(body.maxClaims || 0),
          BigInt(startTimestamp),
          BigInt(endTimestamp),
          body.metadataURI || ''
        ],
        chain
      })

    } else {
      return NextResponse.json(
        { error: `Unsupported operation type: ${body.type}. Supported types: 'mint', 'createCollection', 'upgradeSubscription', 'approveUSDC', 'mintV4', 'createCollectionV4', 'mintV6', 'createCollectionV6', 'upgradeToMaster', 'upgradeToElite', 'downgradeSubscription', 'claimNFT', 'deployClaimableNFT', 'addClaimCode'.` },
        { status: 400 }
      )
    }

    console.log('✅ Gasless transaction submitted by relayer:', hash)

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: hash as `0x${string}` 
    })

    console.log('🎉 Gasless transaction confirmed:', {
      hash,
      status: receipt.status,
      gasUsed: receipt.gasUsed.toString()
    })

    // Extract contract address for contract creation
    
    if (body.type === 'createCollection' || body.type === 'createCollectionV4') {
      console.log('🔍 Looking for CollectionCreated event in transaction logs...')
      console.log('📄 Transaction receipt logs:', receipt.logs.length, 'logs found')
      
      // Calculate the correct CollectionCreated event topic hash
      // event CollectionCreated(address indexed collection, address indexed artist, string name, string symbol, uint256 indexed collectionId)
      const { keccak256, toHex } = await import('viem')
      const collectionCreatedTopic = keccak256(toHex('CollectionCreated(address,address,string,string,uint256)'))
      console.log('🔍 Looking for event topic:', collectionCreatedTopic)
      console.log('🔍 Factory address:', factoryAddress)
      
      for (const log of receipt.logs) {
        console.log('📄 Log:', {
          address: log.address,
          topics: log.topics,
          data: log.data,
          isFromFactory: log.address.toLowerCase() === factoryAddress.toLowerCase(),
          topicMatches: log.topics[0] === collectionCreatedTopic
        })
        
        if (log.address.toLowerCase() === factoryAddress.toLowerCase() && 
            log.topics[0] === collectionCreatedTopic) {
          // Collection address is the first indexed parameter (topics[1])
          contractAddress = log.topics[1] as string
          // Remove padding from address (topics are 32 bytes, addresses are 20 bytes)
          contractAddress = '0x' + contractAddress.slice(-40)
          console.log('🎯 Extracted collection address:', contractAddress)
          break
        }
      }
      
      // Additional debugging: Try to find any event that could be the collection creation
      if (!contractAddress) {
        console.log('🔍 No matching event found, looking for any events from factory...')
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
            console.log('📄 Factory event found:', {
              address: log.address,
              topics: log.topics,
              data: log.data,
              possibleEventSig: log.topics[0]
            })
          }
        }
      }
      
      if (!contractAddress && predictedContractAddress) {
        console.log('⚠️ Could not find CollectionCreated event, using predicted address from simulation...')
        contractAddress = predictedContractAddress as string
        console.log('✅ Using predicted contract address:', contractAddress)
      } else if (!contractAddress) {
        console.log('⚠️ Could not find CollectionCreated event and no predicted address available...')
        console.log('📄 All receipt logs:')
        receipt.logs.forEach((log, index) => {
          console.log(`Log ${index}:`, {
            address: log.address,
            topics: log.topics.slice(0, 2), // First 2 topics for brevity
            data: log.data.slice(0, 50) + '...' // First 50 chars of data
          })
        })
      }
    } else if (body.type === 'deployClaimableNFT') {
      console.log('🔍 Looking for ClaimableNFTDeployed event in transaction logs...')
      console.log('📄 Transaction receipt logs:', receipt.logs.length, 'logs found')
      
      // Calculate the ClaimableNFTDeployed event topic hash
      const { keccak256, toHex } = await import('viem')
      const claimableNFTDeployedTopic = keccak256(toHex('ClaimableNFTDeployed(address,string,string,address)'))
      console.log('🔍 Looking for event topic:', claimableNFTDeployedTopic)
      
      const claimableFactoryAddress = getClaimableNFTFactoryAddress(body.chainId)
      console.log('🔍 Factory address:', claimableFactoryAddress)
      
      for (const log of receipt.logs) {
        console.log('📄 Log:', {
          address: log.address,
          topics: log.topics,
          data: log.data,
          isFromFactory: log.address.toLowerCase() === claimableFactoryAddress?.toLowerCase(),
          topicMatches: log.topics[0] === claimableNFTDeployedTopic
        })
        
        if (log.address.toLowerCase() === claimableFactoryAddress?.toLowerCase() && 
            log.topics[0] === claimableNFTDeployedTopic) {
          // ClaimableNFT address is the first indexed parameter (topics[1])
          contractAddress = log.topics[1] as string
          // Remove padding from address (topics are 32 bytes, addresses are 20 bytes)
          contractAddress = '0x' + contractAddress.slice(-40)
          console.log('🎯 Extracted ClaimableNFT address:', contractAddress)
          break
        }
      }
      
      if (!contractAddress) {
        console.log('⚠️ Could not find ClaimableNFTDeployed event - checking all logs...')
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() === claimableFactoryAddress?.toLowerCase()) {
            console.log('📄 Factory event found:', {
              address: log.address,
              topics: log.topics,
              data: log.data,
              possibleEventSig: log.topics[0]
            })
          }
        }
      }
    } else if (body.type === 'claimNFT') {
      console.log('🔍 Token ID will be extracted from successful claim transaction...')
      // Token ID is handled within the claimNFT block above
    }

    // Check if transaction was successful
    const transactionSuccess = receipt.status === 'success'
    
    if (!transactionSuccess) {
      console.error('❌ Transaction reverted:', {
        hash,
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString()
      })
      
      return NextResponse.json({
        success: false,
        error: 'Transaction reverted',
        transactionHash: hash,
        contractAddress,
        tokenId,
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
        relayerPaid: true
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      contractAddress,
      tokenId,
      status: receipt.status,
      gasUsed: receipt.gasUsed.toString(),
      relayerPaid: true
    })

  } catch (error) {
    console.error('❌ Gasless relay error:', error)
    
    return NextResponse.json(
      { 
        error: 'Gasless relay failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}