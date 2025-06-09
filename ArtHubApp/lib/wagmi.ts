import { http, createConfig } from 'wagmi'
import { base, baseSepolia, celo, celoAlfajores } from 'wagmi/chains'
import { frameConnector } from './connector'
import { injected, walletConnect } from 'wagmi/connectors'

// Define Zora chains since they're not in wagmi/chains yet
const zora = {
  id: 7777777,
  name: 'Zora',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.zora.energy'] },
  },
  blockExplorers: {
    default: { name: 'Zora Explorer', url: 'https://explorer.zora.energy' },
  },
} as const

const zoraSepolia = {
  id: 999999999,
  name: 'Zora Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.rpc.zora.energy'] },
  },
  blockExplorers: {
    default: { name: 'Zora Sepolia Explorer', url: 'https://sepolia.explorer.zora.energy' },
  },
  testnet: true,
} as const

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")

// All supported chains
const allChains = [base, baseSepolia, celo, celoAlfajores, zora, zoraSepolia]

// Select the primary chain based on the chain ID
const targetChain = allChains.find(chain => chain.id === TARGET_CHAIN_ID) || baseSepolia

// Create transports object for all chains
const transports = {
  [base.id]: http(),
  [baseSepolia.id]: http(),
  [celo.id]: http(),
  [celoAlfajores.id]: http(),
  [zora.id]: http(),
  [zoraSepolia.id]: http(),
} as const

// WalletConnect project ID is required for WalletConnect v2
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined')
}

export const config = createConfig({
  chains: allChains,
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

// Export chain definitions for use in other components
export { base, baseSepolia, celo, celoAlfajores, zora, zoraSepolia, allChains } 