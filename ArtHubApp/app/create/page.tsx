"use client"

import type React from "react"
import dynamic from "next/dynamic"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Header from "@/components/header"
import { NetworkSelector } from "@/components/network-selector"
import { ImagePlus, Loader2, ExternalLink } from "lucide-react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { IPFSService, type NFTMetadata } from "@/lib/services/ipfs-service"
import { createZoraService } from "@/lib/services/zora-service"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Copy } from "lucide-react"

function CreateNFT() {
  // Form state
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [royaltyPercentage, setRoyaltyPercentage] = useState("5")
  const [selectedNetwork, setSelectedNetwork] = useState("base")
  const [isLoading, setIsLoading] = useState(false)
  const [mintStatus, setMintStatus] = useState<string>('')
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [ipfsImageHash, setIpfsImageHash] = useState<string>('')
  const [ipfsMetadataHash, setIpfsMetadataHash] = useState<string>('')
  
  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { toast } = useToast()
  
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  
  // Function to get block explorer URL
  const getBlockExplorerUrl = (txHash: string) => {
    const baseUrl = isTestingMode 
      ? selectedNetwork === 'base' 
        ? 'https://sepolia.basescan.org'
        : 'https://sepolia.explorer.zora.energy'
      : selectedNetwork === 'base'
        ? 'https://basescan.org'
        : 'https://explorer.zora.energy'
    
    return `${baseUrl}/tx/${txHash}`
  }
  
  // Function to copy transaction hash to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Transaction hash copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 10MB",
          variant: "destructive",
        })
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }
      
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Function to manually reset the form
  const resetForm = () => {
    setImage(null)
    setImageFile(null)
    setTitle("")
    setDescription("")
    setRoyaltyPercentage("5")
    setMintStatus('')
    setTransactionHash('')
  }

  // Function to get OpenSea link for the NFT
  const getOpenSeaLink = (_txHash: string) => {
    const baseUrl = isTestingMode 
      ? selectedNetwork === 'base' 
        ? 'https://testnets.opensea.io'
        : 'https://testnets.opensea.io'
      : selectedNetwork === 'base'
        ? 'https://opensea.io'
        : 'https://opensea.io'
    
    // Link to user's profile to see their NFTs
    return `${baseUrl}/account/${address}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !address || !walletClient || !publicClient) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create an NFT",
        variant: "destructive",
      })
      return
    }
    
    if (!imageFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to mint as NFT",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)
    setMintStatus('Uploading image to IPFS...')
    
    try {
      // 1. Upload image to IPFS
      const imageUpload = await IPFSService.uploadFile(imageFile)
      setMintStatus('Uploading metadata to IPFS...')
      
      // 2. Create metadata
      const metadata: NFTMetadata = {
        name: title,
        description: description,
        image: imageUpload.ipfsUrl,
        attributes: [],
        royalty: {
          recipient: address,
          percentage: parseFloat(royaltyPercentage)
        }
      }
      
      // 3. Upload metadata to IPFS
      const metadataUpload = await IPFSService.uploadMetadata(metadata)
      setMintStatus('Creating collection on blockchain...')
      
      // 4. Create Zora service and mint NFT
      if (!walletClient) {
        throw new Error('Wallet client not available')
      }
      
      console.log('📱 Wallet client available:', !!walletClient)
      console.log('🌐 Public client available:', !!publicClient)
      console.log('🏪 Selected network:', selectedNetwork)
      console.log('🧪 Testing mode:', isTestingMode)
      
      // Check if wallet is on the correct network
      setMintStatus('Verifying network...')
      const { getActiveNetwork } = await import('@/lib/networks')
      const targetNetwork = getActiveNetwork(selectedNetwork, isTestingMode)
      const currentChainId = await walletClient.getChainId()
      
      console.log('Network check:', {
        selectedNetwork,
        targetChainId: targetNetwork.id,
        currentChainId,
        isTestingMode
      })
      
      if (currentChainId !== targetNetwork.id) {
        toast({
          title: "Wrong Network",
          description: `Please switch to ${targetNetwork.displayName} in your wallet before minting`,
          variant: "destructive",
        })
        setIsLoading(false)
        setMintStatus('')
        return
      }
      
      setMintStatus('Creating NFT collection...')
      const zoraService = createZoraService(publicClient, walletClient, selectedNetwork, isTestingMode)
      
      const result = await zoraService.createCollection({
        name: title,
        symbol: title.replace(/\s+/g, '').toUpperCase().substring(0, 6),
        description: description,
        imageURI: metadataUpload.ipfsUrl,
        contractAdmin: address,
        fundsRecipient: address,
        royaltyBPS: Math.floor(parseFloat(royaltyPercentage) * 100), // Convert percentage to basis points
      })
      
      setTransactionHash(result.transactionHash)
      setMintStatus('NFT created successfully!')
      
      // Store NFT data in database for gallery display
      try {
        await fetch('/api/nfts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: address,
            name: title,
            description: description,
            image_ipfs_hash: ipfsImageHash,
            metadata_ipfs_hash: ipfsMetadataHash,
            transaction_hash: result.transactionHash,
            network: `${selectedNetwork} ${isTestingMode ? 'testnet' : 'mainnet'}`,
            royalty_percentage: parseFloat(royaltyPercentage)
          })
        })
        console.log('✅ NFT stored in database')
      } catch (error) {
        console.error('Failed to store NFT in database:', error)
        // Don't fail the main process if database storage fails
      }
      
      // Success message stays visible until user manually closes it
      // No automatic timeout - user controls when to reset the form
      
    } catch (error) {
      console.error('Error creating NFT:', error)
      setMintStatus('')
      toast({
        title: "Error creating NFT",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="pb-16">
      <Header title="Create NFT" />

      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create Your NFT</CardTitle>
            <CardDescription>
              Create an ERC-721 NFT with ERC-2981 royalties using Zora Creator Protocol
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Please connect your wallet to create an NFT</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Network Selection */}
                <NetworkSelector 
                  selectedNetwork={selectedNetwork}
                  onNetworkChange={setSelectedNetwork}
                />
                
                <div>
                  <Label className="text-sm font-medium">Image</Label>
            <div className="flex justify-center">
              {image ? (
                <div className="relative w-full max-w-xs">
                  <img
                    src={image || "/placeholder.svg"}
                    alt="NFT Preview"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => setImage(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImagePlus className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 10MB)</p>
                  </div>
                  <Input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
                </div>

                <div>
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title
                  </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your NFT a name"
              required
            />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story behind your creation"
              rows={5}
              required
            />
                </div>
                
                {/* Royalty Percentage */}
                <div>
                  <Label htmlFor="royalty" className="text-sm font-medium">
                    Royalty Percentage
                  </Label>
                  <Input
                    id="royalty"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={royaltyPercentage}
                    onChange={(e) => setRoyaltyPercentage(e.target.value)}
                    placeholder="5.0"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Royalty you'll receive on secondary sales (0-10%)
                  </p>
                </div>

                {/* Mint Status */}
                {mintStatus && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-blue-800">{mintStatus}</span>
                    </div>
                  </div>
                )}
                
                {/* Success Alert with Transaction Hash */}
                {transactionHash && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">NFT Created Successfully!</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-3 mt-2">
                        <p className="text-green-700">
                          Your NFT has been minted on {selectedNetwork === 'base' ? 'Base' : 'Zora'} {isTestingMode ? 'Testnet' : 'Mainnet'}
                        </p>
                        
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <span className="text-xs font-mono text-gray-600 break-all flex-1">
                            {transactionHash}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(transactionHash)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(getBlockExplorerUrl(transactionHash), '_blank')}
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on Block Explorer
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(getOpenSeaLink(transactionHash), '_blank')}
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on OpenSea
                          </Button>
                        </div>
                        
                        <Button
                          variant="default"
                          size="sm"
                          onClick={resetForm}
                          className="w-full bg-[#FF69B4] hover:bg-[#FF1493]"
                        >
                          Create Another NFT
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#FF69B4] hover:bg-[#FF1493]"
                  disabled={!image || !title || !description || isLoading || !isConnected}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating NFT...
                    </>
                  ) : (
                    "Create NFT"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Export as dynamic component to avoid SSR issues with wagmi hooks
export default dynamic(() => Promise.resolve(CreateNFT), {
  ssr: false,
  loading: () => (
    <div className="pb-16">
      <Header title="Create NFT" />
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF69B4]"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
})
