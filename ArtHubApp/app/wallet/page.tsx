"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/header"
import { Wallet, Copy, ExternalLink, RefreshCw } from "lucide-react"

export default function WalletPage() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState("0.00")
  const [address, setAddress] = useState("")

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
    alert("Address copied to clipboard!")
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
      <Header title="Wallet" />

      <div className="container mx-auto px-4 py-6">
        {walletConnected ? (
          <>
            <Card className="mb-6 border-[#FF69B4] border-2">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-[#FF69B4]">Wallet Balance</h2>
                  <Button variant="outline" size="icon" onClick={refreshBalance} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="text-3xl font-bold mb-2">{balance} ETH</div>
                <div className="text-sm text-gray-500">on Base Network</div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Wallet Address</h2>
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
              <Button className="bg-[#9ACD32] hover:bg-[#7CFC00]">Add Funds</Button>
              <Button variant="outline">Transaction History</Button>
              <Button variant="outline" className="text-red-500 hover:text-red-700">
                Disconnect Wallet
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-[#FF69B4]" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Connect or create a wallet to start minting NFTs and managing your digital assets.
            </p>
            <div className="space-y-4">
              <Button className="w-full bg-[#FF69B4] hover:bg-[#FF1493]" onClick={connectWallet} disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect Existing Wallet"}
              </Button>
              <Button variant="outline" className="w-full" disabled={isLoading}>
                Create New Wallet
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
