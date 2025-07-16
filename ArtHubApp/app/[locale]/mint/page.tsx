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
    mintError: "Minting Failed",
    mintErrorDesc: "Failed to mint NFT. Please try again.",
    invalidCode: "Invalid Code",
    invalidCodeDesc: "The secret code you entered is not valid or has expired.",
    alreadyMinted: "Already Minted",
    alreadyMintedDesc: "You have already minted an NFT with this code.",
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

export default function MintPage() {
  const params = useParams()
  const locale = (params?.locale as string) || defaultLocale
  const t = translations[locale] || translations.en
  
  const [secretCode, setSecretCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mintStatus, setMintStatus] = useState<"idle" | "success" | "error" | "invalid" | "already_minted">("idle")
  const [showQrScanner, setShowQrScanner] = useState(false)
  
  const { address, isConnected } = useAccount()
  const { toast } = useToast()

  // Handle secret code input
  const handleSecretCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecretCode(e.target.value.toUpperCase())
    setMintStatus("idle") // Reset status when user types
  }

  // Handle QR code scanning (placeholder for now)
  const handleQrScan = () => {
    toast({
      title: "QR Scanner",
      description: "QR code scanning functionality coming soon!",
    })
    setShowQrScanner(!showQrScanner)
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

    if (!secretCode.trim()) {
      toast({
        title: t.codeRequired,
        description: t.codeRequiredDesc,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setMintStatus("idle")

    try {
      // Simulate API call to validate code and mint NFT
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock validation logic (replace with actual API call)
      const validCodes = [
        "WELCOME2024", "ARTFEST2024", "BETA_USER", "EARLY_ADOPTER",
        "BIENVENIDO2024", "USUARIO_BETA", "ADOPTANTE_TEMPRANO",
        "BEMVINDO2024", "USUARIO_BETA", "ADOTANTE_PRECOCE",
        "BIENVENUE2024", "UTILISATEUR_BETA", "ADOPTEUR_PRECOCE"
      ]
      
      if (!validCodes.includes(secretCode)) {
        setMintStatus("invalid")
        toast({
          title: t.invalidCode,
          description: t.invalidCodeDesc,
          variant: "destructive",
        })
        return
      }

      // Mock check for already minted (replace with actual check)
      const alreadyMintedCodes = localStorage.getItem(`minted_codes_${address}`)
      const mintedArray = alreadyMintedCodes ? JSON.parse(alreadyMintedCodes) : []
      
      if (mintedArray.includes(secretCode)) {
        setMintStatus("already_minted")
        toast({
          title: t.alreadyMinted,
          description: t.alreadyMintedDesc,
          variant: "destructive",
        })
        return
      }

      // Mark as minted
      mintedArray.push(secretCode)
      localStorage.setItem(`minted_codes_${address}`, JSON.stringify(mintedArray))
      
      setMintStatus("success")
      toast({
        title: t.mintSuccess,
        description: t.mintSuccessDesc,
      })
      
      // Clear the form
      setSecretCode("")
      
    } catch (error) {
      setMintStatus("error")
      toast({
        title: t.mintError,
        description: t.mintErrorDesc,
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
                  disabled={isLoading}
                />
              </div>

              {/* QR Code Scanner Button */}
              <Button
                variant="outline"
                onClick={handleQrScan}
                className="w-full"
                disabled={isLoading}
              >
                <QrCode className="h-4 w-4 mr-2" />
                {t.qrCodeButton}
              </Button>

              {/* Mint Button */}
              <Button
                onClick={handleMint}
                className="w-full bg-pink-500 hover:bg-pink-600"
                disabled={isLoading || !isConnected}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.minting}
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    {t.mintButton}
                  </>
                )}
              </Button>

              {/* Status Messages */}
              {mintStatus === "success" && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {t.mintSuccessDesc}
                  </AlertDescription>
                </Alert>
              )}

              {(mintStatus === "error" || mintStatus === "invalid" || mintStatus === "already_minted") && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {mintStatus === "invalid" && t.invalidCodeDesc}
                    {mintStatus === "already_minted" && t.alreadyMintedDesc}
                    {mintStatus === "error" && t.mintErrorDesc}
                  </AlertDescription>
                </Alert>
              )}

              {!isConnected && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    {t.walletRequiredDesc}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t.howItWorks}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-gray-700">{t.step1}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-gray-700">{t.step2}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-gray-700">{t.step3}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Codes (for testing) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">{t.examples}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {t.exampleCodes.map((code, index) => (
                  <button
                    key={index}
                    onClick={() => setSecretCode(code)}
                    className="p-2 text-sm font-mono bg-gray-100 hover:bg-gray-200 rounded border text-gray-700 transition-colors"
                    disabled={isLoading}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}