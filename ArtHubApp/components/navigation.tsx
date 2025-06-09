"use client"

import Link from "next/link"
import { Home, Search, Grid3X3, User } from "lucide-react"
import { usePathname, useParams, useRouter } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import { useAccount, useConnect } from 'wagmi'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'
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

export default function Navigation() {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) || defaultLocale
  const [showWalletAlert, setShowWalletAlert] = useState(false)
  const { toast } = useToast()

  // Wallet connection hooks
  const { isConnected: wagmiConnected, address: wagmiAddress } = useAccount()
  const { connect, connectors } = useConnect()
  const { context } = useMiniKit()

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
  
  // Simple labels with no translation dependencies
  const labels = {
    home: locale === 'es' ? 'Inicio' : 
          locale === 'pt' ? 'Início' : 
          locale === 'fr' ? 'Accueil' : 'Home',
          
    explore: locale === 'es' ? 'Explorar' : 
             locale === 'pt' ? 'Explorar' : 
             locale === 'fr' ? 'Explorer' : 'Explore',
             
    profile: locale === 'es' ? 'Perfil' : 
             locale === 'pt' ? 'Perfil' : 
             locale === 'fr' ? 'Profil' : 'Profile',
             
    collection: locale === 'es' ? 'Colección' : 
                locale === 'pt' ? 'Coleção' : 
                locale === 'fr' ? 'Collection' : 'Collection'
  }

  // Wallet required messages
  const walletMessages = {
    title: locale === 'es' ? 'Por favor, Unete para Continuar' :
           locale === 'pt' ? 'Por favor, Faça Conectar para Continuar' :
           locale === 'fr' ? 'Veuillez vous Connecter pour Continuer' :
           'Please Join to Proceed',
    
    description: locale === 'es' ? 'Necesitas conectar tu billetera para acceder a tu perfil y colección.' :
                 locale === 'pt' ? 'Você precisa conectar sua carteira para acessar seu perfil e coleção.' :
                 locale === 'fr' ? 'Vous devez connecter votre portefeuille pour accéder à votre profil et collection.' :
                 'You need to connect your wallet to access your profile and collection.',
    
    connectButton: locale === 'es' ? 'Conectar Billetera' :
                   locale === 'pt' ? 'Conectar Carteira' :
                   locale === 'fr' ? 'Connecter le Portefeuille' :
                   'Connect Wallet',
    
    cancel: locale === 'es' ? 'Cancelar' :
            locale === 'pt' ? 'Cancelar' :
            locale === 'fr' ? 'Annuler' :
            'Cancel',
    
    connectionFailed: locale === 'es' ? 'Conexión Fallida' :
                      locale === 'pt' ? 'Falha na Conexão' :
                      locale === 'fr' ? 'Connexion Échouée' :
                      'Connection Failed',
    
    connectionFailedDescription: locale === 'es' ? 'No se pudo conectar la billetera. Por favor, intenta de nuevo.' :
                                 locale === 'pt' ? 'Falha ao conectar carteira. Por favor, tente novamente.' :
                                 locale === 'fr' ? 'Échec de la connexion du portefeuille. Veuillez réessayer.' :
                                 'Failed to connect wallet. Please try again.'
  }

  // Function to check if a path is active, accounting for locale prefixes
  const isActive = (path: string) => {
    // Remove locale prefix if present
    let pathWithoutLocale = pathname || '/'
    if (pathname && pathname.startsWith(`/${locale}/`)) {
      pathWithoutLocale = pathname.substring(locale.length + 1)
    } else if (pathname === `/${locale}`) {
      pathWithoutLocale = '/'
    }
    
    return pathWithoutLocale === path
  }

  // Function to prepend the current locale to links
  const getLocalizedPath = (path: string) => {
    if (path === '/') {
      return `/${locale}`
    }
    return `/${locale}${path}`
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
        title: walletMessages.connectionFailed,
        description: walletMessages.connectionFailedDescription,
        variant: "destructive",
      })
    }
  }

  // Handle navigation with wallet check
  const handleProtectedNavigation = (path: string) => {
    if (!isActuallyConnected) {
      setShowWalletAlert(true)
      return
    }
    router.push(getLocalizedPath(path))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="flex justify-around py-2">
        <Link href={getLocalizedPath("/")} className="flex flex-col items-center px-2 py-1">
          <Home className={`h-5 w-5 ${isActive("/") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span className={`text-xs mt-1 ${isActive("/") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}>
            {labels.home}
          </span>
        </Link>
        <Link href={getLocalizedPath("/explore")} className="flex flex-col items-center px-2 py-1">
          <Search className={`h-5 w-5 ${isActive("/explore") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span className={`text-xs mt-1 ${isActive("/explore") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}>
            {labels.explore}
          </span>
        </Link>
        <button 
          onClick={() => handleProtectedNavigation("/my-collection")} 
          className="flex flex-col items-center px-2 py-1"
        >
          <Grid3X3 className={`h-5 w-5 ${isActive("/my-collection") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span
            className={`text-xs mt-1 ${isActive("/my-collection") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}
          >
            {labels.collection}
          </span>
        </button>
        <button 
          onClick={() => handleProtectedNavigation("/profile")} 
          className="flex flex-col items-center px-2 py-1"
        >
          <User className={`h-5 w-5 ${isActive("/profile") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span className={`text-xs mt-1 ${isActive("/profile") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}>
            {labels.profile}
          </span>
        </button>
      </div>

      {/* Wallet Connection Required Alert Dialog */}
      <AlertDialog open={showWalletAlert} onOpenChange={setShowWalletAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-pink-500">
              {walletMessages.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {walletMessages.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{walletMessages.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-pink-500 hover:bg-pink-600"
              onClick={handleWalletConnect}
            >
              {walletMessages.connectButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
