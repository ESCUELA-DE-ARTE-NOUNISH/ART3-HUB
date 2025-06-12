import { http, createConfig } from 'wagmi'
import { base, baseSepolia, celo, celoAlfajores } from 'wagmi/chains'
import { frameConnector } from './connector'
import { injected, walletConnect } from 'wagmi/connectors'
import { defineChain } from 'viem'

// Define Zora chains since they're not in wagmi/chains yet
const zora = defineChain({
  id: 7777777,
  name: 'Zora',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { 
      http: [
        process.env.NEXT_PUBLIC_ZORA_RPC_URL || 'https://rpc.zora.energy'
      ] 
    },
  },
  blockExplorers: {
    default: { name: 'Zora Explorer', url: 'https://explorer.zora.energy' },
  },
})

const zoraSepolia = defineChain({
  id: 999999999,
  name: 'Zora Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { 
      http: [
        process.env.NEXT_PUBLIC_ZORA_SEPOLIA_RPC_URL || 'https://sepolia.rpc.zora.energy'
      ] 
    },
  },
  blockExplorers: {
    default: { name: 'Zora Sepolia Explorer', url: 'https://sepolia.explorer.zora.energy' },
  },
  testnet: true,
})

// All supported chains
const allChains = [base, baseSepolia, celo, celoAlfajores, zora, zoraSepolia] as const

// Create transports object for all chains using custom RPC URLs
const transports = {
  [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
  [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
  [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL),
  [celoAlfajores.id]: http(process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL),
  [zora.id]: http(process.env.NEXT_PUBLIC_ZORA_RPC_URL),
  [zoraSepolia.id]: http(process.env.NEXT_PUBLIC_ZORA_SEPOLIA_RPC_URL),
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
    // Prioritize injected (MetaMask) for better connection detection
    injected(),
    frameConnector(),
    walletConnect({
      projectId,
      showQrModal: false, // Don't auto-show modal
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