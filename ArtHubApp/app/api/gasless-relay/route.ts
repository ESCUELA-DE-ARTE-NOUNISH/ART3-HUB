// Gasless Relay API - Backend endpoint that submits transactions on behalf of users
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia, base } from 'viem/chains'

// Types for the gasless relay requests
interface GaslessRelayRequest {
  type: 'mint' | 'createCollection'
  voucher: any
  signature: string
  collectionAddress?: string
  chainId: number
}

// Gasless Relayer ABI
const GASLESS_RELAYER_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "name": "to", "type": "address" },
          { "name": "tokenURI", "type": "string" },
          { "name": "nonce", "type": "uint256" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "voucher",
        "type": "tuple"
      },
      { "name": "signature", "type": "bytes" },
      { "name": "collectionAddress", "type": "address" }
    ],
    "name": "gaslessMint",
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
    "name": "gaslessCreateCollection",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Get relayer contract address based on chain
function getRelayerAddress(chainId: number): string | null {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_GASLESS_RELAYER_84532 || null
    case 8453: // Base Mainnet
      return process.env.NEXT_PUBLIC_GASLESS_RELAYER_8453 || null
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
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
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

    // Validate request
    if (!body.voucher || !body.signature || !body.chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: voucher, signature, chainId' },
        { status: 400 }
      )
    }

    // Get relayer address
    const relayerAddress = getRelayerAddress(body.chainId)
    if (!relayerAddress) {
      return NextResponse.json(
        { error: `Gasless relayer not deployed on chain ${body.chainId}` },
        { status: 400 }
      )
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
      relayerAddress,
      relayerAccount: relayerAccount.address,
      chainId: body.chainId
    })

    // Verify relayer contract exists and has correct functions
    try {
      console.log('🔍 Verifying relayer contract...')
      const contractCode = await publicClient.getCode({
        address: relayerAddress as `0x${string}`
      })
      
      if (!contractCode || contractCode === '0x') {
        return NextResponse.json(
          { 
            error: 'Relayer contract not found',
            address: relayerAddress,
            chainId: body.chainId
          },
          { status: 404 }
        )
      }
      
      console.log('✅ Relayer contract found with bytecode')
    } catch (contractError) {
      console.error('❌ Contract verification failed:', contractError)
      return NextResponse.json(
        { 
          error: 'Failed to verify relayer contract',
          details: contractError instanceof Error ? contractError.message : 'Unknown error'
        },
        { status: 500 }
      )
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

    // Convert string values back to BigInt for contract interaction
    if (body.voucher.nonce && typeof body.voucher.nonce === 'string') {
      body.voucher.nonce = BigInt(body.voucher.nonce)
    }
    if (body.voucher.deadline && typeof body.voucher.deadline === 'string') {
      body.voucher.deadline = BigInt(body.voucher.deadline)
    }
    if (body.voucher.royaltyFeeNumerator && typeof body.voucher.royaltyFeeNumerator === 'string') {
      body.voucher.royaltyFeeNumerator = BigInt(body.voucher.royaltyFeeNumerator)
    }

    let hash: string

    // Execute the appropriate transaction
    if (body.type === 'mint') {
      if (!body.collectionAddress) {
        return NextResponse.json(
          { error: 'collectionAddress required for mint operations' },
          { status: 400 }
        )
      }

      console.log('🎯 Executing gasless mint via relayer...')
      hash = await walletClient.writeContract({
        address: relayerAddress as `0x${string}`,
        abi: GASLESS_RELAYER_ABI,
        functionName: 'gaslessMint',
        args: [body.voucher, body.signature as `0x${string}`, body.collectionAddress as `0x${string}`],
        chain
      })

    } else if (body.type === 'createCollection') {
      console.log('🏭 Executing gasless collection creation via relayer...')
      console.log('🔍 Collection creation params:', {
        relayerAddress,
        voucher: body.voucher,
        signature: body.signature,
        relayerAccount: relayerAccount.address
      })

      // Try to simulate the transaction first to get better error info
      try {
        console.log('🔍 Simulating gasless collection creation...')
        await publicClient.simulateContract({
          address: relayerAddress as `0x${string}`,
          abi: GASLESS_RELAYER_ABI,
          functionName: 'gaslessCreateCollection',
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
            voucher: body.voucher,
            relayerAccount: relayerAccount.address
          },
          { status: 400 }
        )
      }

      hash = await walletClient.writeContract({
        address: relayerAddress as `0x${string}`,
        abi: GASLESS_RELAYER_ABI,
        functionName: 'gaslessCreateCollection',
        args: [body.voucher, body.signature as `0x${string}`],
        chain
      })

    } else {
      return NextResponse.json(
        { error: `Unsupported operation type: ${body.type}` },
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

    return NextResponse.json({
      success: true,
      transactionHash: hash,
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