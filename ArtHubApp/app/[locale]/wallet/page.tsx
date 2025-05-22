"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"

// Translation content
const translations = {
  en: {
    title: "Wallet",
    walletBalance: "Wallet Balance",
    onBaseNetwork: "on Base Network",
    walletAddress: "Wallet Address",
    addFunds: "Add Funds",
    transactionHistory: "Transaction History",
    disconnectWallet: "Disconnect Wallet",
    connectYourWallet: "Connect Your Wallet",
    walletDescription: "Connect or create a wallet to start minting NFTs and managing your digital assets.",
    connectExistingWallet: "Connect Existing Wallet",
    connecting: "Connecting...",
    createNewWallet: "Create New Wallet",
    addressCopied: "Address copied to clipboard!"
  },
  es: {
    title: "Billetera",
    walletBalance: "Saldo de la Billetera",
    onBaseNetwork: "en la Red Base",
    walletAddress: "Dirección de la Billetera",
    addFunds: "Añadir Fondos",
    transactionHistory: "Historial de Transacciones",
    disconnectWallet: "Desconectar Billetera",
    connectYourWallet: "Conecta tu Billetera",
    walletDescription: "Conecta o crea una billetera para comenzar a acuñar NFTs y administrar tus activos digitales.",
    connectExistingWallet: "Conectar Billetera Existente",
    connecting: "Conectando...",
    createNewWallet: "Crear Nueva Billetera",
    addressCopied: "¡Dirección copiada al portapapeles!"
  },
  fr: {
    title: "Portefeuille",
    walletBalance: "Solde du Portefeuille",
    onBaseNetwork: "sur le Réseau Base",
    walletAddress: "Adresse du Portefeuille",
    addFunds: "Ajouter des Fonds",
    transactionHistory: "Historique des Transactions",
    disconnectWallet: "Déconnecter le Portefeuille",
    connectYourWallet: "Connectez Votre Portefeuille",
    walletDescription: "Connectez ou créez un portefeuille pour commencer à frapper des NFT et à gérer vos actifs numériques.",
    connectExistingWallet: "Connecter un Portefeuille Existant",
    connecting: "Connexion en cours...",
    createNewWallet: "Créer un Nouveau Portefeuille",
    addressCopied: "Adresse copiée dans le presse-papiers !"
  },
  pt: {
    title: "Carteira",
    walletBalance: "Saldo da Carteira",
    onBaseNetwork: "na Rede Base",
    walletAddress: "Endereço da Carteira",
    addFunds: "Adicionar Fundos",
    transactionHistory: "Histórico de Transações",
    disconnectWallet: "Desconectar Carteira",
    connectYourWallet: "Conecte Sua Carteira",
    walletDescription: "Conecte ou crie uma carteira para começar a cunhar NFTs e gerenciar seus ativos digitais.",
    connectExistingWallet: "Conectar Carteira Existente",
    connecting: "Conectando...",
    createNewWallet: "Criar Nova Carteira",
    addressCopied: "Endereço copiado para a área de transferência!"
  }
}

export default function WalletPage() {
  const params = useParams()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [t, setT] = useState(translations.en)
  const [walletConnected, setWalletConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState("0.00")
  const [address, setAddress] = useState("")

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
    setT(translations[currentLocale as keyof typeof translations] || translations.en)
  }, [params])

  const connectWallet = () => {
    setIsLoading(true)

    // Simulate wallet connection
    setTimeout(() => {
      setWalletConnected(true)
      setAddress("0x1a2b...3c4d")
      setBalance("0.05")
      setIsLoading(false)
    }, 1500)
  }

  const copyAddress = () => {
    navigator.clipboard.writeText("0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t")
    alert(t.addressCopied)
  }

  const refreshBalance = () => {
    setIsLoading(true)

    // Simulate balance refresh
    setTimeout(() => {
      setBalance((Number.parseFloat(balance) + 0.01).toFixed(2))
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">{t.title}</h1>
      </div>

      <div className="container mx-auto px-4 py-6">
        {walletConnected ? (
          <>
            <Card className="mb-6 border-[#FF69B4] border-2">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-[#FF69B4]">{t.walletBalance}</h2>
                  <Button variant="outline" size="icon" onClick={refreshBalance} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="text-3xl font-bold mb-2">{balance} ETH</div>
                <div className="text-sm text-gray-500">{t.onBaseNetwork}</div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">{t.walletAddress}</h2>
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <div className="font-mono text-sm truncate">{address}</div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={copyAddress}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              <Button className="bg-[#9ACD32] hover:bg-[#7CFC00]">{t.addFunds}</Button>
              <Button variant="outline">{t.transactionHistory}</Button>
              <Button variant="outline" className="text-red-500 hover:text-red-700">
                {t.disconnectWallet}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-[#FF69B4]" />
            <h2 className="text-2xl font-bold mb-2">{t.connectYourWallet}</h2>
            <p className="text-gray-600 mb-6">
              {t.walletDescription}
            </p>
            <div className="space-y-4">
              <Button className="w-full bg-[#FF69B4] hover:bg-[#FF1493]" onClick={connectWallet} disabled={isLoading}>
                {isLoading ? t.connecting : t.connectExistingWallet}
              </Button>
              <Button variant="outline" className="w-full" disabled={isLoading}>
                {t.createNewWallet}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 