import { createConfig } from '@privy-io/wagmi'
import { http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")
const targetChain = TARGET_CHAIN_ID === 8453 ? base : baseSepolia

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

const configuredChain = chainConfig[targetChain.id]

export const privyWagmiConfig = createConfig({
  chains: [configuredChain],
  transports: {
    [configuredChain.id]: http(),
  },
})