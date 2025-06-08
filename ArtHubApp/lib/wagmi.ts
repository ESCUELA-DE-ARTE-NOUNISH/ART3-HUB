import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { frameConnector } from './connector'
import { injected, walletConnect } from 'wagmi/connectors'

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")

// Select the appropriate chain based on the chain ID
const targetChain = TARGET_CHAIN_ID === 8453 ? base : baseSepolia

// Create transports object with proper typing for both chains
const transports = {
  [base.id]: http(),
  [baseSepolia.id]: http(),
} as const

// WalletConnect project ID is required for WalletConnect v2
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined')
}

// Configure chain-specific settings
const chainConfig = {
  [base.id]: {
    ...base,
    rpcUrls: {
      ...base.rpcUrls,
      default: { http: [process.env.NEXT_PUBLIC_RPC_URL_BASE || ''] },
    }
  },
  [baseSepolia.id]: {
    ...baseSepolia,
    rpcUrls: {
      ...baseSepolia.rpcUrls,
      default: { http: [process.env.NEXT_PUBLIC_RPC_URL_BASE_SEPOLIA || ''] },
    }
  }
}

// Use the chain config for the target chain
const configuredChain = chainConfig[targetChain.id]

export const config = createConfig({
  chains: [configuredChain],
  transports,
  connectors: [
    frameConnector(),
    // Always include injected and walletConnect for fallback scenarios
    injected(),
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: 'Art3 Hub',
        description: 'AI-powered onboarding experience for visual artists entering Web3',
        url: process.env.NEXT_PUBLIC_SITE_URL || '',
        icons: [process.env.NEXT_PUBLIC_IMAGE_URL || ''],
      },
    }),
  ]
}) 