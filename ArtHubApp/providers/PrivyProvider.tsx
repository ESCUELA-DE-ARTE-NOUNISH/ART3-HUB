"use client"

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'wagmi/chains'
import { privyWagmiConfig } from '@/lib/privy-wagmi'
import { useMiniKit } from '@coinbase/onchainkit/minikit'

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")
const targetChain = TARGET_CHAIN_ID === 8453 ? base : baseSepolia

// Create a client for react-query
const queryClient = new QueryClient()

interface PrivyAppProviderProps {
  children: React.ReactNode
}

export function PrivyAppProvider({ children }: PrivyAppProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const { context } = useMiniKit()
  const isMiniKit = !!context
  
  // If no Privy app ID is provided or we're in MiniKit, render children without Privy
  if (!appId || isMiniKit) {
    return <>{children}</>
  }

  // For browser mode with Privy
  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#ec4899', // Pink color to match your theme
          logo: process.env.NEXT_PUBLIC_IMAGE_URL || '',
        },
        loginMethods: ['email', 'google', 'twitter', 'discord', 'github', 'wallet'],
        defaultChain: targetChain,
        supportedChains: [base, baseSepolia],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={privyWagmiConfig}>
          {children}
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}