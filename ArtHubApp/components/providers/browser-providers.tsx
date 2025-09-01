"use client"

import { PropsWithChildren } from "react"
import { PrivyAppProvider } from "@/providers/PrivyProvider"
import { UserSessionTracker } from "@/components/UserSessionTracker"

/**
 * Browser Environment Provider Stack
 * Maintains existing Privy + Wagmi setup for browser environments
 * This preserves the current working implementation
 */
export function BrowserProviders({ children }: PropsWithChildren) {
  console.log('🌐 Browser Environment Active - Using Privy + Wagmi')
  
  return (
    <PrivyAppProvider>
      <UserSessionTracker>
        <BrowserWrapper>
          {children}
        </BrowserWrapper>
      </UserSessionTracker>
    </PrivyAppProvider>
  )
}

/**
 * Browser Environment Wrapper
 * Handles browser-specific optimizations and features
 */
function BrowserWrapper({ children }: PropsWithChildren) {
  return (
    <div className="browser-app">
      {children}
    </div>
  )
}