"use client"

import type React from "react"
import { useState } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, QrCode, Key, Gift, CheckCircle, AlertCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"

export default function MintPage() {
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
        title: "Wallet Required",
        description: "Please connect your wallet to mint NFTs.",
        variant: "destructive",
      })
      return
    }

    if (!secretCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter a valid secret code to mint your NFT.",
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
        "WELCOME2024", "ARTFEST2024", "BETA_USER", "EARLY_ADOPTER"
      ]
      
      if (!validCodes.includes(secretCode)) {
        setMintStatus("invalid")
        toast({
          title: "Invalid Code",
          description: "The secret code you entered is not valid or has expired.",
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
          title: "Already Minted",
          description: "You have already minted an NFT with this code.",
          variant: "destructive",
        })
        return
      }

      // Mark as minted
      mintedArray.push(secretCode)
      localStorage.setItem(`minted_codes_${address}`, JSON.stringify(mintedArray))
      
      setMintStatus("success")
      toast({
        title: "NFT Minted Successfully!",
        description: "Your exclusive NFT has been minted to your wallet.",
      })
      
      // Clear the form
      setSecretCode("")
      
    } catch (error) {
      setMintStatus("error")
      toast({
        title: "Minting Failed",
        description: "Failed to mint NFT. Please try again.",
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
              Mint NFT
            </h1>
            <p className="text-lg text-gray-600">
              Enter your secret code or scan a QR code to mint your exclusive NFT.
            </p>
          </div>

          {/* Main Mint Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Mint NFT
              </CardTitle>
              <CardDescription>
                Enter your secret code or scan a QR code to mint your exclusive NFT.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Secret Code Input */}
              <div className="space-y-2">
                <Label htmlFor="secretCode">Secret Code</Label>
                <Input
                  id="secretCode"
                  type="text"
                  placeholder="Enter your secret code or event code"
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
                Scan QR Code
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
                    Minting...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Mint NFT
                  </>
                )}
              </Button>

              {/* Status Messages */}
              {mintStatus === "success" && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Your exclusive NFT has been minted to your wallet.
                  </AlertDescription>
                </Alert>
              )}

              {(mintStatus === "error" || mintStatus === "invalid" || mintStatus === "already_minted") && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {mintStatus === "invalid" && "The secret code you entered is not valid or has expired."}
                    {mintStatus === "already_minted" && "You have already minted an NFT with this code."}
                    {mintStatus === "error" && "Failed to mint NFT. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              {!isConnected && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    Please connect your wallet to mint NFTs.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-gray-700">Get a secret code from an event, promotion, or partner</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-gray-700">Enter the code or scan the QR code</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-gray-700">Mint your exclusive NFT directly to your wallet</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Codes (for testing) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Example codes for testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {["WELCOME2024", "ARTFEST2024", "BETA_USER", "EARLY_ADOPTER"].map((code, index) => (
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