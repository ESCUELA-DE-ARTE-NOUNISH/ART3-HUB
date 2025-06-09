'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { defaultLocale } from '@/config/i18n'
import Link from 'next/link'
import { ArrowRight, Sparkles, Crown, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useToast } from '@/hooks/use-toast'
import { useAccount, useConnect } from 'wagmi'
import { usePrivy, useWallets } from '@privy-io/react-auth'
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
  
  // Get user wallet connection status - check both wagmi and Privy
  const { isConnected: wagmiConnected, address: wagmiAddress } = useAccount()
  const { connect, connectors } = useConnect()
  const { toast } = useToast()
  
  // Privy hooks (safe to call even without provider)
  const privyHooks = (() => {
    try {
      return usePrivy()
    } catch {
      return { authenticated: false, login: () => {} }
    }
  })()
  const { authenticated, login } = privyHooks

  const walletsHooks = (() => {
    try {
      return useWallets()
    } catch {
      return { wallets: [] }
    }
  })()
  const { wallets } = walletsHooks
  
  // Determine if user is actually connected based on environment
  const isActuallyConnected = (() => {
    const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID
    
    if (context) {
      // In MiniKit, use wagmi's connection state
      return wagmiConnected
    } else if (hasPrivy) {
      // In browser with Privy, check Privy authentication
      return authenticated && wallets.length > 0
    } else {
      // Fallback to wagmi
      return wagmiConnected
    }
  })()
  const [messages, setMessages] = useState({
    title: "ART3 HUB",
    subtitle: "Your bridge to Web3 creativity",
    common: {
      loading: "Loading...",
      error: "An error occurred",
      submit: "Submit",
      cancel: "Cancel",
      close: "Close"
    },
    aiAgent: {
      title: "Education Agent",
      description: "Learn about Web3, NFTs, and blockchain with our AI assistant.",
      button: "Ask Questions"
    },
    createNft: {
      title: "Create & Mint NFTs",
      description: "Upload your artwork and mint it as an NFT on the Base blockchain.",
      button: "Create NFT"
    },
    wallet: {
      title: "Manage Wallet",
      description: "Set up and manage your Web3 wallet for minting and transactions.",
      button: "Wallet"
    },
    myNfts: {
      title: "My NFTs",
      description: "View and manage your minted NFT collection.",
      button: "View Collection"
    },
    unlock: {
      title: "Unlock Your Creative Future in Web3",
      opportunities: "Check out opportunities for artists on Web3",
      description: "Discover how Web3 is revolutionizing the art world with new income streams, direct fan connections, and ownership of your creative work.",
      freedom: "Creative Freedom",
      freedomDesc: "Mint and sell your art without gatekeepers",
      royalties: "Royalties",
      royaltiesDesc: "Earn from secondary sales of your work",
      community: "Global Community",
      communityDesc: "Connect with collectors worldwide",
      explore: "Explore Web3 Opportunities"
    },
    footer: {
      created: "Created by Escuela de Arte Nourish",
      built: "Built with ❤️ from LATAM"
    },
    walletRequired: {
      title: "Please Join to Proceed",
      description: "You need to connect your wallet to create NFTs and access premium features.",
      connectButton: "Connect Wallet",
      createNftMessage: "Connect your wallet first to create NFTs",
      viewNftsMessage: "Connect your wallet first to view your NFTs",
      connectionFailed: "Connection Failed",
      connectionFailedDescription: "Failed to connect wallet. Please try again."
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
  const handleMyNftsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!isActuallyConnected) {
      // Show alert dialog that wallet connection is required
      setShowWalletAlert(true)
      return
    }
    
    // If connected, navigate to my-nfts page
    router.push(`/${locale}/my-nfts`)
  }

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

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <div className="flex items-center justify-center mt-2">
          <Image
            src="/images/logo.png"
            alt="Escuela de Arte Nounish Logo"
            width={120}
            height={120}
            className="rounded-full"
          />
        </div>
        <h1 className="text-4xl font-bold text-pink-500">
          {messages.title}
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          {messages.subtitle}
        </p>
      </header>

      <div className="w-full space-y-6">
        {/* AI Education Agent */}
        <div className="border border-lime-300 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-lime-500">{messages.aiAgent.title}</h2>
          <p className="mt-2 text-gray-600">{messages.aiAgent.description}</p>
          <Link href={`/${locale}/ai-agent`}>
            <Button className="mt-4 w-full bg-lime-500 hover:bg-lime-600 text-white">
              {messages.aiAgent.button}
            </Button>
          </Link>
        </div>

        {/* Create & Mint NFTs */}
        <div className="border border-pink-300 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-pink-500">{messages.createNft.title}</h2>
          <p className="mt-2 text-gray-600">{messages.createNft.description}</p>
          <Button 
            className="mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white"
            onClick={handleCreateNftClick}
          >
            {messages.createNft.button}
          </Button>
        </div>

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

        {/* My NFTs */}
        <div className="border border-lime-300 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-lime-500">{messages.myNfts.title}</h2>
          <p className="mt-2 text-gray-600">{messages.myNfts.description}</p>
          <Button 
            className="mt-4 w-full bg-lime-500 hover:bg-lime-600 text-white"
            onClick={handleMyNftsClick}
          >
            {messages.myNfts.button}
          </Button>
        </div>
      </div>

      {/* Unlock Your Creative Future */}
      <div className="mt-12 w-full text-center">
        <h2 className="text-2xl font-bold text-pink-500 mb-8">{messages.unlock.title}</h2>
        
        <div className="bg-pink-50 rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center justify-center mb-2">
            <Sparkles className="text-pink-500 mr-2" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">{messages.unlock.opportunities}</h3>
          <p className="text-gray-600">{messages.unlock.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex flex-col items-center">
              <Sparkles className="text-pink-500 mb-2" size={20} />
              <h4 className="font-medium">{messages.unlock.freedom}</h4>
              <p className="text-sm text-gray-500">{messages.unlock.freedomDesc}</p>
            </div>
            <div className="flex flex-col items-center">
              <Crown className="text-lime-500 mb-2" size={20} />
              <h4 className="font-medium">{messages.unlock.royalties}</h4>
              <p className="text-sm text-gray-500">{messages.unlock.royaltiesDesc}</p>
            </div>
            <div className="flex flex-col items-center">
              <Globe className="text-pink-500 mb-2" size={20} />
              <h4 className="font-medium">{messages.unlock.community}</h4>
              <p className="text-sm text-gray-500">{messages.unlock.communityDesc}</p>
            </div>
          </div>
          
          <Link href={`/${locale}/opportunities`}>
            <Button className="mt-6 bg-gradient-to-r from-pink-500 to-lime-500 hover:from-pink-600 hover:to-lime-600 text-white">
              {messages.unlock.explore} <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-4 mb-12 text-center text-sm text-gray-500">
        <p>{messages.footer.created}</p>
        <p>{messages.footer.built}</p>
      </footer>

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