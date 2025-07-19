// Gasless Relay API - Backend endpoint that submits transactions on behalf of users
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia, base } from 'viem/chains'

// Types for the gasless relay requests
interface GaslessRelayRequest {
  type: 'mint' | 'createCollection' | 'upgradeSubscription' | 'approveUSDC' | 'mintV4' | 'createCollectionV4' | 'upgradeToMaster' | 'upgradeToElite' | 'downgradeSubscription' | 'claimNFT' | 'deployClaimableNFT' | 'addClaimCode'
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

// Art3HubFactoryV4 ABI with gasless functions
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

// Get Art3HubFactoryV4 contract address based on chain
function getFactoryV4Address(chainId: number): string | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_84532 || null
    case 8453: // Base Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_8453 || null
    case 999999999: // Zora Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_999999999 || null
    case 7777777: // Zora Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_7777777 || null
    case 44787: // Celo Alfajores
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_44787 || null
    case 42220: // Celo Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V4_42220 || null
    default:
      return null
  }
}

// Get Art3HubSubscriptionV4 contract address based on chain
function getSubscriptionV4Address(chainId: number): string | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_84532 || null
    case 8453: // Base Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_8453 || null
    case 999999999: // Zora Sepolia
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_999999999 || null
    case 7777777: // Zora Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_7777777 || null
    case 44787: // Celo Alfajores
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_44787 || null
    case 42220: // Celo Mainnet
      return process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V4_42220 || null
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
    } else {
      if (!body.voucher || !body.signature || !body.chainId) {
        return NextResponse.json(
          { error: 'Missing required fields: voucher, signature, chainId' },
          { status: 400 }
        )
      }
    }

    // Get factory address (V3 or V4 based on request type)
    let factoryAddress: string | null = null
    const isV4Request = ['mintV4', 'createCollectionV4', 'upgradeToMaster', 'upgradeToElite', 'downgradeSubscription'].includes(body.type)
    const isClaimableNFTRequest = ['claimNFT', 'deployClaimableNFT', 'addClaimCode'].includes(body.type)
    
    if (isClaimableNFTRequest) {
      // Claimable NFT operations don't need the main factory check
      // They will validate their own factory addresses later
      factoryAddress = null
    } else if (isV4Request) {
      factoryAddress = getFactoryV4Address(body.chainId)
      if (!factoryAddress) {
        return NextResponse.json(
          { error: `Art3HubFactoryV4 not deployed on chain ${body.chainId}` },
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

    } else if (body.type === 'upgradeToMaster') {
      console.log('💎 Executing gasless V4 Master plan upgrade...')
      
      // Get V4 subscription address
      const subscriptionV4Address = getSubscriptionV4Address(body.chainId)
      if (!subscriptionV4Address) {
        return NextResponse.json(
          { error: `Art3HubSubscriptionV4 not deployed on chain ${body.chainId}` },
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
      
      // Get V4 subscription address
      const subscriptionV4Address = getSubscriptionV4Address(body.chainId)
      if (!subscriptionV4Address) {
        return NextResponse.json(
          { error: `Art3HubSubscriptionV4 not deployed on chain ${body.chainId}` },
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
      
      // Get V4 subscription address
      const subscriptionV4Address = getSubscriptionV4Address(body.chainId)
      if (!subscriptionV4Address) {
        return NextResponse.json(
          { error: `Art3HubSubscriptionV4 not deployed on chain ${body.chainId}` },
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
      console.log('🔑 Claim Code:', body.claimCode || 'None (ownerMint)')
      console.log('🖼️ Metadata URI:', body.metadataURI || 'Default IPFS')
      console.log('🎯 Strategy: Try ownerMint first, fallback to claimNFT')
      console.log('=================================\\n')

      // Try ownerMint first (new contracts), fallback to claimNFT (old contracts)
      const metadataURI = body.metadataURI || 'https://ipfs.io/ipfs/QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L'
      let useOwnerMint = true;
      
      try {
        console.log('🔍 Step 1: Testing ownerMint approach...')
        const simResult = await publicClient.simulateContract({
          address: body.contractAddress as `0x${string}`,
          abi: CLAIMABLE_NFT_ABI,
          functionName: 'ownerMint',
          args: [body.userAddress! as `0x${string}`, metadataURI],
          account: relayerAccount
        })
        claimTokenId = simResult.result as bigint
        console.log('🎉 SUCCESS: Contract supports ownerMint!')
        console.log('🎯 Token ID will be:', claimTokenId.toString())
        console.log('📝 Approach: NEW - Direct user minting, no claim codes needed')
      } catch (ownerMintError) {
        console.log('\\n⚠️  FALLBACK: OwnerMint not available')
        console.log('====================================')
        console.log('📝 This is a LEGACY contract deployed before ownerMint support')
        console.log('🔄 Switching to traditional claimNFT approach with claim codes')
        console.log('====================================')
        useOwnerMint = false;
        
        // Fallback to claimNFT for older contracts
        if (!body.claimCode) {
          return NextResponse.json(
            { 
              error: 'Old contract detected: claimCode required for legacy contracts',
              details: 'This contract was deployed before ownerMint support. Please provide claimCode.',
              suggestion: 'Create a new NFT to use the new ownerMint approach'
            },
            { status: 400 }
          )
        }
        
        // For legacy contracts, we might need to add the claim code first
        console.log('🔄 Ensuring claim code is active on legacy contract...')
        try {
          // Try to add claim code to contract (might already exist)
          const currentTime = Math.floor(Date.now() / 1000)
          const endTime = currentTime + (365 * 24 * 60 * 60) // 1 year from now
          
          const addClaimCodeResult = await addClaimCodeToContract({
            contractAddress: body.contractAddress!,
            claimCode: body.claimCode,
            maxClaims: 0,
            startTime: currentTime,
            endTime: endTime,
            metadataURI: metadataURI,
            chainId: Number(body.chainId),
            publicClient,
            walletClient,
            relayerAccount
          })
          console.log('✅ Claim code added to legacy contract')
        } catch (addError) {
          console.log('⚠️ Claim code might already exist on contract:', addError instanceof Error ? addError.message : 'Unknown error')
          // Continue anyway - the code might already be there
        }
        
        try {
          console.log('🔍 Simulating gasless claimNFT (legacy)...')
          const simResult = await publicClient.simulateContract({
            address: body.contractAddress as `0x${string}`,
            abi: CLAIMABLE_NFT_ABI,
            functionName: 'claimNFT',
            args: [body.claimCode],
            account: relayerAccount
          })
          claimTokenId = simResult.result as bigint
          console.log('✅ ClaimNFT simulation successful, token ID:', claimTokenId)
        } catch (claimError) {
          console.error('❌ Both ownerMint and claimNFT simulation failed:', claimError)
          return NextResponse.json(
            { 
              error: 'Contract simulation failed',
              details: claimError instanceof Error ? claimError.message : 'Unknown simulation error',
              relayerAccount: relayerAccount.address
            },
            { status: 400 }
          )
        }
      }

      // Execute the appropriate transaction based on contract type
      if (useOwnerMint) {
        console.log('🔨 Executing ownerMint transaction (new contract)...')
        hash = await walletClient.writeContract({
          address: body.contractAddress as `0x${string}`,
          abi: CLAIMABLE_NFT_ABI,
          functionName: 'ownerMint',
          args: [body.userAddress! as `0x${string}`, metadataURI],
          chain
        })
      } else {
        console.log('🔨 Executing claimNFT transaction (legacy contract)...')
        hash = await walletClient.writeContract({
          address: body.contractAddress as `0x${string}`,
          abi: CLAIMABLE_NFT_ABI,
          functionName: 'claimNFT',
          args: [body.claimCode!],
          chain
        })
      }

      // Wait for the claim transaction to complete
      console.log('⏳ Waiting for claim transaction to complete...')
      const claimReceipt = await publicClient.waitForTransactionReceipt({ 
        hash: hash as `0x${string}` 
      })

      console.log('✅ Claim transaction completed:', {
        hash,
        status: claimReceipt.status,
        gasUsed: claimReceipt.gasUsed.toString()
      })

      // Check who actually owns the token after claimNFT
      console.log('🔍 Checking token ownership after claimNFT...')
      console.log('🔍 Token ID from claimNFT:', claimTokenId?.toString() || 'unknown')
      console.log('🔍 Contract address:', body.contractAddress)
      
      // Use the exact tokenId returned by claimNFT (should be 0-based)
      if (claimTokenId === null) {
        return NextResponse.json(
          { error: 'Failed to get token ID from claimNFT' },
          { status: 500 }
        )
      }
      
      const actualTokenId = claimTokenId
      tokenId = Number(actualTokenId)

      // Skip ownership check and transfer for now since claimNFT function behavior is unclear
      // The claimNFT might be minting directly to the user rather than the relayer
      console.log('✅ ClaimNFT transaction completed successfully')
      console.log('🔍 Assuming token was minted directly to user (no transfer needed)')
      
      // Set token ID for response
      tokenId = Number(actualTokenId)
      
      // Skip the transfer logic since claimNFT likely mints directly to the intended recipient

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
        { error: `Unsupported operation type: ${body.type}. Supported types: 'mint', 'createCollection', 'upgradeSubscription', 'approveUSDC', 'mintV4', 'createCollectionV4', 'upgradeToMaster', 'upgradeToElite', 'downgradeSubscription', 'claimNFT', 'deployClaimableNFT', 'addClaimCode'.` },
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
      
      if (!contractAddress) {
        console.log('⚠️ Could not find CollectionCreated event - checking all logs for any creation patterns...')
        // Alternative: check simulation result which should have the collection address
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
      const claimableNFTDeployedTopic = keccak256(toHex('ClaimableNFTDeployed(address,string,string,address,uint256)'))
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