"use client"

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, ChevronDown, SwitchCamera, User, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { truncateEthAddress } from "@/lib/utils"
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets } from '@privy-io/react-auth'
import { useUserProfile } from '@/hooks/useUserProfile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { base, baseSepolia } from 'wagmi/chains'

export function ConnectMenu() {
  const [mounted, setMounted] = useState(false)
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchPending } = useSwitchChain()
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // MiniKit context - this will tell us if we're in a MiniKit environment
  const { context } = useMiniKit()
  const isMiniKit = !!context
  
  // User profile tracking
  const { userProfile, isProfileComplete } = useUserProfile()
  
  // Privy hooks (safe to call even without provider)
  const privyHooks = (() => {
    try {
      return usePrivy()
    } catch {
      return { login: () => {}, logout: () => {}, authenticated: false }
    }
  })()
  const { login, logout, authenticated } = privyHooks
  
  // Privy wallets hook
  const walletsHooks = (() => {
    try {
      return useWallets()
    } catch {
      return { wallets: [] }
    }
  })()
  const { wallets } = walletsHooks

  // Get target chain from env
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  const targetChain = isTestingMode ? baseSepolia : base
  const TARGET_CHAIN_ID = targetChain.id
  const NETWORK_NAME = targetChain.name

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if we're on the wrong network
  useEffect(() => {
    const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID
    let connected = false
    
    if (isMiniKit) {
      // In MiniKit, use wagmi's isConnected
      connected = isConnected
    } else if (hasPrivy) {
      // In browser with Privy, check Privy authentication
      connected = authenticated && wallets.length > 0
    } else {
      // Fallback to wagmi
      connected = isConnected
    }
    
    if (connected) {
      const wrongNetwork = chainId !== TARGET_CHAIN_ID
      setIsWrongNetwork(wrongNetwork)
      if (wrongNetwork) {
        setError(`Please switch to ${NETWORK_NAME}`)
      } else {
        setError(null)
      }
    } else {
      setIsWrongNetwork(false)
      setError(null)
    }
  }, [chainId, isConnected, authenticated, wallets, isMiniKit, TARGET_CHAIN_ID, NETWORK_NAME])

  // Handle network switch
  const handleSwitchNetwork = async () => {
    try {
      setError(null)
      switchChain({ chainId: TARGET_CHAIN_ID })
    } catch (error) {
      console.error('Failed to switch network:', error)
      setError(`Failed to switch to ${NETWORK_NAME}. Please try manually.`)
    }
  }

  // Handle wallet disconnect with redirect
  const handleDisconnect = () => {
    try {
      const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID
      
      if (isMiniKit) {
        // In MiniKit, use wagmi disconnect
        disconnect()
      } else if (hasPrivy && authenticated) {
        logout()
      } else {
        disconnect()
      }
      
      // Redirect to root page after disconnect
      router.push('/')
    } catch (error) {
      console.error('Failed to disconnect:', error)
      // Still try to redirect even if disconnect fails
      router.push('/')
    }
  }

  // Don't render anything on the server
  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        className="bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 hover:text-pink-600"
        disabled
      >
        <Wallet className="h-4 w-4" />
      </Button>
    )
  }

  const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID
  let connected = false
  let userAddress = ""
  
  if (isMiniKit) {
    // In MiniKit, use wagmi's connection state
    connected = isConnected
    userAddress = address || ""
  } else if (hasPrivy) {
    // In browser with Privy, use Privy's state
    connected = authenticated && wallets.length > 0
    userAddress = wallets[0]?.address || ""
  } else {
    // Fallback to wagmi
    connected = isConnected
    userAddress = address || ""
  }

  if (connected) {
    return (
      <div className="flex flex-col items-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={isWrongNetwork ? "destructive" : "outline"}
              className={cn(
                isWrongNetwork ? "animate-pulse" : "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 hover:text-pink-600",
                "min-w-[130px] justify-between"
              )}
            >
              <div className="flex items-center">
                <Wallet className="mr-1 h-4 w-4" />
                {isWrongNetwork ? (
                  <>Wrong Network</>
                ) : (
                  <div className="flex items-center gap-1">
                    <span>{userAddress ? truncateEthAddress(userAddress) : 'Connected'}</span>
                    {userProfile && (
                      isProfileComplete ? (
                        <CheckCircle className="h-3 w-3 text-green-500 fill-current" />
                      ) : (
                        <XCircle className="h-3 w-3 text-yellow-500 fill-current" />
                      )
                    )}
                  </div>
                )}
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px]">
            {isWrongNetwork && (
              <DropdownMenuItem
                className="bg-pink-500 hover:bg-pink-600 cursor-pointer"
                onClick={handleSwitchNetwork}
                disabled={isSwitchPending}
              >
                <SwitchCamera className={cn("mr-2 h-4 w-4", isSwitchPending && "animate-spin")} />
                {isSwitchPending ? 'Switching...' : `Switch to ${NETWORK_NAME}`}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500 cursor-pointer"
              onClick={handleDisconnect}
            >
              <LogOut className="mr-1 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {error && (
          <p className="text-sm text-red-500 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    )
  }

  const handleConnect = async () => {
    try {
      setError(null)
      
      if (isMiniKit) {
        // In MiniKit, let it handle the connection automatically
        // MiniKit automatically uses Farcaster connector or falls back to CoinbaseWallet
        if (connectors.length > 0) {
          connect({ connector: connectors[0] })
        } else {
          throw new Error('No connectors available in MiniKit')
        }
      } else {
        // For browser mode, fallback to regular wallet connectors
        const injectedConnector = connectors.find(c => c.id === 'injected')
        const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')
        
        if (injectedConnector && window.ethereum) {
          connect({ connector: injectedConnector })
        } else if (walletConnectConnector) {
          connect({ connector: walletConnectConnector })
        } else {
          throw new Error('No suitable wallet connector found')
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      setError('Failed to connect wallet. Please try again.')
    }
  }

  const handleSocialConnect = async () => {
    try {
      setError(null)
      const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
      
      if (!appId) {
        setError('Privy is not configured.')
        return
      }
      
      // Privy login will handle both social and wallet options
      login()
    } catch (error) {
      console.error('Failed to connect with Privy:', error)
      setError('Failed to connect. Please try again.')
    }
  }

  // Determine which UI to show based on environment
  if (isMiniKit) {
    // MiniKit environment - show simple connect button
    return (
      <div className="flex flex-col items-end gap-2">
        <Button
          onClick={handleConnect}
          className={cn(
            "bg-pink-500 hover:bg-pink-600",
            "text-white",
            "flex items-center gap-2"
          )}
        >
          <Wallet className="h-4 w-4" />
          Join
        </Button>
        {error && (
          <p className="text-sm text-red-500 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    )
  }

  // Browser mode - check if Privy is available
  if (hasPrivy) {
    // Browser with Privy - show social login
    return (
      <div className="flex flex-col items-end gap-2">
        <Button
          onClick={handleSocialConnect}
          className={cn(
            "bg-pink-500 hover:bg-pink-600",
            "text-white",
            "flex items-center gap-2"
          )}
        >
          <User className="h-4 w-4" />
          Join
        </Button>
        {error && (
          <p className="text-sm text-red-500 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    )
  }

  // Browser without Privy - show unavailable
  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        disabled
        className={cn(
          "bg-gray-500",
          "text-white",
          "flex items-center gap-2"
        )}
      >
        <Wallet className="h-4 w-4" />
        Login Unavailable
      </Button>
      <p className="text-sm text-red-500">
        Privy is not configured
      </p>
    </div>
  )
} 