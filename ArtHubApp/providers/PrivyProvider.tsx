"use client"

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'wagmi/chains'
import { createPrivyWagmiConfig } from '@/lib/privy-wagmi'
import { config as mainWagmiConfig } from '@/lib/wagmi'
import { WagmiProvider } from 'wagmi'
// Import MiniKit conditionally to avoid SSR issues
let useMiniKit: any = null
try {
  const minikit = require('@coinbase/onchainkit/minikit')
  useMiniKit = minikit.useMiniKit
} catch (error) {
  // MiniKit not available
}
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'

// Client-only wrapper component
function ClientOnlyWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading Web3...</div>
  }

  return <>{children}</>
}

// Get default chain based on testing mode
const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
const targetChain = isTestingMode ? baseSepolia : base

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

// Fallback providers for MiniKit/Farcaster mode
function FallbackPrivyProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }))

  return (
    <FallbackPrivyContext.Provider value={{
      authenticated: false,
      login: () => {},
      logout: () => {},
      user: null,
    }}>
      <FallbackWalletsContext.Provider value={{ wallets: [] }}>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={mainWagmiConfig}>
            {children}
          </WagmiProvider>
        </QueryClientProvider>
      </FallbackWalletsContext.Provider>
    </FallbackPrivyContext.Provider>
  )
}

interface PrivyAppProviderProps {
  children: React.ReactNode
}

function InternalPrivyAppProvider({ children }: PrivyAppProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  
  // Create QueryClient once per instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }))
  
  // Create wagmi config once to avoid multiple WalletConnect initializations
  const wagmiConfig = useMemo(() => {
    return createPrivyWagmiConfig()
  }, [])
  
  // Detect Farcaster environment during initial render (not in useEffect) to prevent SSR Privy initialization
  const [isFarcasterEnvironment, setIsFarcasterEnvironment] = React.useState(() => {
    // Server-side: always use fallback to prevent Privy SSR errors
    if (typeof window === 'undefined') {
      return true; // Assume Farcaster on server to use fallback provider
    }
    
    // Client-side: detect actual environment - be more specific about Farcaster detection
    const hasFarcasterHandlers = !!(window as any).webkit?.messageHandlers?.farcaster || !!(window as any).farcaster
    const isFarcasterUserAgent = navigator.userAgent.includes('Farcaster')
    const isFarcasterUrl = window.location.href.includes('farcaster')
    const isIframe = window !== window.parent
    
    // Only consider it Farcaster if we have specific Farcaster indicators, not just iframe
    const isInFarcaster = hasFarcasterHandlers || isFarcasterUserAgent || isFarcasterUrl
    
    // Only log environment detection once per session
    if (process.env.NODE_ENV === 'development' && !window.__privyProviderLogged) {
      console.log('🎯 PrivyProvider: Environment detected:', { isInFarcaster })
      window.__privyProviderLogged = true
    }
    
    return isInFarcaster;
  })
  
  // Update environment detection on client-side only
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hasFarcasterHandlers = !!(window as any).webkit?.messageHandlers?.farcaster || !!(window as any).farcaster
    const isFarcasterUserAgent = navigator.userAgent.includes('Farcaster')
    const isFarcasterUrl = window.location.href.includes('farcaster')
    
    // Only consider it Farcaster if we have specific Farcaster indicators, not just iframe
    const isInFarcaster = hasFarcasterHandlers || isFarcasterUserAgent || isFarcasterUrl
    
    setIsFarcasterEnvironment(isInFarcaster)
  }, [appId])
  
  // If no Privy app ID is provided or we're in Farcaster, use fallback provider
  if (!appId || isFarcasterEnvironment) {
    return <FallbackPrivyProvider>{children}</FallbackPrivyProvider>
  }

  // Enhanced domain-specific logging for production debugging
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const isProd = hostname.includes('art3hub.xyz')
      
      if (isProd && !window.__privyProviderInit) {
        console.log('🏢 PRODUCTION: Privy Provider Initializing:', {
          domain: hostname,
          appId: appId ? 'configured' : 'missing',
          isFarcasterEnv: isFarcasterEnvironment,
          privyStorageOnInit: {
            localStorage: Object.keys(localStorage).filter(k => k.includes('privy')),
            sessionStorage: Object.keys(sessionStorage).filter(k => k.includes('privy')),
            cookieCount: document.cookie.split(';').filter(c => c.includes('privy')).length
          }
        })
        window.__privyProviderInit = true
      }
    }
  }, [appId, isFarcasterEnvironment])

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
        supportedChains: [targetChain], // Only show current network chain
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

// Export the client-only wrapped version
export function PrivyAppProvider({ children }: PrivyAppProviderProps) {
  return (
    <ClientOnlyWrapper>
      <InternalPrivyAppProvider>
        {children}
      </InternalPrivyAppProvider>
    </ClientOnlyWrapper>
  )
}