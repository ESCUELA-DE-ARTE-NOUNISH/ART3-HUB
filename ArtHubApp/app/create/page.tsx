"use client"

import type React from "react"
import dynamic from "next/dynamic"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Header from "@/components/header"
import { NetworkSelector } from "@/components/network-selector"
import { ImagePlus, Loader2, ExternalLink, Crown, Gift, AlertCircle } from "lucide-react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { IPFSService, type NFTMetadata } from "@/lib/services/ipfs-service"
import { createArt3HubV3ServiceWithUtils, type V3SubscriptionInfo } from "@/lib/services/art3hub-v3-service"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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
  
  // Subscription state  
  const [subscription, setSubscription] = useState<V3SubscriptionInfo | null>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(false)
  const [needsSubscription, setNeedsSubscription] = useState(false)
  
  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { toast } = useToast()
  
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  
  // Load user subscription when wallet connects
  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setSubscription(null)
      return
    }

    const loadSubscription = async () => {
      setLoadingSubscription(true)
      try {
        if (publicClient) {
          const { getActiveNetwork } = await import('@/lib/networks')
          const targetNetwork = getActiveNetwork(selectedNetwork, isTestingMode)
          const { art3hubV3Service } = createArt3HubV3ServiceWithUtils(publicClient, walletClient, selectedNetwork, isTestingMode)
          const userSubscription = await art3hubV3Service.getUserSubscription(address)
          setSubscription(userSubscription)
          setNeedsSubscription(!userSubscription.isActive)
        }
      } catch (error) {
        console.error('Error loading V3 subscription:', error)
        setNeedsSubscription(true)
      } finally {
        setLoadingSubscription(false)
      }
    }

    loadSubscription()
  }, [isConnected, address, publicClient, walletClient, selectedNetwork, isTestingMode])
  
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

  // Function to subscribe to free plan
  const handleSubscribeToFreePlan = async () => {
    if (!isConnected || !address || !walletClient || !publicClient) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to subscribe",
        variant: "destructive",
      })
      return
    }

    setLoadingSubscription(true)
    try {
      const { art3hubV3Service } = createArt3HubV3ServiceWithUtils(publicClient, walletClient, selectedNetwork, isTestingMode)
      await art3hubV3Service.subscribeToFreePlan()
      
      toast({
        title: "V3 Subscription activated!",
        description: "You now have access to create NFT collections with built-in gasless functionality",
      })
      
      // Reload subscription data
      const userSubscription = await art3hubV3Service.getUserSubscription(address)
      setSubscription(userSubscription)
      setNeedsSubscription(false)
      
    } catch (error) {
      console.error('Error subscribing to V3 free plan:', error)
      toast({
        title: "V3 Subscription failed",
        description: error instanceof Error ? error.message : "Failed to activate V3 free plan",
        variant: "destructive",
      })
    } finally {
      setLoadingSubscription(false)
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

    // Check subscription first
    if (needsSubscription || !subscription?.isActive) {
      toast({
        title: "Subscription required",
        description: "Please activate your free plan to create NFT collections",
        variant: "destructive",
      })
      return
    }

    if (subscription.remainingNFTs <= 0) {
      toast({
        title: "NFT limit reached",
        description: `You've used all ${subscription.nftLimit} NFTs for your ${subscription.planName}. Upgrade to Master plan for more NFTs.`,
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
      setMintStatus('Creating V3 collection on blockchain...')
      
      // 4. Create Art3Hub V3 service and create collection + mint NFT
      if (!walletClient) {
        throw new Error('Wallet client not available')
      }
      
      console.log('📱 Using Art3Hub V3 service...')
      console.log('🏪 Selected network:', selectedNetwork)
      console.log('🧪 Testing mode:', isTestingMode)
      console.log('🔧 V3 Service Debug: Creating V3 service instance...')
      
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
          description: `Please switch to ${targetNetwork.displayName} in your wallet before creating NFT`,
          variant: "destructive",
        })
        setIsLoading(false)
        setMintStatus('')
        return
      }
      
      setMintStatus('Creating V3 NFT collection (built-in gasless)...')
      console.log('🔧 V3 Service Debug: Calling createArt3HubV3ServiceWithUtils...')
      console.log('🔧 V3 Environment Check:', {
        factoryV3: process.env.NEXT_PUBLIC_ART3HUB_FACTORY_V3_84532,
        subscriptionV3: process.env.NEXT_PUBLIC_ART3HUB_SUBSCRIPTION_V3_84532
      })
      const { art3hubV3Service } = createArt3HubV3ServiceWithUtils(publicClient, walletClient, selectedNetwork, isTestingMode)
      console.log('✅ V3 Service Debug: V3 service created successfully:', art3hubV3Service.constructor.name)
      console.log('🔧 V3 Service Addresses:', {
        factory: art3hubV3Service.factoryAddress,
        subscription: art3hubV3Service.subscriptionAddress
      })
      
      // Create V3 collection first
      const collectionResult = await art3hubV3Service.createCollection({
        name: title,
        symbol: title.replace(/\s+/g, '').toUpperCase().substring(0, 6),
        description: description,
        imageURI: metadataUpload.ipfsUrl,
        externalUrl: '',
        artist: address,
        royaltyRecipient: address,
        royaltyBPS: Math.floor(parseFloat(royaltyPercentage) * 100), // Convert percentage to basis points
      })
      
      setMintStatus('Minting NFT to V3 collection...')
      
      // Mint NFT to the newly created V3 collection
      const mintResult = await art3hubV3Service.mintNFT({
        collectionContract: collectionResult.contractAddress,
        recipient: address,
        tokenURI: metadataUpload.ipfsUrl
      })
      
      setTransactionHash(mintResult.transactionHash)
      setMintStatus('V3 NFT created successfully with built-in gasless transaction!')
      
      // Store V3 NFT data in database for gallery display
      try {
        // First, store the collection
        await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: address,
            contract_address: collectionResult.contractAddress,
            name: title,
            symbol: title.replace(/\s+/g, '').toUpperCase().substring(0, 6),
            description: description,
            image: metadataUpload.ipfsUrl,
            external_url: '',
            royalty_recipient: address,
            royalty_fee_numerator: Math.floor(parseFloat(royaltyPercentage) * 100),
            network: `${selectedNetwork}${isTestingMode ? '-sepolia' : ''}`,
            chain_id: targetNetwork.id,
            factory_address: art3hubV3Service.factoryAddress,
            transaction_hash: collectionResult.transactionHash
          })
        })
        
        // Then, store the NFT
        await fetch('/api/nfts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: address,
            name: title,
            description: description,
            image_ipfs_hash: imageUpload.ipfsHash,
            metadata_ipfs_hash: metadataUpload.ipfsHash,
            collection_address: collectionResult.contractAddress,
            collection_name: title,
            collection_symbol: title.replace(/\s+/g, '').toUpperCase().substring(0, 6),
            transaction_hash: mintResult.transactionHash,
            gasless_transaction_hash: mintResult.transactionHash,
            network: `${selectedNetwork}${isTestingMode ? '-sepolia' : ''}`,
            chain_id: targetNetwork.id,
            royalty_percentage: parseFloat(royaltyPercentage),
            contract_version: 'V3',
            factory_address: art3hubV3Service.factoryAddress,
            subscription_address: art3hubV3Service.subscriptionAddress,
            mint_status: 'completed'
          })
        })
        console.log('✅ V3 NFT and collection stored in database')
      } catch (error) {
        console.error('Failed to store V3 NFT in database:', error)
      }
      
      // Refresh V3 subscription data to show updated quota
      try {
        const { art3hubV3Service: refreshService } = createArt3HubV3ServiceWithUtils(publicClient, walletClient, selectedNetwork, isTestingMode)
        const updatedSubscription = await refreshService.getUserSubscription(address)
        setSubscription(updatedSubscription)
      } catch (error) {
        console.warn('Failed to refresh V3 subscription data:', error)
      }
      
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
            <CardTitle className="flex items-center gap-2">
              Create Your NFT 
              <Badge variant="secondary">V3 - Built-in Gasless</Badge>
            </CardTitle>
            <CardDescription>
              Create gasless NFT collections with V3 built-in functionality - auto-enrollment included!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Please connect your wallet to create an NFT</p>
              </div>
            ) : (
              <>
                {/* Subscription Status Card */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Subscription Status</h3>
                      {loadingSubscription && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    
                    {subscription ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {subscription.plan === 'FREE' ? (
                              <Gift className="h-5 w-5 text-green-500" />
                            ) : (
                              <Crown className="h-5 w-5 text-yellow-500" />
                            )}
                            <span className="font-medium">{subscription.planName}</span>
                          </div>
                          <Badge variant={subscription.isActive ? "default" : "destructive"}>
                            {subscription.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        {subscription.isActive && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>NFTs Used</span>
                              <span>{subscription.nftsMinted}/{subscription.nftLimit}</span>
                            </div>
                            <Progress 
                              value={(subscription.nftsMinted / subscription.nftLimit) * 100} 
                              className="h-2"
                            />
                            <p className="text-sm text-muted-foreground">
                              {subscription.remainingNFTs} gasless NFTs remaining this period
                            </p>
                          </div>
                        )}
                        
                        {subscription.expiresAt && (
                          <p className="text-sm text-muted-foreground">
                            {subscription.plan === 'MASTER' ? 'Expires' : 'Active until'}: {subscription.expiresAt.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : needsSubscription ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Subscription Required</AlertTitle>
                        <AlertDescription className="mt-2">
                          <p className="mb-3">
                            Art3Hub V3 features built-in gasless functionality with auto-enrollment. Get started with our free plan to create your first NFT collection!
                          </p>
                          <Button 
                            onClick={handleSubscribeToFreePlan}
                            disabled={loadingSubscription}
                            size="sm"
                          >
                            {loadingSubscription ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Activating...
                              </>
                            ) : (
                              <>
                                <Gift className="h-4 w-4 mr-2" />
                                Activate Free Plan
                              </>
                            )}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </CardContent>
                </Card>

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
                            src={image}
                            alt="NFT Preview"
                            className="w-full h-64 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setImage(null)
                              setImageFile(null)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                          <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <span className="text-sm text-muted-foreground">Click to upload image</span>
                          </Label>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter NFT title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your NFT"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="royalty" className="text-sm font-medium">Royalty Percentage</Label>
                    <Input
                      id="royalty"
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={royaltyPercentage}
                      onChange={(e) => setRoyaltyPercentage(e.target.value)}
                      placeholder="5.0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Royalty percentage for secondary sales (0-50%)
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || needsSubscription || !subscription?.isActive || subscription?.remainingNFTs <= 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mintStatus}
                      </>
                    ) : needsSubscription || !subscription?.isActive ? (
                      "Activate Subscription First"
                    ) : subscription?.remainingNFTs <= 0 ? (
                      "NFT Limit Reached - Upgrade Plan"
                    ) : (
                      `Create Gasless NFT (${subscription?.remainingNFTs} remaining)`
                    )}
                  </Button>

                  {transactionHash && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>NFT Created Successfully!</AlertTitle>
                      <AlertDescription>
                        <div className="space-y-2 mt-2">
                          <p>Your NFT has been created with gasless transaction.</p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(transactionHash)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy TX Hash
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a 
                                href={getBlockExplorerUrl(transactionHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View on Explorer
                              </a>
                            </Button>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={resetForm}
                            className="w-full mt-3"
                          >
                            Create Another NFT
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Use dynamic import to avoid SSR issues
export default dynamic(() => Promise.resolve(CreateNFT), { ssr: false })