import { createConfig } from '@privy-io/wagmi'
import { http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

// Get default chain based on testing mode
const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
const targetChain = isTestingMode ? baseSepolia : base

// Configure chain-specific settings
const chainConfig = {
  [base.id]: {
    ...base,
    rpcUrls: {
      ...base.rpcUrls,
      default: { http: [process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'] },
    }
  },
  [baseSepolia.id]: {
    ...baseSepolia,
    rpcUrls: {
      ...baseSepolia.rpcUrls,
      default: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'] },
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