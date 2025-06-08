"use client"

import React, { useEffect, useState } from "react"
import { WagmiProvider } from 'wagmi'
import { WagmiProvider as PrivyWagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'
import { privyWagmiConfig } from '@/lib/privy-wagmi'
import { sdk } from "@farcaster/frame-sdk"

// Create a simple context for wallet connection state
export const WalletContext = React.createContext({
  isConnected: false,
  address: "",
  connect: () => {},
  disconnect: () => {},
})

// Create a client
const queryClient = new QueryClient()

// Create a provider that chooses config based on environment
export function WagmiConfig({ children }: { children: React.ReactNode }) {
  const [isFarcaster, setIsFarcaster] = useState(false)
  const [mounted, setMounted] = useState(false)
  const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID
  
  useEffect(() => {
    const checkFarcasterContext = async () => {
      try {
        const context = await sdk.context
        setIsFarcaster(!!context?.client?.clientFid)
      } catch (error) {
        console.error('Failed to get Farcaster context:', error)
        setIsFarcaster(false)
      }
      setMounted(true)
    }

    checkFarcasterContext()
  }, [])

  if (!mounted) {
    // Return a loading state while checking context
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    )
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      {isFarcaster || !hasPrivy ? (
        // Use regular wagmi config for Farcaster or when Privy is not configured
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      ) : (
        // Use Privy wagmi config for browser mode when Privy is configured
        <PrivyWagmiProvider config={privyWagmiConfig}>
          {children}
        </PrivyWagmiProvider>
      )}
    </QueryClientProvider>
  )
}

