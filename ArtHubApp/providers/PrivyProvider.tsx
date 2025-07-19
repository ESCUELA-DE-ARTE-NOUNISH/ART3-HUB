"use client"

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'wagmi/chains'
import { createPrivyWagmiConfig } from '@/lib/privy-wagmi'
// Import MiniKit conditionally to avoid SSR issues
let useMiniKit: any = null
try {
  const minikit = require('@coinbase/onchainkit/minikit')
  useMiniKit = minikit.useMiniKit
} catch (error) {
  // MiniKit not available
}
import React, { createContext, useContext, useMemo } from 'react'

// Get default chain based on testing mode
const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
const targetChain = isTestingMode ? baseSepolia : base

// Create a single QueryClient instance to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

// Fallback context for when Privy is not available
const FallbackPrivyContext = createContext({
  authenticated: false,
  login: () => {},
  logout: () => {},
  user: null,
})

const FallbackWalletsContext = createContext({
  wallets: [],
})

// Fallback providers for MiniKit mode
function FallbackPrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <FallbackPrivyContext.Provider value={{
      authenticated: false,
      login: () => {},
      logout: () => {},
      user: null,
    }}>
      <FallbackWalletsContext.Provider value={{ wallets: [] }}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </FallbackWalletsContext.Provider>
    </FallbackPrivyContext.Provider>
  )
}

interface PrivyAppProviderProps {
  children: React.ReactNode
}

export function PrivyAppProvider({ children }: PrivyAppProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  
  // Create wagmi config once to avoid multiple WalletConnect initializations
  const wagmiConfig = useMemo(() => {
    return createPrivyWagmiConfig()
  }, [])
  
  // Use client-side check without hooks during SSR
  const [isMiniKit, setIsMiniKit] = React.useState(false)
  
  React.useEffect(() => {
    // Check for MiniKit only on client side
    try {
      if (useMiniKit) {
        const { context } = useMiniKit()
        setIsMiniKit(!!context)
      }
    } catch (error) {
      // Ignore error if MiniKit hook fails
      setIsMiniKit(false)
    }
  }, [])
  
  // If no Privy app ID is provided or we're in MiniKit, use fallback provider
  if (!appId || isMiniKit) {
    return <FallbackPrivyProvider>{children}</FallbackPrivyProvider>
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
        loginMethods: ['email', 'google', 'instagram', 'twitter', 'wallet'],
        defaultChain: targetChain,
        supportedChains: [base, baseSepolia],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={wagmiConfig}>
          {children}
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}