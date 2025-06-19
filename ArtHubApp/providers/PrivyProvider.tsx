"use client"

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'wagmi/chains'
import { privyWagmiConfig } from '@/lib/privy-wagmi'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import React, { createContext, useContext } from 'react'

// Get default chain based on testing mode
const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
const targetChain = isTestingMode ? baseSepolia : base

// Create a client for react-query
const queryClient = new QueryClient()

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
  
  try {
    const { context } = useMiniKit()
    const isMiniKit = !!context
    
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
  } catch (error) {
    // Fallback if MiniKit hook fails
    console.warn('MiniKit hook failed, using fallback provider setup:', error)
    
    if (!appId) {
      return <FallbackPrivyProvider>{children}</FallbackPrivyProvider>
    }

    return (
      <PrivyProvider
        appId={appId}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#ec4899',
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
}