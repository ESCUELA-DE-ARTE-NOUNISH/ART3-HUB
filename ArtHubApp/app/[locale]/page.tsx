'use client'

// Prevent static generation for pages using Web3 hooks
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { defaultLocale } from '@/config/i18n'
import Link from 'next/link'
import { ArrowRight, Sparkles, Crown, Globe, Camera, Upload, Send, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useToast } from '@/hooks/use-toast'
import { useAccount, useConnect } from 'wagmi'
import { useSafePrivy, useSafeWallets } from '@/hooks/useSafePrivy'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FarcasterReadySignal } from '@/components/farcaster-ready'
import { useSafeFarcaster } from "@/providers/FarcasterProvider";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";


export default function Home() {

  const { setFrameReady, isFrameReady, context, isFarcasterEnvironment } = useSafeFarcaster();

  const params = useParams()
  const router = useRouter()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [showWalletAlert, setShowWalletAlert] = useState(false)
  const [chatInput, setChatInput] = useState('')
  
  // Get user wallet connection status - check both wagmi and Privy
  const { isConnected: wagmiConnected, address: wagmiAddress } = useAccount()
  const { connect, connectors } = useConnect()
  const { toast } = useToast()
  
  // Safe Privy hooks that handle MiniKit mode
  const { authenticated, login } = useSafePrivy()
  const { wallets } = useSafeWallets()
  
  // Determine if user is actually connected based on environment
  // Use wagmi's isConnected as primary detection for all environments
  const isActuallyConnected = wagmiConnected
  const [messages, setMessages] = useState({
    title: "ART3 HUB",
    subtitle: "Your bridge to digital art creativity",
    common: {
      loading: "Loading...",
      error: "An error occurred",
      submit: "Submit",
      cancel: "Cancel",
      close: "Close"
    },
    aiAgent: {
      title: "Education Agent",
      description: "Learn about Art3 Hub, NFTs, and digital art with our helpful assistant.",
      button: "Ask Questions"
    },
    createNft: {
      title: "Create & Mint NFTs",
      description: "Upload your artwork and mint it as an NFT on the Base blockchain.",
      button: "Create"
    },
    wallet: {
      title: "Manage Account",
      description: "Set up and manage your account for creating and managing NFTs.",
      button: "Account"
    },
    myNfts: {
      title: "My NFTs",
      description: "View and manage your minted NFT collection.",
      button: "View Collection"
    },
    unlock: {
      title: "Unlock Your Creative Future",
      opportunities: "Check out opportunities for artists",
      description: "Discover how is revolutionizing the art world with new income streams, direct fan connections, and ownership of your creative work.",
      freedom: "Creative Freedom",
      freedomDesc: "Mint and sell your art without gatekeepers",
      royalties: "Royalties",
      royaltiesDesc: "Earn from secondary sales of your work",
      community: "Global Community",
      communityDesc: "Connect with collectors worldwide",
      explore: "Explore Opportunities",
      chatPlaceholder: "Ask to explore opportunities, create an NFT, or discover new paths for your art...",
      chatPlaceholderDisconnected: "Join Art3 Hub to discover opportunities for your art and unlock creative possibilities...",
      chatSubmitted: "Question submitted!",
      redirectingToAgent: "Redirecting to Art3 Hub assistant..."
    },
    footer: {
      created: "Created by Escuela de Arte Nounish",
      built: "Built with ❤️ from LATAM"
    },
    walletRequired: {
      title: "Please Join to Proceed",
      description: "You need to join Art3 Hub to create NFTs and access premium features.",
      connectButton: "Join Now",
      createNftMessage: "Join Art3 Hub first to create NFTs",
      viewNftsMessage: "Join Art3 Hub first to view your NFTs",
      connectionFailed: "Login Failed",
      connectionFailedDescription: "Failed to join. Please try again."
    }
  })

  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 HOME PAGE STATE UPDATE:', {
      showWalletAlert,
      isActuallyConnected,
      wagmiConnected,
      authenticated,
      context: !!context,
      isFarcasterEnvironment,
      walletsLength: wallets?.length || 0,
      connectorsCount: connectors.length
    })
  }, [showWalletAlert, isActuallyConnected, wagmiConnected, authenticated, context, isFarcasterEnvironment, wallets, connectors])

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
  }, [params?.locale]) // Only depend on the locale value, not the entire params object

  // Load messages when locale changes
  useEffect(() => {
    async function loadMessages() {
      try {
        const translations = await import(`@/messages/${locale}/index.json`)
        if (translations?.default) {
          // Merge default messages with translations to ensure we have fallbacks
          setMessages(prev => ({
            ...prev,
            ...(translations.default.home || {}),
            common: {
              ...prev.common,
              ...(translations.default.common || {})
            },
            aiAgent: {
              ...prev.aiAgent,
              ...(translations.default.home?.aiAgent || {})
            },
            createNft: {
              ...prev.createNft,
              ...(translations.default.home?.createNft || {})
            },
            wallet: {
              ...prev.wallet,
              ...(translations.default.home?.wallet || {})
            },
            myNfts: {
              ...prev.myNfts,
              ...(translations.default.home?.myNfts || {})
            },
            unlock: {
              ...prev.unlock,
              ...(translations.default.home?.unlock || {})
            },
            footer: {
              ...prev.footer,
              ...(translations.default.home?.footer || {})
            },
            walletRequired: {
              ...prev.walletRequired,
              ...(translations.default.home?.walletRequired || {})
            }
          }))
        }
      } catch (error) {
        console.error('Failed to load translations:', error)
      }
    }
    
    loadMessages()
  }, [locale])

  // The setFrameReady() function is called when your mini-app is ready to be shown
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Handle Create NFT button click with wallet connection check
  const handleCreateNftClick = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('🎯 CREATE NFT BUTTON CLICKED')
    console.log('📊 Connection Status:', {
      isActuallyConnected,
      wagmiConnected,
      authenticated,
      context: !!context,
      walletsLength: wallets?.length || 0
    })
    
    if (!isActuallyConnected) {
      // Show alert dialog that wallet connection is required
      console.log('🚨 USER NOT CONNECTED - SHOWING WALLET ALERT')
      setShowWalletAlert(true)
      return
    }
    
    // If connected, navigate to create page
    console.log('✅ USER CONNECTED - NAVIGATING TO CREATE PAGE')
    router.push(`/${locale}/create`)
  }

  // Handle My NFTs button click with wallet connection check
  // const handleMyNftsClick = (e: React.MouseEvent) => {
  //   e.preventDefault()
    
  //   if (!isActuallyConnected) {
  //     // Show alert dialog that wallet connection is required
  //     setShowWalletAlert(true)
  //     return
  //   }
    
  //   // If connected, navigate to my-nfts page
  //   router.push(`/${locale}/my-nfts`)
  // }

  // Handle wallet connection from the alert dialog
  const handleWalletConnect = async () => {
    console.log('🎯 WALLET CONNECT BUTTON CLICKED')
    console.log('📊 Environment State:', {
      context: !!context,
      hasPrivy: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
      connectorsCount: connectors.length,
      connectors: connectors.map(c => ({ id: c.id, name: c.name, type: c.type }))
    })
    
    try {
      const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID
      
      if (context) {
        // In MiniKit/Farcaster environment - prioritize Farcaster connector
        console.log('🔄 FARCASTER MODE: Attempting wallet connection in Farcaster environment')
        console.log('🔍 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name, type: c.type })))
        
        // Look for the Farcaster frame connector first
        const farcasterConnector = connectors.find(c => c.id === 'farcaster' || c.type === 'frameConnector')
        console.log('🔍 Farcaster connector found:', !!farcasterConnector, farcasterConnector?.name)
        
        if (farcasterConnector) {
          console.log('✅ USING FARCASTER CONNECTOR:', farcasterConnector.name)
          console.log('🔄 Calling connect() with Farcaster connector...')
          await connect({ connector: farcasterConnector })
          console.log('✅ Connect() call completed')
        } else if (connectors.length > 0) {
          // Fallback to first available connector
          console.log('⚠️ FALLBACK: Farcaster connector not found, using first available:', connectors[0].name)
          await connect({ connector: connectors[0] })
        } else {
          console.error('❌ NO CONNECTORS AVAILABLE in MiniKit environment')
          throw new Error('No connectors available in MiniKit environment')
        }
      } else if (hasPrivy) {
        // In browser with Privy - use Privy login
        console.log('🔄 BROWSER MODE: Using Privy login in browser environment')
        login()
      } else {
        // Fallback to wagmi connectors
        console.log('🔄 FALLBACK MODE: Using wagmi connectors as fallback')
        const injectedConnector = connectors.find(c => c.id === 'injected')
        const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')
        
        if (injectedConnector && window.ethereum) {
          await connect({ connector: injectedConnector })
        } else if (walletConnectConnector) {
          await connect({ connector: walletConnectConnector })
        } else {
          throw new Error('No suitable wallet connector found')
        }
      }
      
      // Close the dialog
      console.log('🔄 Closing wallet alert dialog...')
      setShowWalletAlert(false)
      console.log('✅ WALLET CONNECTION PROCESS COMPLETED')
      
    } catch (error) {
      console.error('❌ WALLET CONNECTION FAILED:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      })
      toast({
        title: messages.walletRequired.connectionFailed,
        description: messages.walletRequired.connectionFailedDescription,
        variant: "destructive",
      })
    }
  }

  // Handle chat submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !isActuallyConnected) return
    
    // Store the input value before clearing
    const queryText = chatInput.trim()
    
    // Clear the input immediately for better UX
    setChatInput('')
    
    // Show success feedback
    toast({
      title: messages.unlock.chatSubmitted,
      description: messages.unlock.redirectingToAgent,
      duration: 2000,
    })
    
    // Navigate to intelligent AI agent with the query
    router.push(`/${locale}/ai-agent/intelligent?q=${encodeURIComponent(queryText)}`)
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4 py-2">
      <header className="text-center mt-2">
        <div className="flex items-center justify-center my-1 md:my-2 lg:my-8">
          <Image
            src="/images/logo.png"
            alt="Escuela de Arte Nounish Logo"
            width={110}
            height={110}
            className="rounded-sm w-16 h-16 md:w-32 md:h-32 lg:w-40 lg:h-40"
          />
        </div>
      </header>

      {/* Hero Section */}
      <div className="w-full mb-8">
        <div className="bg-gradient-to-br from-pink-50 via-white to-lime-50 rounded-2xl p-6 shadow-lg border border-pink-100">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Title */}
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="text-pink-500 mr-2" size={28} />
              <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-500 to-lime-500 bg-clip-text text-transparent">
                {messages.unlock.title}
              </h2>
            </div>
            
            {/* Description */}
            <p className="text-base lg:text-lg text-gray-700 leading-relaxed max-w-2xl hidden md:block">
              {messages.unlock.description}
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3">
              <div className="flex items-center bg-white rounded-full px-3 py-2 shadow-sm border border-pink-100">
                <Sparkles className="text-pink-500 mr-2" size={16} />
                <span className="text-xs lg:text-sm font-medium text-gray-700">{messages.unlock.freedom}</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-3 py-2 shadow-sm border border-lime-100">
                <Crown className="text-lime-500 mr-2" size={16} />
                <span className="text-xs lg:text-sm font-medium text-gray-700">{messages.unlock.royalties}</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-3 py-2 shadow-sm border border-pink-100">
                <Globe className="text-pink-500 mr-2" size={16} />
                <span className="text-xs lg:text-sm font-medium text-gray-700">{messages.unlock.community}</span>
              </div>
            </div>
            
            {/* Chat Interface */}
            <div className="w-full max-w-2xl">
              <form onSubmit={handleChatSubmit} className="relative">
                <Textarea
                  placeholder={isActuallyConnected ? messages.unlock.chatPlaceholder : messages.unlock.chatPlaceholderDisconnected}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full min-h-[120px] px-4 py-3 pr-14 rounded-2xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all duration-200 resize-none text-base leading-relaxed"
                  disabled={!isActuallyConnected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (isActuallyConnected) {
                        handleChatSubmit(e)
                      }
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={!chatInput.trim() || !isActuallyConnected}
                  className="absolute bottom-3 right-3 bg-gradient-to-r from-pink-500 to-lime-500 hover:from-pink-600 hover:to-lime-600 text-white w-10 h-10 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* Opportunities Section - Only show when authenticated */}
      {isActuallyConnected && (
        <div className="w-full mt-8">
          <div className="bg-gradient-to-br from-green-50 via-white to-lime-50 rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Title */}
              <div className="flex items-center justify-center mb-2">
                <Briefcase className="text-green-500 mr-2" size={28} />
                <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-500 to-lime-500 bg-clip-text text-transparent">
                  {messages.unlock.opportunities}
                </h3>
              </div>
              
              {/* Description */}
              <p className="text-sm lg:text-base text-gray-700 leading-relaxed max-w-lg">
                Discover art contests, collaborations, communities, and earning opportunities specially curated for artists like you.
              </p>
              
              {/* CTA Button */}
              <Link href={`/${locale}/opportunities`}>
                <Button className="bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                  {messages.unlock.explore}
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}


      {/* Footer */}
      <footer className="mt-4 mb-24 text-center text-sm text-gray-500">
        <p>{messages.footer.created}</p>
        <p>{messages.footer.built}</p>
      </footer>

      {/* Floating Create NFT Button - Only show when wallet is connected */}
      {isActuallyConnected && (
        <div className="fixed bottom-[92px] right-2 z-50">
          <Button
            onClick={handleCreateNftClick}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-lime-500 hover:from-pink-600 hover:to-lime-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 flex flex-col items-center justify-center gap-1 group"
            aria-label="Create NFT"
          >
            <Camera size={24} className="group-hover:scale-90 transition-transform duration-200" />
            <span className="font-semibold text-xs">
            {messages.createNft.button}
            </span>
          </Button>
        </div>
      )}

      {/* Wallet Connection Required Alert Dialog */}
      <AlertDialog 
        open={showWalletAlert} 
        onOpenChange={(open) => {
          console.log('🔄 Alert Dialog onOpenChange:', open)
          setShowWalletAlert(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-pink-500">
              {messages.walletRequired.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {messages.walletRequired.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                console.log('🚫 CANCEL BUTTON CLICKED')
                setShowWalletAlert(false)
              }}
            >
              {messages.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-pink-500 hover:bg-pink-600"
              onClick={(e) => {
                console.log('🎯 JOIN NOW BUTTON CLICKED IN DIALOG')
                e.preventDefault()
                handleWalletConnect()
              }}
            >
              {messages.walletRequired.connectButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Farcaster Ready Signal for proper SDK initialization */}
      <FarcasterReadySignal />
    </div>
  )
} 