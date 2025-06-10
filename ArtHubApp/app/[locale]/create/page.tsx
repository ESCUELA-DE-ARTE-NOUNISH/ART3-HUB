"use client"

import type React from "react"
import dynamic from "next/dynamic"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Header from "@/components/header"
import { ImagePlus, Loader2, ExternalLink } from "lucide-react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { IPFSService, type NFTMetadata } from "@/lib/services/ipfs-service"
import { createZoraService } from "@/lib/services/zora-service"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Copy } from "lucide-react"
import { useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"

// Translation content
const translations = {
  en: {
    title: "Create NFT",
    subtitle: "Create an ERC-721 NFT with ERC-2981 royalties using Zora Creator Protocol",
    image: "Image",
    clickToUpload: "Click to upload",
    dragAndDrop: "or drag and drop",
    imageFormats: "PNG, JPG or GIF (MAX. 10MB)",
    nftTitle: "Title",
    titlePlaceholder: "Give your NFT a name",
    description: "Description",
    descriptionPlaceholder: "Tell the story behind your creation",
    royalty: "Royalty Percentage",
    royaltyPlaceholder: "5.0",
    royaltyHelp: "Royalty you'll receive on secondary sales (0-10%)",
    mint: "Create NFT",
    creating: "Creating NFT...",
    success: "NFT Created Successfully!",
    change: "Change",
    network: "Network",
    selectNetwork: "Select the blockchain network for minting",
    walletRequired: "Please connect your wallet to create an NFT",
    noImage: "Please select an image to mint as NFT",
    networkInfo: "Your NFT has been minted on",
    copied: "Copied!",
    copiedDesc: "Transaction hash copied to clipboard",
    copyFailed: "Copy failed",
    copyFailedDesc: "Could not copy to clipboard",
    viewExplorer: "View on Block Explorer",
    viewOnOpenSea: "View Profile on OpenSea", 
    viewIPFSImage: "View Image on IPFS",
    viewIPFSMetadata: "View Metadata on IPFS",
    viewInGallery: "View in My Gallery",
    createAnother: "Create Another NFT",
    nftRegistered: "NFT creation transaction confirmed - files uploaded to IPFS",
    ipfsNote: "Your files are permanently stored on IPFS and accessible via the links below",
    errorTitle: "Error creating NFT",
    fileTooLarge: "File too large",
    fileTooLargeDesc: "Please select an image under 10MB",
    invalidFileType: "Invalid file type",
    invalidFileTypeDesc: "Please select an image file"
  },
  es: {
    title: "Crear NFT",
    subtitle: "Crear un NFT ERC-721 con regalías ERC-2981 usando el Protocolo Zora Creator",
    image: "Imagen",
    clickToUpload: "Haz clic para subir",
    dragAndDrop: "o arrastra y suelta",
    imageFormats: "PNG, JPG o GIF (MÁX. 10MB)",
    nftTitle: "Título",
    titlePlaceholder: "Dale un nombre a tu NFT",
    description: "Descripción",
    descriptionPlaceholder: "Cuenta la historia detrás de tu creación",
    royalty: "Porcentaje de Regalías",
    royaltyPlaceholder: "5.0",
    royaltyHelp: "Regalías que recibirás en ventas secundarias (0-10%)",
    mint: "Crear NFT",
    creating: "Creando NFT...",
    success: "¡NFT Creado con Éxito!",
    change: "Cambiar",
    network: "Red",
    selectNetwork: "Selecciona la red blockchain para acuñar",
    walletRequired: "Por favor conecta tu billetera para crear un NFT",
    noImage: "Por favor selecciona una imagen para acuñar como NFT",
    networkInfo: "Tu NFT ha sido acuñado en",
    copied: "¡Copiado!",
    copiedDesc: "Hash de transacción copiado al portapapeles",
    copyFailed: "Error al copiar",
    copyFailedDesc: "No se pudo copiar al portapapeles",
    viewExplorer: "Ver en Explorador de Bloques",
    viewOnOpenSea: "Ver Perfil en OpenSea",
    viewIPFSImage: "Ver Imagen en IPFS",
    viewIPFSMetadata: "Ver Metadatos en IPFS",
    viewInGallery: "Ver en Mi Galería", 
    createAnother: "Crear Otro NFT", 
    nftRegistered: "Transacción de creación de NFT confirmada - archivos subidos a IPFS",
    ipfsNote: "Tus archivos están almacenados permanentemente en IPFS y accesibles a través de los enlaces siguientes",
    errorTitle: "Error creando NFT",
    fileTooLarge: "Archivo demasiado grande",
    fileTooLargeDesc: "Por favor selecciona una imagen menor a 10MB",
    invalidFileType: "Tipo de archivo inválido",
    invalidFileTypeDesc: "Por favor selecciona un archivo de imagen"
  },
  fr: {
    title: "Créer un NFT",
    subtitle: "Créer un NFT ERC-721 avec des royalties ERC-2981 en utilisant le Protocole Zora Creator",
    image: "Image",
    clickToUpload: "Cliquez pour télécharger",
    dragAndDrop: "ou glisser-déposer",
    imageFormats: "PNG, JPG ou GIF (MAX. 10MB)",
    nftTitle: "Titre",
    titlePlaceholder: "Donnez un nom à votre NFT",
    description: "Description",
    descriptionPlaceholder: "Racontez l'histoire derrière votre création",
    royalty: "Pourcentage de Royalties",
    royaltyPlaceholder: "5.0",
    royaltyHelp: "Royalties que vous recevrez sur les ventes secondaires (0-10%)",
    mint: "Créer NFT",
    creating: "Création NFT...",
    success: "NFT Créé avec Succès !",
    change: "Changer",
    network: "Réseau",
    selectNetwork: "Sélectionnez le réseau blockchain pour frapper",
    walletRequired: "Veuillez connecter votre portefeuille pour créer un NFT",
    noImage: "Veuillez sélectionner une image à frapper comme NFT",
    networkInfo: "Votre NFT a été frappé sur",
    copied: "Copié !",
    copiedDesc: "Hash de transaction copié dans le presse-papiers",
    copyFailed: "Échec de la copie",
    copyFailedDesc: "Impossible de copier dans le presse-papiers",
    viewExplorer: "Voir sur l'Explorateur de Blocs",
    viewOnOpenSea: "Voir le Profil sur OpenSea",
    viewIPFSImage: "Voir l'Image sur IPFS",
    viewIPFSMetadata: "Voir les Métadonnées sur IPFS",
    createAnother: "Créer un Autre NFT",
    nftRegistered: "Transaction de création NFT confirmée - fichiers téléchargés sur IPFS",
    ipfsNote: "Vos fichiers sont stockés de manière permanente sur IPFS et accessibles via les liens ci-dessous",
    errorTitle: "Erreur lors de la création du NFT",
    fileTooLarge: "Fichier trop volumineux",
    fileTooLargeDesc: "Veuillez sélectionner une image de moins de 10MB",
    invalidFileType: "Type de fichier invalide",
    invalidFileTypeDesc: "Veuillez sélectionner un fichier image"
  },
  pt: {
    title: "Criar NFT",
    subtitle: "Criar um NFT ERC-721 com royalties ERC-2981 usando o Protocolo Zora Creator",
    image: "Imagem",
    clickToUpload: "Clique para fazer upload",
    dragAndDrop: "ou arraste e solte",
    imageFormats: "PNG, JPG ou GIF (MÁX. 10MB)",
    nftTitle: "Título",
    titlePlaceholder: "Dê um nome ao seu NFT",
    description: "Descrição",
    descriptionPlaceholder: "Conte a história por trás da sua criação",
    royalty: "Porcentagem de Royalty",
    royaltyPlaceholder: "5.0",
    royaltyHelp: "Royalty que você receberá nas vendas secundárias (0-10%)",
    mint: "Criar NFT",
    creating: "Criando NFT...",
    success: "NFT Criado com Sucesso!",
    change: "Alterar",
    network: "Rede",
    selectNetwork: "Selecione a rede blockchain para cunhar",
    walletRequired: "Por favor conecte sua carteira para criar um NFT",
    noImage: "Por favor selecione uma imagem para cunhar como NFT",
    networkInfo: "Seu NFT foi cunhado na",
    copied: "Copiado!",
    copiedDesc: "Hash da transação copiado para a área de transferência",
    copyFailed: "Falha ao copiar",
    copyFailedDesc: "Não foi possível copiar para a área de transferência",
    viewExplorer: "Ver no Explorador de Blocos",
    viewOnOpenSea: "Ver Perfil no OpenSea",
    viewIPFSImage: "Ver Imagem no IPFS",
    viewIPFSMetadata: "Ver Metadados no IPFS",
    createAnother: "Criar Outro NFT",
    nftRegistered: "Transação de criação de NFT confirmada - arquivos enviados para IPFS",
    ipfsNote: "Seus arquivos estão armazenados permanentemente no IPFS e acessíveis através dos links abaixo",
    errorTitle: "Erro ao criar NFT",
    fileTooLarge: "Arquivo muito grande",
    fileTooLargeDesc: "Por favor selecione uma imagem menor que 10MB",
    invalidFileType: "Tipo de arquivo inválido",
    invalidFileTypeDesc: "Por favor selecione um arquivo de imagem"
  }
}

function CreateNFT() {
  const params = useParams()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [t, setT] = useState(translations.en)
  
  // Form state
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [royaltyPercentage, setRoyaltyPercentage] = useState("5")
  // Fixed to Base network only
  const selectedNetwork = "base"
  const [isLoading, setIsLoading] = useState(false)
  const [mintStatus, setMintStatus] = useState<string>('')
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [ipfsImageHash, setIpfsImageHash] = useState<string>('')
  const [ipfsMetadataHash, setIpfsMetadataHash] = useState<string>('')
  const [mintResult, setMintResult] = useState<any>(null)
  
  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { toast } = useToast()
  
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  
  // Function to get block explorer URL - Base only
  const getBlockExplorerUrl = (txHash: string) => {
    const baseUrl = isTestingMode ? 'https://sepolia.basescan.org' : 'https://basescan.org'
    return `${baseUrl}/tx/${txHash}`
  }
  
  // Function to copy transaction hash to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: t.copied,
        description: t.copiedDesc,
      })
    } catch (error) {
      toast({
        title: t.copyFailed,
        description: t.copyFailedDesc,
        variant: "destructive",
      })
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
    setIpfsImageHash('')
    setIpfsMetadataHash('')
    setMintResult(null)
  }

  // Function to get OpenSea link for the specific NFT
  const getOpenSeaLink = (result: any) => {
    const baseUrl = isTestingMode 
      ? 'https://testnets.opensea.io'
      : 'https://opensea.io'
    
    // If we have contract address and token ID, link directly to the NFT
    if (result?.contractAddress && result?.tokenId) {
      const network = isTestingMode ? 'base_sepolia' : 'base'
      return `${baseUrl}/assets/${network}/${result.contractAddress}/${result.tokenId}`
    }
    
    // Fallback to user's profile
    return `${baseUrl}/account/${address}`
  }

  // Function to get IPFS gateway link for the uploaded image
  const getIPFSImageLink = () => {
    // The IPFS metadata contains the image link
    // We can extract it from the successful upload
    return `https://gateway.pinata.cloud/ipfs/` // User can append the hash
  }

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
    setT(translations[currentLocale as keyof typeof translations] || translations.en)
  }, [params])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t.fileTooLarge,
          description: t.fileTooLargeDesc,
          variant: "destructive",
        })
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t.invalidFileType,
          description: t.invalidFileTypeDesc,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !address || !walletClient || !publicClient) {
      toast({
        title: t.walletRequired,
        description: t.walletRequired,
        variant: "destructive",
      })
      return
    }
    
    if (!imageFile) {
      toast({
        title: t.noImage,
        description: t.noImage,
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)
    setMintStatus('Uploading image to IPFS...')
    
    try {
      // 1. Upload image to IPFS
      const imageUpload = await IPFSService.uploadFile(imageFile)
      const imageHash = imageUpload.ipfsHash // Store in variable first
      setIpfsImageHash(imageHash) // Store for links
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
      const metadataHash = metadataUpload.ipfsHash // Store in variable first
      setIpfsMetadataHash(metadataHash) // Store for links
      setMintStatus('Creating collection on blockchain...')
      
      // 4. Check if wallet is on the correct network
      setMintStatus('Verifying network...')
      const { getActiveNetwork } = await import('@/lib/networks')
      const targetNetwork = getActiveNetwork(selectedNetwork, isTestingMode)
      const currentChainId = await walletClient.getChainId()
      
      console.log('Network check:', {
        selectedNetwork,
        targetChainId: targetNetwork.id,
        currentChainId,
        isTestingMode,
        targetNetwork,
        walletClientChain: walletClient.chain?.id
      })
      
      if (currentChainId !== targetNetwork.id) {
        console.warn('Network mismatch detected:', {
          walletChainId: currentChainId,
          targetChainId: targetNetwork.id,
          selectedNetwork,
          targetNetwork
        })
        
        const expectedNetwork = isTestingMode ? 'Base Sepolia' : 'Base'
        const currentNetwork = currentChainId === 84532 ? 'Base Sepolia' : 
                              currentChainId === 8453 ? 'Base' : `Chain ${currentChainId}`
        
        toast({
          title: "Wrong Network",
          description: `Please switch to ${expectedNetwork} in your wallet. Currently on ${currentNetwork}.`,
          variant: "destructive",
        })
        setIsLoading(false)
        setMintStatus('')
        return
      }
      
      // 5. Create Zora service and mint NFT
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
      setMintResult(result) // Store the full result for OpenSea links
      setMintStatus('') // Clear the loading status when successful
      
      // Store NFT data in database for gallery display
      try {
        const response = await fetch('/api/nfts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: address,
            name: title,
            description: description,
            image_ipfs_hash: imageHash, // Use the variable we stored earlier
            metadata_ipfs_hash: metadataHash, // Use the variable we stored earlier
            transaction_hash: result.transactionHash,
            network: `${selectedNetwork} ${isTestingMode ? 'testnet' : 'mainnet'}`,
            royalty_percentage: parseFloat(royaltyPercentage),
            contract_address: result.contractAddress || null,
            token_id: result.tokenId || null
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Failed to store NFT in database:', errorData)
        } else {
          const result = await response.json()
          console.log('✅ NFT stored in database:', result)
        }
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
        title: t.errorTitle,
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="pb-16">
      <Header title={t.title} />

      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>
              {t.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{t.walletRequired}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Network Info - Fixed to Base */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">{t.network}</label>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-semibold text-blue-800">
                        {isTestingMode ? 'Base Sepolia (Testnet)' : 'Base (Mainnet)'}
                      </span>
                    </div>
                    <p className="text-center text-sm text-blue-600 mt-2">
                      {isTestingMode ? 'Chain ID: 84532' : 'Chain ID: 8453'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">{t.image}</Label>
                  <div className="flex justify-center mt-2">
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
                          {t.change}
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImagePlus className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">{t.clickToUpload}</span> {t.dragAndDrop}
                          </p>
                          <p className="text-xs text-gray-500">{t.imageFormats}</p>
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
                    {t.nftTitle}
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.titlePlaceholder}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    {t.description}
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.descriptionPlaceholder}
                    rows={5}
                    required
                    className="mt-2"
                  />
                </div>
                
                {/* Royalty Percentage */}
                <div>
                  <Label htmlFor="royalty" className="text-sm font-medium">
                    {t.royalty}
                  </Label>
                  <Input
                    id="royalty"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={royaltyPercentage}
                    onChange={(e) => setRoyaltyPercentage(e.target.value)}
                    placeholder={t.royaltyPlaceholder}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.royaltyHelp}
                  </p>
                </div>

                {/* Mint Status - Only show during loading */}
                {mintStatus && isLoading && (
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
                    <AlertTitle className="text-green-800">{t.success}</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-3 mt-2">
                        <div className="text-green-700">
                          <p>{t.networkInfo} Base {isTestingMode ? 'Testnet' : 'Mainnet'}</p>
                          <p className="text-sm mt-1">{t.nftRegistered}</p>
                          <p className="text-sm mt-1 text-blue-600">{t.ipfsNote}</p>
                          {!isTestingMode && (
                            <p className="text-orange-600 text-sm mt-1">
                              ⚠️ Mainnet transaction with real ETH fees
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <span className="text-xs font-mono text-gray-600 break-all flex-1">
                            {transactionHash}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              copyToClipboard(transactionHash)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              window.open(getBlockExplorerUrl(transactionHash), '_blank')
                            }}
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {t.viewExplorer}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              window.open(getOpenSeaLink(mintResult), '_blank')
                            }}
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {t.viewOnOpenSea}
                          </Button>
                          
                          {ipfsImageHash && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                window.open(`https://gateway.pinata.cloud/ipfs/${ipfsImageHash}`, '_blank')
                              }}
                              className="flex-1"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              {t.viewIPFSImage}
                            </Button>
                          )}
                          
                          {ipfsMetadataHash && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                window.open(`https://gateway.pinata.cloud/ipfs/${ipfsMetadataHash}`, '_blank')
                              }}
                              className="flex-1"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              {t.viewIPFSMetadata}
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              window.location.href = `/${locale}/my-nfts`
                            }}
                            className="flex-1"
                          >
                            {t.viewInGallery}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              resetForm()
                            }}
                            className="flex-1 bg-[#FF69B4] hover:bg-[#FF1493]"
                          >
                            {t.createAnother}
                          </Button>
                        </div>
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
                      {t.creating}
                    </>
                  ) : (
                    t.mint
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