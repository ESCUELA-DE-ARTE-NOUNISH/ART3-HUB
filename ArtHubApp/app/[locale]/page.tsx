'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { defaultLocale } from '@/config/i18n'
import Link from 'next/link'
import { ArrowRight, Sparkles, Crown, Globe, Camera, Upload, Send } from 'lucide-react'
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

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
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

  const { setFrameReady, isFrameReady, context } = useMiniKit();

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
  const isActuallyConnected = (() => {
    const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID
    
    if (context) {
      // In MiniKit, use wagmi's connection state
      return wagmiConnected
    } else if (hasPrivy) {
      // In browser with Privy, check Privy authentication
      return authenticated
    } else {
      // Fallback to wagmi
      return wagmiConnected
    }
  })()
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

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
  }, [params])

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
    
    if (!isActuallyConnected) {
      // Show alert dialog that wallet connection is required
      setShowWalletAlert(true)
      return
    }
    
    // If connected, navigate to create page
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
    try {
      const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID
      
      if (context) {
        // In MiniKit/Farcaster environment - use wagmi connectors
        if (connectors.length > 0) {
          connect({ connector: connectors[0] })
        } else {
          throw new Error('No connectors available in MiniKit')
        }
      } else if (hasPrivy) {
        // In browser with Privy - use Privy login
        login()
      } else {
        // Fallback to wagmi connectors
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
      
      // Close the dialog
      setShowWalletAlert(false)
      
    } catch (error) {
      console.error('Failed to connect wallet:', error)
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
    if (!chatInput.trim()) return
    
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
    
    // Navigate to AI agent with the query
    router.push(`/${locale}/ai-agent?q=${encodeURIComponent(queryText)}`)
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
                  placeholder={messages.unlock.chatPlaceholder}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full min-h-[120px] px-4 py-3 pr-14 rounded-2xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all duration-200 resize-none text-base leading-relaxed"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleChatSubmit(e)
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="absolute bottom-3 right-3 bg-gradient-to-r from-pink-500 to-lime-500 hover:from-pink-600 hover:to-lime-600 text-white w-10 h-10 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>

          </div>
        </div>
      </div>

      <div className="w-full space-y-6">

        {/* Manage Wallet */}
        {/* <div className="border border-pink-300 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-pink-500">{messages.wallet.title}</h2>
          <p className="mt-2 text-gray-600">{messages.wallet.description}</p>
          <Link href={`/${locale}/wallet`}>
            <Button className="mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white">
              {messages.wallet.button}
            </Button>
          </Link>
        </div> */}
        
      </div>


      {/* Footer */}
      <footer className="mt-4 mb-24 text-center text-sm text-gray-500">
        <p>{messages.footer.created}</p>
        <p>{messages.footer.built}</p>
      </footer>

      {/* Floating Create NFT Button - Only show when wallet is connected */}
      {isActuallyConnected && (
        <div className="fixed bottom-[72px] right-2 z-50">
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
      <AlertDialog open={showWalletAlert} onOpenChange={setShowWalletAlert}>
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
            <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-pink-500 hover:bg-pink-600"
              onClick={handleWalletConnect}
            >
              {messages.walletRequired.connectButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 