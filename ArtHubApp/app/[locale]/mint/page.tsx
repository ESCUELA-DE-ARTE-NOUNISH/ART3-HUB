"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, QrCode, Key, Gift, CheckCircle, AlertCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"

// Helper functions for blockchain URLs
function getExplorerUrl(network: string, hash: string, type: 'tx' | 'address' = 'tx'): string {
  const explorers: Record<string, string> = {
    'base': 'https://basescan.org',
    'baseSepolia': 'https://sepolia.basescan.org',
    'zora': 'https://explorer.zora.energy',
    'zoraTestnet': 'https://testnet.explorer.zora.energy',
    'celo': 'https://explorer.celo.org',
    'ethereum': 'https://etherscan.io'
  }
  
  const baseUrl = explorers[network] || explorers.base
  return `${baseUrl}/${type}/${hash}`
}

function getOpenSeaUrl(network: string, contractAddress: string, tokenId: number): string {
  const baseUrl = 'https://opensea.io/assets'
  
  // Map network to OpenSea chain name
  const networkMap: Record<string, string> = {
    'base': 'base',
    'baseSepolia': 'base-sepolia',
    'zora': 'zora',
    'zoraTestnet': 'zora-testnet',
    'celo': 'celo',
    'ethereum': 'ethereum'
  }
  
  const chainName = networkMap[network] || 'base'
  return `${baseUrl}/${chainName}/${contractAddress}/${tokenId}`
}

interface MintTranslations {
  title: string
  description: string
  secretCodeLabel: string
  secretCodePlaceholder: string
  qrCodeButton: string
  mintButton: string
  minting: string
  walletRequired: string
  walletRequiredDesc: string
  codeRequired: string
  codeRequiredDesc: string
  mintSuccess: string
  mintSuccessDesc: string
  viewOnOpenSea: string
  viewTransaction: string
  mintError: string
  mintErrorDesc: string
  invalidCode: string
  invalidCodeDesc: string
  alreadyMinted: string
  alreadyMintedDesc: string
  howItWorks: string
  step1: string
  step2: string
  step3: string
  examples: string
  exampleCodes: string[]
}

const translations: Record<string, MintTranslations> = {
  en: {
    title: "Mint NFT",
    description: "Enter your secret code or scan a QR code to mint your exclusive NFT.",
    secretCodeLabel: "Secret Code",
    secretCodePlaceholder: "Enter your secret code or event code",
    qrCodeButton: "Scan QR Code",
    mintButton: "Mint NFT",
    minting: "Minting...",
    walletRequired: "Wallet Required",
    walletRequiredDesc: "Please connect your wallet to mint NFTs.",
    codeRequired: "Code Required",
    codeRequiredDesc: "Please enter a valid secret code to mint your NFT.",
    mintSuccess: "NFT Minted Successfully!",
    mintSuccessDesc: "Your exclusive NFT has been minted to your wallet.",
    viewOnOpenSea: "View on OpenSea",
    viewTransaction: "View Transaction",
    mintError: "Minting Failed",
    mintErrorDesc: "Failed to mint NFT. Please try again.",
    invalidCode: "Invalid Code",
    invalidCodeDesc: "The secret code you entered is not valid or has expired.",
    alreadyMinted: "Already Minted",
    alreadyMintedDesc: "You have already claimed with this code.",
    howItWorks: "How it works",
    step1: "Get a secret code from an event, promotion, or partner",
    step2: "Enter the code or scan the QR code",
    step3: "Mint your exclusive NFT directly to your wallet",
    examples: "Example codes for testing",
    exampleCodes: ["WELCOME2024", "ARTFEST2024", "BETA_USER", "EARLY_ADOPTER"]
  },
  es: {
    title: "Acuñar NFT",
    description: "Ingresa tu código secreto o escanea un código QR para acuñar tu NFT exclusivo.",
    secretCodeLabel: "Código Secreto",
    secretCodePlaceholder: "Ingresa tu código secreto o código de evento",
    qrCodeButton: "Escanear Código QR",
    mintButton: "Acuñar NFT",
    minting: "Acuñando...",
    walletRequired: "Billetera Requerida",
    walletRequiredDesc: "Por favor conecta tu billetera para acuñar NFTs.",
    codeRequired: "Código Requerido",
    codeRequiredDesc: "Por favor ingresa un código secreto válido para acuñar tu NFT.",
    mintSuccess: "¡NFT Acuñado Exitosamente!",
    mintSuccessDesc: "Tu NFT exclusivo ha sido acuñado a tu billetera.",
    viewOnOpenSea: "Ver en OpenSea",
    viewTransaction: "Ver Transacción",
    mintError: "Fallo en Acuñación",
    mintErrorDesc: "No se pudo acuñar el NFT. Por favor intenta de nuevo.",
    invalidCode: "Código Inválido",
    invalidCodeDesc: "El código secreto que ingresaste no es válido o ha expirado.",
    alreadyMinted: "Ya Acuñado",
    alreadyMintedDesc: "Ya has acuñado un NFT con este código.",
    howItWorks: "Cómo funciona",
    step1: "Obtén un código secreto de un evento, promoción o socio",
    step2: "Ingresa el código o escanea el código QR",
    step3: "Acuña tu NFT exclusivo directamente a tu billetera",
    examples: "Códigos de ejemplo para pruebas",
    exampleCodes: ["BIENVENIDO2024", "ARTFEST2024", "USUARIO_BETA", "ADOPTANTE_TEMPRANO"]
  },
  pt: {
    title: "Cunhar NFT",
    description: "Digite seu código secreto ou escaneie um código QR para cunhar seu NFT exclusivo.",
    secretCodeLabel: "Código Secreto",
    secretCodePlaceholder: "Digite seu código secreto ou código do evento",
    qrCodeButton: "Escanear Código QR",
    mintButton: "Cunhar NFT",
    minting: "Cunhando...",
    walletRequired: "Carteira Necessária",
    walletRequiredDesc: "Por favor conecte sua carteira para cunhar NFTs.",
    codeRequired: "Código Necessário",
    codeRequiredDesc: "Por favor digite um código secreto válido para cunhar seu NFT.",
    mintSuccess: "NFT Cunhado com Sucesso!",
    mintSuccessDesc: "Seu NFT exclusivo foi cunhado para sua carteira.",
    viewOnOpenSea: "Ver no OpenSea",
    viewTransaction: "Ver Transação",
    mintError: "Falha na Cunhagem",
    mintErrorDesc: "Falha ao cunhar NFT. Por favor tente novamente.",
    invalidCode: "Código Inválido",
    invalidCodeDesc: "O código secreto que você digitou não é válido ou expirou.",
    alreadyMinted: "Já Cunhado",
    alreadyMintedDesc: "Você já cunhou um NFT com este código.",
    howItWorks: "Como funciona",
    step1: "Obtenha um código secreto de um evento, promoção ou parceiro",
    step2: "Digite o código ou escaneie o código QR",
    step3: "Cunhe seu NFT exclusivo diretamente para sua carteira",
    examples: "Códigos de exemplo para testes",
    exampleCodes: ["BEMVINDO2024", "ARTFEST2024", "USUARIO_BETA", "ADOTANTE_PRECOCE"]
  },
  fr: {
    title: "Frapper NFT",
    description: "Entrez votre code secret ou scannez un code QR pour frapper votre NFT exclusif.",
    secretCodeLabel: "Code Secret",
    secretCodePlaceholder: "Entrez votre code secret ou code d'événement",
    qrCodeButton: "Scanner le Code QR",
    mintButton: "Frapper NFT",
    minting: "Frappe en cours...",
    walletRequired: "Portefeuille Requis",
    walletRequiredDesc: "Veuillez connecter votre portefeuille pour frapper des NFTs.",
    codeRequired: "Code Requis",
    codeRequiredDesc: "Veuillez entrer un code secret valide pour frapper votre NFT.",
    mintSuccess: "NFT Frappé avec Succès!",
    mintSuccessDesc: "Votre NFT exclusif a été frappé dans votre portefeuille.",
    viewOnOpenSea: "Voir sur OpenSea",
    viewTransaction: "Voir la Transaction",
    mintError: "Échec de la Frappe",
    mintErrorDesc: "Échec de la frappe du NFT. Veuillez réessayer.",
    invalidCode: "Code Invalide",
    invalidCodeDesc: "Le code secret que vous avez entré n'est pas valide ou a expiré.",
    alreadyMinted: "Déjà Frappé",
    alreadyMintedDesc: "Vous avez déjà frappé un NFT avec ce code.",
    howItWorks: "Comment ça marche",
    step1: "Obtenez un code secret d'un événement, promotion ou partenaire",
    step2: "Entrez le code ou scannez le code QR",
    step3: "Frappez votre NFT exclusif directement dans votre portefeuille",
    examples: "Codes d'exemple pour les tests",
    exampleCodes: ["BIENVENUE2024", "ARTFEST2024", "UTILISATEUR_BETA", "ADOPTEUR_PRECOCE"]
  }
}

interface NFTPreview {
  id: string
  title: string
  description: string
  imageUrl?: string
}

interface MintResult {
  success: boolean
  message: string
  txHash?: string
  tokenId?: number
  contractAddress?: string
  network?: string
  nft?: NFTPreview
  claimCode?: string
}

export default function MintPage() {
  const params = useParams()
  const locale = (params?.locale as string) || defaultLocale
  const t = translations[locale] || translations.en
  
  const [secretCode, setSecretCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [mintStatus, setMintStatus] = useState<"idle" | "success" | "error" | "invalid" | "already_minted">("idle")
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [verifiedNFT, setVerifiedNFT] = useState<NFTPreview | null>(null)
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  
  const { address, isConnected } = useAccount()
  const { toast } = useToast()

  // Handle secret code input
  const handleSecretCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value
    console.log("Code changed:", newCode, "Button should be enabled:", !!newCode.trim())
    setSecretCode(newCode) // Keep original case for display
    setMintStatus("idle") // Reset status when user types
    setVerifiedNFT(null) // Clear verified NFT
  }

  // Handle QR code scanning (placeholder for now)
  const handleQrScan = () => {
    toast({
      title: "QR Scanner",
      description: "QR code scanning functionality coming soon!",
    })
    setShowQrScanner(!showQrScanner)
  }

  // Verify claim code
  const verifyClaimCode = async () => {
    console.log("verifyClaimCode called with code:", secretCode)
    
    if (!secretCode.trim()) {
      toast({
        title: t.codeRequired,
        description: t.codeRequiredDesc,
        variant: "destructive",
      })
      return false
    }

    setIsVerifying(true)
    try {
      // Send the code as-is - case-insensitivity is handled on the server
      const response = await fetch(`/api/claim-code/verify?code=${encodeURIComponent(secretCode)}`)
      const result = await response.json()

      if (result.valid) {
        // If the code is valid but user needs to connect wallet
        if (result.needsWallet) {
          toast({
            title: t.walletRequired,
            description: t.walletRequiredDesc,
            variant: "destructive",
          })
          
          // Still show the NFT preview if available
          if (result.nft) {
            setVerifiedNFT(result.nft)
          }
          
          return false
        }
        
        // Code is valid and wallet is connected
        if (result.nft) {
          setVerifiedNFT(result.nft)
          return true
        }
      } else {
        setMintStatus("invalid")
        toast({
          title: t.invalidCode,
          description: result.message || t.invalidCodeDesc,
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Error verifying claim code:", error)
      toast({
        title: t.invalidCode,
        description: t.invalidCodeDesc,
        variant: "destructive",
      })
      return false
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle NFT minting
  const handleMint = async () => {
    if (!isConnected || !address) {
      toast({
        title: t.walletRequired,
        description: t.walletRequiredDesc,
        variant: "destructive",
      })
      return
    }

    // Verify the code first if not already verified
    if (!verifiedNFT) {
      const isValid = await verifyClaimCode()
      if (!isValid) return
    }

    setIsLoading(true)
    setMintStatus("idle")

    try {
      console.log("Starting NFT minting process...")
      
      // First, get the contract address from our API
      const verifyResponse = await fetch(`/api/claim-code/verify?code=${encodeURIComponent(secretCode)}`)
      const verifyResult = await verifyResponse.json()
      
      console.log("Verification result:", verifyResult)
      
      if (!verifyResult.valid || !verifyResult.nft) {
        throw new Error(verifyResult.message || 'Invalid claim code')
      }
      
      // Import the blockchain service dynamically to avoid SSR issues
      const { BlockchainService } = await import('@/lib/services/blockchain-service')
      
      // For claimable NFTs, we need a specific contract address
      const contractAddress = verifyResult.nft.contractAddress
      const network = verifyResult.nft.network || 'baseSepolia'
      
      console.log("Using contract address:", contractAddress)
      console.log("Using network:", network)
      
      // For mock testing, we'll simulate the transaction instead of calling the blockchain
      // In production, this would call the actual smart contract
      let txResult
      
      if (!contractAddress || contractAddress.startsWith('0x1234567890') || contractAddress.length !== 42) {
        // Simulate a successful mint for testing
        console.log("Simulating mint for testing...")
        txResult = {
          success: true,
          txHash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          tokenId: Math.floor(Math.random() * 10000),
          contractAddress: contractAddress || `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          claimCode: secretCode,
          network
        }
      } else {
        // Use real blockchain minting for deployed contracts
        txResult = await BlockchainService.mintClaimableNFT(
          contractAddress,
          secretCode,
          verifyResult.nft,
          network
        )
      }
      
      console.log("Transaction result:", txResult)
      
      // After successful on-chain minting, record the claim in our database
      const response = await fetch('/api/nfts/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimCode: secretCode, // Send the code as-is - case-insensitivity is handled on the server
          contractAddress: txResult.contractAddress || verifiedNFT?.id || '',
          txHash: txResult.txHash,
          tokenId: txResult.tokenId
        })
      })
      
      const result = await response.json()
      console.log("Claim API result:", result)
      
      // Combine the results
      const mintResult = {
        ...result,
        txHash: txResult.txHash,
        tokenId: txResult.tokenId,
        contractAddress: txResult.contractAddress || contractAddress,
        claimCode: secretCode,
        network
      }
      
      setMintStatus("success")
      setMintResult(mintResult)
      toast({
        title: t.mintSuccess,
        description: `${t.mintSuccessDesc} Claim code: ${secretCode}`,
      })
      
      // Keep the NFT data for display but clear the form input
      setSecretCode("")
    } catch (error) {
      console.error("Error minting NFT:", error)
      setMintStatus("error")
      
      // Extract the error message
      let errorMessage = t.mintErrorDesc
      
      if (error instanceof Error) {
        // Check for chain mismatch errors
        if (error.message.includes('chain') && error.message.includes('switch')) {
          errorMessage = error.message
        } else if (error.message.includes('rejected')) {
          errorMessage = 'Transaction was rejected. Please try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: t.mintError,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎁</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t.title}
            </h1>
            <p className="text-lg text-gray-600">
              {t.description}
            </p>
          </div>

          {/* Main Mint Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription>
                {t.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Secret Code Input */}
              <div className="space-y-2">
                <Label htmlFor="secretCode">{t.secretCodeLabel}</Label>
                <Input
                  id="secretCode"
                  type="text"
                  placeholder={t.secretCodePlaceholder}
                  value={secretCode}
                  onChange={handleSecretCodeChange}
                  className="text-center font-mono text-lg"
                  disabled={isLoading || isVerifying}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Claim codes are case-insensitive
                </p>
              </div>

              {/* Verify Button (shown when no NFT is verified) */}
              {!verifiedNFT && (
                <Button
                  onClick={verifyClaimCode}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isVerifying || isLoading || !secretCode.trim()}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                    </>
                  )}
                </Button>
              )}

              {/* NFT Preview (shown when NFT is verified) */}
              {verifiedNFT && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="text-sm font-medium mb-2">You're about to claim:</div>
                  <div className="flex gap-4 items-center">
                    {verifiedNFT.imageUrl && (
                      <img 
                        src={verifiedNFT.imageUrl} 
                        alt={verifiedNFT.title} 
                        className="h-20 w-20 rounded-md object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{verifiedNFT.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {verifiedNFT.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Scanner Button */}
              <Button
                variant="outline"
                onClick={handleQrScan}
                className="w-full"
                disabled={isLoading || isVerifying}
              >
                <QrCode className="h-4 w-4 mr-2" />
                {t.qrCodeButton}
              </Button>

              {/* Mint Button (shown when NFT is verified) */}
              {verifiedNFT && (
                <Button
                  onClick={handleMint}
                  className="w-full bg-pink-500 hover:bg-pink-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.minting}
                    </>
                  ) : !isConnected ? (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      {t.walletRequired}
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      {t.mintButton}
                    </>
                  )}
                </Button>
              )}

              {/* Status Messages */}
              {mintStatus === "success" && mintResult && (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      {t.mintSuccessDesc}
                    </AlertDescription>
                  </Alert>
                  
                  {/* NFT Details */}
                  {mintResult.nft && (
                    <div className="border rounded-lg p-4 bg-green-50">
                      <div className="flex gap-4 items-center mb-4">
                        {mintResult.nft.imageUrl && (
                          <img 
                            src={mintResult.nft.imageUrl} 
                            alt={mintResult.nft.title} 
                            className="h-20 w-20 rounded-md object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{mintResult.nft.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {mintResult.nft.description}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Claimed with code: {mintResult.claimCode}
                          </p>
                        </div>
                      </div>
                      
                      {/* Transaction Links */}
                      <div className="flex flex-col gap-2 mt-4">
                        {mintResult.txHash && (
                          <a 
                            href={getExplorerUrl(mintResult.network || 'base', mintResult.txHash, 'tx')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {t.viewTransaction}
                          </a>
                        )}
                        
                        {mintResult.contractAddress && mintResult.tokenId !== undefined && (
                          <a 
                            href={getOpenSeaUrl(mintResult.network || 'base', mintResult.contractAddress, mintResult.tokenId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 90 90" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M45 0C20.151 0 0 20.151 0 45C0 69.849 20.151 90 45 90C69.849 90 90 69.849 90 45C90 20.151 69.858 0 45 0ZM22.203 46.512L22.392 46.206L34.101 27.891C34.272 27.63 34.677 27.657 34.803 27.945C36.756 32.328 38.448 37.782 37.656 41.175C37.323 42.57 36.396 44.46 35.352 46.206C35.217 46.458 35.073 46.71 34.911 46.953C34.839 47.061 34.713 47.124 34.578 47.124H22.545C22.221 47.124 22.032 46.773 22.203 46.512ZM74.376 52.812C74.376 52.983 74.277 53.127 74.133 53.19C73.224 53.577 70.119 55.008 68.832 56.799C65.538 61.38 63.027 67.932 57.402 67.932H33.948C25.632 67.932 18.9 61.173 18.9 52.83V52.56C18.9 52.344 19.08 52.164 19.305 52.164H32.373C32.634 52.164 32.823 52.398 32.805 52.659C32.706 53.505 32.868 54.378 33.273 55.17C34.047 56.745 35.658 57.726 37.395 57.726H43.866V52.677H37.467C37.143 52.677 36.945 52.299 37.134 52.029C37.206 51.921 37.278 51.813 37.368 51.687C37.971 50.823 38.835 49.491 39.699 47.97C40.284 46.944 40.851 45.846 41.31 44.748C41.4 44.55 41.472 44.343 41.553 44.145C41.679 43.794 41.805 43.461 41.895 43.137C41.985 42.858 42.066 42.57 42.138 42.3C42.354 41.364 42.444 40.374 42.444 39.348C42.444 38.943 42.426 38.52 42.39 38.124C42.372 37.683 42.318 37.242 42.264 36.801C42.228 36.414 42.156 36.027 42.084 35.631C41.985 35.046 41.859 34.461 41.715 33.876L41.661 33.651C41.553 33.246 41.454 32.868 41.328 32.463C40.959 31.203 40.545 29.97 40.095 28.818C39.933 28.359 39.753 27.918 39.564 27.486C39.294 26.82 39.015 26.217 38.763 25.65C38.628 25.389 38.52 25.155 38.412 24.912C38.286 24.642 38.16 24.372 38.025 24.111C37.935 23.913 37.827 23.724 37.755 23.544L36.963 22.086C36.855 21.888 37.035 21.645 37.251 21.708L42.201 23.049H42.219C42.228 23.049 42.228 23.049 42.237 23.049L42.885 23.238L43.605 23.436L43.866 23.508V20.574C43.866 19.152 45 18 46.413 18C47.115 18 47.754 18.288 48.204 18.756C48.663 19.224 48.951 19.863 48.951 20.574V24.939L49.482 25.083C49.518 25.101 49.563 25.119 49.599 25.146C49.725 25.236 49.914 25.38 50.148 25.56C50.337 25.704 50.535 25.884 50.769 26.073C51.246 26.46 51.822 26.955 52.443 27.522C52.605 27.666 52.767 27.81 52.92 27.963C53.721 28.71 54.621 29.583 55.485 30.555C55.728 30.834 55.962 31.104 56.205 31.401C56.439 31.698 56.7 31.986 56.916 32.274C57.213 32.661 57.519 33.066 57.798 33.489C57.924 33.687 58.077 33.894 58.194 34.092C58.554 34.623 58.86 35.172 59.157 35.721C59.283 35.973 59.409 36.252 59.517 36.522C59.85 37.26 60.111 38.007 60.273 38.763C60.327 38.925 60.363 39.096 60.381 39.258V39.294C60.435 39.51 60.453 39.744 60.471 39.987C60.543 40.752 60.507 41.526 60.345 42.3C60.273 42.624 60.183 42.93 60.075 43.263C59.958 43.578 59.85 43.902 59.706 44.217C59.427 44.856 59.103 45.504 58.716 46.098C58.59 46.323 58.437 46.557 58.293 46.782C58.131 47.016 57.96 47.241 57.816 47.457C57.609 47.736 57.393 48.024 57.168 48.285C56.97 48.555 56.772 48.825 56.547 49.068C56.241 49.437 55.944 49.779 55.629 50.112C55.449 50.328 55.251 50.553 55.044 50.751C54.846 50.976 54.639 51.174 54.459 51.354C54.144 51.669 53.892 51.903 53.676 52.11L53.163 52.569C53.091 52.632 52.992 52.668 52.893 52.668H48.951V57.726H53.91C55.017 57.726 56.07 57.339 56.925 56.61C57.213 56.358 58.482 55.26 59.985 53.604C60.039 53.541 60.102 53.505 60.174 53.487L73.863 49.527C74.124 49.455 74.376 49.644 74.376 49.914V52.812V52.812Z"/>
                            </svg>
                            {t.viewOnOpenSea}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mintStatus === "error" && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {t.mintErrorDesc}
                  </AlertDescription>
                </Alert>
              )}

              {mintStatus === "invalid" && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {t.invalidCodeDesc}
                  </AlertDescription>
                </Alert>
              )}

              {mintStatus === "already_minted" && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    {t.alreadyMintedDesc}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>{t.howItWorks}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 space-y-2">
                <li>{t.step1}</li>
                <li>{t.step2}</li>
                <li>{t.step3}</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}