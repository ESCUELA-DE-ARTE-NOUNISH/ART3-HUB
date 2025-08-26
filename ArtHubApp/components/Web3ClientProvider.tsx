'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import { ClientOnly } from '@/components/ClientOnly'
import { useState } from 'react'

interface Web3ClientProviderProps {
  children: React.ReactNode
}

export function Web3ClientProvider({ children }: Web3ClientProviderProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          appearance: {
            theme: 'light',
            accentColor: '#676FFF',
          },
          loginMethods: ['email', 'wallet', 'google'],
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            {children}
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ClientOnly>
  )
}