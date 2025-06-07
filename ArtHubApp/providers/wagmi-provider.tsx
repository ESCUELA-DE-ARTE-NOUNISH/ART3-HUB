"use client"

import React from "react"
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'

// Create a simple context for wallet connection state
export const WalletContext = React.createContext({
  isConnected: false,
  address: "",
  connect: () => {},
  disconnect: () => {},
})

// Create a client
const queryClient = new QueryClient()

// Create a simple provider that simulates wallet connection
export function WagmiConfig({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

