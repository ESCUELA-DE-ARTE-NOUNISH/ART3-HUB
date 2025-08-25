"use client"

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useRouter, useParams } from 'next/navigation'
import { defaultLocale } from '@/config/i18n'
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, ChevronDown, SwitchCamera, User, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { truncateEthAddress } from "@/lib/utils"
import { useSafeMiniKit } from '@/hooks/useSafeMiniKit'
import { useSafePrivy, useSafeWallets } from '@/hooks/useSafePrivy'
import { useUserProfile } from '@/hooks/useUserProfile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { base, baseSepolia, celo, celoAlfajores, zora, zoraSepolia } from '@/lib/wagmi'

export function ConnectMenu() {
  const [mounted, setMounted] = useState(false)
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const params = useParams()
  const locale = (params?.locale as string) || defaultLocale
  
  // Translation messages for join button
  const joinMessages = {
    joinNow: locale === 'es' ? 'Únete Ahora' :
             locale === 'pt' ? 'Juntar-se Agora' :
             locale === 'fr' ? 'Rejoindre Maintenant' :
             'Join Now',
  }
  
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchPending } = useSwitchChain()
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // MiniKit context - this will tell us if we're in a MiniKit environment
  const { context } = useSafeMiniKit()
  // Simple detection - if MiniKitProvider is active, context will exist
  const isMiniKit = !!context
  
  // User profile tracking
  const { userProfile, isProfileComplete } = useUserProfile()
  
  // Safe Privy hooks that handle MiniKit mode
  const { login, logout, authenticated } = useSafePrivy()
  const { wallets } = useSafeWallets()

  // Get all supported chains
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  const supportedChains = isTestingMode 
    ? [baseSepolia, celoAlfajores, zoraSepolia]
    : [base, celo, zora]
  
  // Check if current chain is supported
  const isOnSupportedChain = supportedChains.some(chain => chain.id === chainId)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Note: Removed auto-connection to prevent user rejection errors
  // Users will need to manually connect their wallet in MiniKit
  useEffect(() => {
    if (mounted && isMiniKit && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster')
      if (farcasterConnector) {
        console.log('Farcaster connector available in MiniKit (manual connection required)')
      } else {
        console.warn('Farcaster connector not found in MiniKit environment')
      }
    }
  }, [mounted, isMiniKit, connectors])

  // Check if we're on the wrong network
  useEffect(() => {
    const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID
    let connected = false
    
    if (isMiniKit) {
      // In MiniKit, use wagmi's isConnected
      connected = isConnected
    } else if (hasPrivy) {
      // In browser with Privy, check Privy authentication
      // Fix: Check if user is authenticated, even without wallets (social login)
      connected = authenticated
    } else {
      // Fallback to wagmi
      connected = isConnected
    }
    
    if (connected) {
      const wrongNetwork = !isOnSupportedChain
      setIsWrongNetwork(wrongNetwork)
      if (wrongNetwork) {
        const supportedNetworkNames = supportedChains.map(chain => chain.name).join(', ')
        setError(`Please switch to a supported network: ${supportedNetworkNames}`)
      } else {
        setError(null)
      }
    } else {
      setIsWrongNetwork(false)
      setError(null)
    }
  }, [chainId, isConnected, authenticated, wallets, isMiniKit, isOnSupportedChain, supportedChains])

  // Handle network switch - switch to first supported chain
  const handleSwitchNetwork = async () => {
    try {
      setError(null)
      const targetChain = supportedChains[0] // Default to first supported chain
      switchChain({ chainId: targetChain.id })
    } catch (error) {
      console.error('Failed to switch network:', error)
      setError(`Failed to switch network. Please try manually.`)
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
    // Fix: Check if user is authenticated, even without wallets (social login)
    connected = authenticated
    userAddress = wallets.length > 0 ? wallets[0]?.address || "" : ""
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
                {isSwitchPending ? 'Switching...' : `Switch Network`}
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


  const handleSocialConnect = async () => {
    try {
      setError(null)
      const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
      
      if (!appId) {
        setError('Privy is not configured.')
        return
      }
      
      // Check if user is already authenticated to prevent "already logged in" error
      if (authenticated) {
        console.warn('User is already authenticated')
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
    // MiniKit environment - show manual connect button
    return (
      <div className="flex flex-col items-end gap-2">
        <Button
          onClick={async () => {
            console.log('🎯 CONNECT MENU: JOIN NOW BUTTON CLICKED IN FARCASTER')
            console.log('📊 ConnectMenu Environment State:', {
              isMiniKit,
              context: !!context,
              connectorsCount: connectors.length,
              connectors: connectors.map(c => ({ id: c.id, name: c.name, type: c.type }))
            })
            
            try {
              // Log all available connectors with full details
              console.log('🔍 DETAILED CONNECTORS ANALYSIS:')
              connectors.forEach((connector, index) => {
                console.log(`  Connector ${index}:`, {
                  id: connector.id,
                  name: connector.name,
                  type: connector.type,
                  uid: connector.uid,
                  icon: connector.icon
                })
              })
              
              // Look for the Farcaster frame connector first
              const farcasterConnector = connectors.find(c => c.id === 'farcaster' || c.type === 'frameConnector')
              console.log('🔍 ConnectMenu Farcaster connector found:', !!farcasterConnector, farcasterConnector?.name)
              
              if (farcasterConnector) {
                console.log('✅ CONNECT MENU: USING FARCASTER CONNECTOR:', farcasterConnector.name)
                console.log('🔄 ConnectMenu: Calling connect() with Farcaster connector...')
                await connect({ connector: farcasterConnector })
                console.log('✅ ConnectMenu: Connect() call completed')
              } else {
                console.error('❌ CONNECT MENU: NO FARCASTER CONNECTOR FOUND')
                console.log('🔍 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name, type: c.type })))
                
                // Try to connect with the first available connector as fallback
                if (connectors.length > 0) {
                  console.log('🔄 CONNECT MENU: TRYING FALLBACK WITH FIRST CONNECTOR:', connectors[0].name)
                  await connect({ connector: connectors[0] })
                  console.log('✅ ConnectMenu: Fallback connection completed')
                } else {
                  setError('No connectors available')
                }
              }
            } catch (error) {
              console.error('❌ CONNECT MENU: FARCASTER CONNECTION FAILED:', {
                error: error.message,
                stack: error.stack,
                name: error.name
              })
              setError('Failed to connect Farcaster wallet. Please try again.')
            }
          }}
          className={cn(
            "bg-pink-500 hover:bg-pink-600",
            "text-white",
            "flex items-center gap-2"
          )}
        >
          <User className="h-4 w-4" />
          {joinMessages.joinNow}
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
          {joinMessages.joinNow}
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
        <User className="h-4 w-4" />
        Login Unavailable
      </Button>
      <p className="text-sm text-red-500">
        Login is not configured
      </p>
    </div>
  )
} 