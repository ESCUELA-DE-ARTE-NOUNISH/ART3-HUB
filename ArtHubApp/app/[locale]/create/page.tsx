"use client"

import type React from "react"
import dynamic from "next/dynamic"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Header from "@/components/header"
import { ImagePlus, Loader2, ExternalLink } from "lucide-react"
import { useAccount, usePublicClient, useWalletClient, useBalance } from "wagmi"
import { useNetworkClients } from "@/hooks/useNetworkClients"
import { IPFSService, type NFTMetadata } from "@/lib/services/ipfs-service"
import { createZoraService, type Art3HubCollectionParams } from "@/lib/services/zora-service"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Copy } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import { NetworkSelector } from "@/components/network-selector"

// Translation content
const translations = {
  en: {
    title: "Create NFT",
    subtitle: "Create an ERC-721 NFT collection with ERC-2981 royalties using Art3Hub Factory",
    image: "Image",
    clickToUpload: "Click to upload",
    dragAndDrop: "or drag and drop",
    imageFormats: "PNG, JPG or GIF (MAX. 10MB)",
    nftTitle: "Title",
    titlePlaceholder: "Give your NFT a name",
    description: "Description",
    descriptionPlaceholder: "Tell the story behind your creation",
    artistName: "Artist Name",
    artistPlaceholder: "Your artist name or pseudonym",
    category: "Category",
    selectCategory: "Select a category",
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
    viewCollection: "View Collection on Blockscout", 
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
    invalidFileTypeDesc: "Please select an image file",
    walletBalance: "Wallet Balance",
    walletAddress: "Wallet Address",
    copyAddress: "Copy Address",
    addressCopied: "Address Copied!",
    addressCopiedDesc: "Wallet address copied to clipboard",
    insufficientFunds: "Insufficient Funds",
    insufficientFundsDesc: "You need at least 0.002 ETH for deployment fee + gas",
    deploymentFee: "Deployment Fee: 0.001 ETH + gas"
  },
  es: {
    title: "Crear NFT",
    subtitle: "Crear una colección NFT ERC-721 con regalías ERC-2981 usando Art3Hub Factory",
    image: "Imagen",
    clickToUpload: "Haz clic para subir",
    dragAndDrop: "o arrastra y suelta",
    imageFormats: "PNG, JPG o GIF (MÁX. 10MB)",
    nftTitle: "Título",
    titlePlaceholder: "Dale un nombre a tu NFT",
    description: "Descripción",
    descriptionPlaceholder: "Cuenta la historia detrás de tu creación",
    artistName: "Nombre del Artista",
    artistPlaceholder: "Tu nombre artístico o seudónimo",
    category: "Categoría",
    selectCategory: "Selecciona una categoría",
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
    viewCollection: "Ver Colección en Blockscout",
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
    invalidFileTypeDesc: "Por favor selecciona un archivo de imagen",
    walletBalance: "Saldo de Billetera",
    walletAddress: "Dirección de Billetera",
    copyAddress: "Copiar Dirección",
    addressCopied: "¡Dirección Copiada!",
    addressCopiedDesc: "Dirección de billetera copiada al portapapeles",
    insufficientFunds: "Fondos Insuficientes",
    insufficientFundsDesc: "Necesitas al menos 0.002 ETH para tarifa de despliegue + gas",
    deploymentFee: "Tarifa de Despliegue: 0.001 ETH + gas"
  },
  fr: {
    title: "Créer un NFT",
    subtitle: "Créer une collection NFT ERC-721 avec des royalties ERC-2981 en utilisant Art3Hub Factory",
    image: "Image",
    clickToUpload: "Cliquez pour télécharger",
    dragAndDrop: "ou glisser-déposer",
    imageFormats: "PNG, JPG ou GIF (MAX. 10MB)",
    nftTitle: "Titre",
    titlePlaceholder: "Donnez un nom à votre NFT",
    description: "Description",
    descriptionPlaceholder: "Racontez l'histoire derrière votre création",
    artistName: "Nom de l'Artiste",
    artistPlaceholder: "Votre nom d'artiste ou pseudonyme",
    category: "Catégorie",
    selectCategory: "Sélectionnez une catégorie",
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
    viewCollection: "Voir la Collection sur Blockscout",
    viewIPFSImage: "Voir l'Image sur IPFS",
    viewIPFSMetadata: "Voir les Métadonnées sur IPFS",
    createAnother: "Créer un Autre NFT",
    nftRegistered: "Transaction de création NFT confirmée - fichiers téléchargés sur IPFS",
    ipfsNote: "Vos fichiers sont stockés de manière permanente sur IPFS et accessibles via les liens ci-dessous",
    errorTitle: "Erreur lors de la création du NFT",
    fileTooLarge: "Fichier trop volumineux",
    fileTooLargeDesc: "Veuillez sélectionner une image de moins de 10MB",
    invalidFileType: "Type de fichier invalide",
    invalidFileTypeDesc: "Veuillez sélectionner un fichier image",
    walletBalance: "Solde du Portefeuille",
    walletAddress: "Adresse du Portefeuille",
    copyAddress: "Copier l'Adresse",
    addressCopied: "Adresse Copiée !",
    addressCopiedDesc: "Adresse du portefeuille copiée dans le presse-papiers",
    insufficientFunds: "Fonds Insuffisants",
    insufficientFundsDesc: "Vous avez besoin d'au moins 0.002 ETH pour frais de déploiement + gas",
    deploymentFee: "Frais de Déploiement: 0.001 ETH + gas"
  },
  pt: {
    title: "Criar NFT",
    subtitle: "Criar uma coleção NFT ERC-721 com royalties ERC-2981 usando Art3Hub Factory",
    image: "Imagem",
    clickToUpload: "Clique para fazer upload",
    dragAndDrop: "ou arraste e solte",
    imageFormats: "PNG, JPG ou GIF (MÁX. 10MB)",
    nftTitle: "Título",
    titlePlaceholder: "Dê um nome ao seu NFT",
    description: "Descrição",
    descriptionPlaceholder: "Conte a história por trás da sua criação",
    artistName: "Nome do Artista",
    artistPlaceholder: "Seu nome artístico ou pseudônimo",
    category: "Categoria",
    selectCategory: "Selecione uma categoria",
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
    viewCollection: "Ver Coleção no Blockscout",
    viewIPFSImage: "Ver Imagem no IPFS",
    viewIPFSMetadata: "Ver Metadados no IPFS",
    createAnother: "Criar Outro NFT",
    nftRegistered: "Transação de criação de NFT confirmada - arquivos enviados para IPFS",
    ipfsNote: "Seus arquivos estão armazenados permanentemente no IPFS e acessíveis através dos links abaixo",
    errorTitle: "Erro ao criar NFT",
    fileTooLarge: "Arquivo muito grande",
    fileTooLargeDesc: "Por favor selecione uma imagem menor que 10MB",
    invalidFileType: "Tipo de arquivo inválido",
    invalidFileTypeDesc: "Por favor selecione um arquivo de imagem",
    walletBalance: "Saldo da Carteira",
    walletAddress: "Endereço da Carteira",
    copyAddress: "Copiar Endereço",
    addressCopied: "Endereço Copiado!",
    addressCopiedDesc: "Endereço da carteira copiado para área de transferência",
    insufficientFunds: "Fundos Insuficientes",
    insufficientFundsDesc: "Você precisa de pelo menos 0.002 ETH para taxa de implantação + gas",
    deploymentFee: "Taxa de Implantação: 0.001 ETH + gas"
  }
}

// NFT Categories for selection
const categories = [
  "Digital Art",
  "Photography", 
  "Illustrations",
  "3D Art",
  "Pixel Art",
  "Animation",
  "Abstract",
  "Portrait",
  "Landscape",
  "Street Art",
  "Pop Art",
  "Surreal",
  "Gaming",
  "Music",
  "Video"
]

function CreateNFT() {
  const params = useParams()
  const router = useRouter()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [t, setT] = useState(translations.en)
  
  // Form state
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [artistName, setArtistName] = useState("")
  const [category, setCategory] = useState("Digital Art")
  const [royaltyPercentage, setRoyaltyPercentage] = useState("5")
  const [selectedNetwork, setSelectedNetwork] = useState("base")
  const [isLoading, setIsLoading] = useState(false)
  const [mintStatus, setMintStatus] = useState<string>('')
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [ipfsImageHash, setIpfsImageHash] = useState<string>('')
  const [ipfsMetadataHash, setIpfsMetadataHash] = useState<string>('')
  const [mintResult, setMintResult] = useState<any>(null)
  
  // Wagmi hooks
  const { address, isConnected, connector, status } = useAccount()
  const defaultPublicClient = usePublicClient()
  const { data: defaultWalletClient } = useWalletClient()
  const { toast } = useToast()
  
  // Get balance for current network
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
    query: {
      enabled: !!address && isConnected,
    }
  })
  
  // Get fresh clients that match the current network
  const { publicClient, walletClient, chainId: currentChainId } = useNetworkClients()
  
  // Debug connection status
  useEffect(() => {
    console.log('🔗 Wallet connection status:', {
      isConnected,
      address,
      connector: connector?.name,
      status,
      walletClient: !!walletClient,
      walletClientChain: walletClient?.chain?.id,
      publicClient: !!publicClient,
      publicClientChain: publicClient?.chain?.id,
      defaultWalletClient: !!defaultWalletClient,
      defaultPublicClient: !!defaultPublicClient,
      selectedNetwork,
      currentChainId
    })
  }, [isConnected, address, connector, status, walletClient, publicClient, selectedNetwork, currentChainId])
  
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  
  // Copy wallet address to clipboard
  const copyAddressToClipboard = async () => {
    if (!address) return
    
    try {
      await navigator.clipboard.writeText(address)
      toast({
        title: t.addressCopied,
        description: t.addressCopiedDesc,
      })
    } catch (error) {
      console.error('Copy failed:', error)
      toast({
        title: t.copyFailed,
        description: t.copyFailedDesc,
        variant: "destructive",
      })
    }
  }
  
  // Check if balance is sufficient for deployment
  const isBalanceSufficient = balance ? parseFloat(balance.formatted) >= 0.002 : false

  // Helper function to add custom network to wallet
  const addNetworkToWallet = async (networkName: string, isTestingMode: boolean) => {
    try {
      const ethereum = (window as any).ethereum
      if (!ethereum) return false

      let networkConfig: any = null
      
      if (networkName === 'zora' && isTestingMode) {
        networkConfig = {
          chainId: '0x3B9ACA07', // 999999999 in hex
          chainName: 'Zora Sepolia',
          rpcUrls: ['https://sepolia.rpc.zora.energy'],
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          blockExplorerUrls: ['https://sepolia.explorer.zora.energy']
        }
      } else if (networkName === 'zora' && !isTestingMode) {
        networkConfig = {
          chainId: '0x76ADF1', // 7777777 in hex
          chainName: 'Zora Network',
          rpcUrls: ['https://rpc.zora.energy'],
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          blockExplorerUrls: ['https://explorer.zora.energy']
        }
      } else if (networkName === 'celo' && isTestingMode) {
        networkConfig = {
          chainId: '0xAEF3', // 44787 in hex
          chainName: 'Celo Sepolia',
          rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
          nativeCurrency: {
            name: 'Celo',
            symbol: 'CELO',
            decimals: 18
          },
          blockExplorerUrls: ['https://alfajores.celoscan.io']
        }
      } else if (networkName === 'celo' && !isTestingMode) {
        networkConfig = {
          chainId: '0xA4EC', // 42220 in hex
          chainName: 'Celo Network',
          rpcUrls: ['https://forno.celo.org'],
          nativeCurrency: {
            name: 'Celo',
            symbol: 'CELO',
            decimals: 18
          },
          blockExplorerUrls: ['https://celoscan.io']
        }
      }

      if (networkConfig) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig]
        })
        return true
      }
    } catch (error) {
      console.error('Failed to add network:', error)
      return false
    }
    return false
  }
  
  // Function to get block explorer URL for different networks
  const getBlockExplorerUrl = (txHash: string, network: string = selectedNetwork) => {
    if (isTestingMode) {
      switch (network) {
        case 'base':
          return `https://sepolia.basescan.org/tx/${txHash}`
        case 'celo':
          return `https://alfajores.celoscan.io/tx/${txHash}`
        case 'zora':
          return `https://sepolia.explorer.zora.energy/tx/${txHash}`
        default:
          return `https://sepolia.basescan.org/tx/${txHash}`
      }
    } else {
      switch (network) {
        case 'base':
          return `https://basescan.org/tx/${txHash}`
        case 'celo':
          return `https://celoscan.io/tx/${txHash}`
        case 'zora':
          return `https://explorer.zora.energy/tx/${txHash}`
        default:
          return `https://basescan.org/tx/${txHash}`
      }
    }
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
    setArtistName("")
    setCategory("Digital Art")
    setRoyaltyPercentage("5")
    setMintStatus('')
    setTransactionHash('')
    setIpfsImageHash('')
    setIpfsMetadataHash('')
    setMintResult(null)
  }

  // Function to get Blockscout collection link for different networks
  const getBlockscoutCollectionLink = (result: any, network: string = selectedNetwork) => {
    let baseUrl: string
    
    if (isTestingMode) {
      switch (network) {
        case 'base':
          baseUrl = 'https://base-sepolia.blockscout.com'
          break
        case 'celo':
          baseUrl = 'https://celo-alfajores.blockscout.com'
          break
        case 'zora':
          baseUrl = 'https://zora-sepolia.blockscout.com'
          break
        default:
          baseUrl = 'https://base-sepolia.blockscout.com'
      }
    } else {
      switch (network) {
        case 'base':
          baseUrl = 'https://base.blockscout.com'
          break
        case 'celo':
          baseUrl = 'https://celo.blockscout.com'
          break
        case 'zora':
          baseUrl = 'https://zora.blockscout.com'
          break
        default:
          baseUrl = 'https://base.blockscout.com'
      }
    }
    
    // If we have contract address, link directly to the collection
    if (result?.contractAddress) {
      return `${baseUrl}/address/${result.contractAddress}`
    }
    
    // Fallback to transaction
    return `${baseUrl}/tx/${result?.transactionHash || ''}`
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

  // Load user profile data when wallet connects
  useEffect(() => {
    const loadUserProfile = async () => {
      if (address && isConnected && !artistName) {
        try {
          const response = await fetch('/api/user-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: address })
          })
          
          if (response.ok) {
            const userData = await response.json()
            if (userData.success && userData.profile) {
              // Set artist name from profile if available
              if (userData.profile.name) {
                setArtistName(userData.profile.name)
              } else {
                // Fallback to abbreviated wallet address
                setArtistName(`Artist ${address.slice(0, 6)}`)
              }
            }
          }
        } catch (error) {
          console.error('Failed to load user profile:', error)
          // Fallback to abbreviated wallet address
          setArtistName(`Artist ${address.slice(0, 6)}`)
        }
      }
    }
    
    loadUserProfile()
  }, [address, isConnected, artistName])

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
      console.error('Missing required clients:', {
        isConnected,
        address: !!address,
        walletClient: !!walletClient,
        publicClient: !!publicClient
      })
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
      
      // Get the actual chain ID from the wallet
      const currentChainId = await walletClient.getChainId()
      
      console.log('🔍 Detailed network information:', {
        selectedNetwork,
        targetNetwork,
        targetChainId: targetNetwork.id,
        currentChainId,
        isTestingMode,
        walletClientChain: walletClient.chain?.id,
        publicClientChain: publicClient?.chain?.id
      })
      
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
        
        const expectedNetwork = isTestingMode 
          ? `${targetNetwork.displayName} (Testnet)`
          : `${targetNetwork.displayName} (Mainnet)`
        const currentNetwork = (() => {
          switch (currentChainId) {
            case 84532: return 'Base Sepolia'
            case 8453: return 'Base'
            case 44787: return 'Celo Sepolia'
            case 42220: return 'Celo'
            case 999999999: return 'Zora Sepolia'
            case 7777777: return 'Zora'
            default: return `Chain ${currentChainId}`
          }
        })()
        
        // Try to automatically add and switch to the network
        if (selectedNetwork !== 'base') {
          try {
            setMintStatus('Adding network to wallet...')
            const networkAdded = await addNetworkToWallet(selectedNetwork, isTestingMode)
            
            if (networkAdded) {
              toast({
                title: "Network Added",
                description: `${expectedNetwork} has been added to your wallet. Please try minting again.`,
                variant: "default",
              })
            } else {
              throw new Error('Failed to add network')
            }
          } catch (error) {
            // Fallback to manual instructions
            let networkInstructions = `Please switch to ${expectedNetwork} in your wallet. Currently on ${currentNetwork}.`
            
            if (selectedNetwork === 'zora' && isTestingMode) {
              networkInstructions = `Add Zora Sepolia to your wallet manually: RPC: https://sepolia.rpc.zora.energy, Chain ID: 999999999, Symbol: ETH`
            } else if (selectedNetwork === 'zora' && !isTestingMode) {
              networkInstructions = `Add Zora Network to your wallet manually: RPC: https://rpc.zora.energy, Chain ID: 7777777, Symbol: ETH`
            } else if (selectedNetwork === 'celo' && isTestingMode) {
              networkInstructions = `Add Celo Sepolia to your wallet manually: RPC: https://alfajores-forno.celo-testnet.org, Chain ID: 44787, Symbol: CELO`
            } else if (selectedNetwork === 'celo' && !isTestingMode) {
              networkInstructions = `Add Celo Network to your wallet manually: RPC: https://forno.celo.org, Chain ID: 42220, Symbol: CELO`
            }

            toast({
              title: "Network Switch Required",
              description: networkInstructions,
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "Network Switch Required",
            description: `Please switch to ${expectedNetwork} in your wallet. Currently on ${currentNetwork}.`,
            variant: "destructive",
          })
        }
        
        setIsLoading(false)
        setMintStatus('')
        return
      }
      
      // 5. Create Art3Hub service and create collection
      setMintStatus('Creating NFT collection...')
      
      // Use the target network's chain ID directly instead of relying on potentially outdated clients
      const { createArt3HubService } = await import('@/lib/services/zora-service')
      const art3HubService = createArt3HubService(publicClient, walletClient, selectedNetwork, isTestingMode)
      
      const collectionParams: Art3HubCollectionParams = {
        name: title,
        symbol: title.replace(/\s+/g, '').toUpperCase().substring(0, 6),
        description: description,
        imageURI: metadataUpload.ipfsUrl,
        maxSupply: 10000, // Default max supply
        mintPrice: '0.001', // Default mint price in ETH
        contractAdmin: address,
        fundsRecipient: address,
        royaltyBPS: Math.floor(parseFloat(royaltyPercentage) * 100), // Convert percentage to basis points
        contractURI: metadataUpload.ipfsUrl, // Collection metadata
        baseURI: `${metadataUpload.ipfsUrl}/` // Base URI for tokens
      }
      
      const result = await art3HubService.createCollection(collectionParams)
      
      setTransactionHash(result.transactionHash)
      setMintResult(result) // Store the full result for OpenSea links
      setMintStatus('') // Clear the loading status when successful
      
      // Try to get the actual collection address from the transaction
      console.log('🔍 Attempting to extract collection address from transaction...')
      try {
        const collectionAddress = await art3HubService.getCollectionAddressFromTx(result.transactionHash)
        if (collectionAddress && collectionAddress !== result.contractAddress) {
          console.log('🎯 Found actual collection address:', collectionAddress)
          // Update the result with the correct collection address
          result.contractAddress = collectionAddress
          if (result.nftData) {
            result.nftData.collectionAddress = collectionAddress
          }
          // Update the stored result
          setMintResult(result)
        }
      } catch (error) {
        console.warn('Could not extract collection address:', error)
      }

      // Store NFT data in database for gallery display (after collection address extraction)
      try {
        const nftData = {
          wallet_address: address,
          name: title,
          description: description,
          artist_name: artistName,
          category: category,
          image_ipfs_hash: imageHash, // Use the variable we stored earlier
          metadata_ipfs_hash: metadataHash, // Use the variable we stored earlier
          transaction_hash: result.transactionHash,
          network: `${selectedNetwork} ${isTestingMode ? 'testnet' : 'mainnet'}`,
          royalty_percentage: parseFloat(royaltyPercentage),
          contract_address: result.contractAddress || null,
          token_id: result.tokenId || null
        }
        
        console.log('💾 Storing NFT data:', nftData)
        
        const response = await fetch('/api/nfts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nftData)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Failed to store NFT in database:', errorData)
        } else {
          const dbResult = await response.json()
          console.log('✅ NFT stored in database:', dbResult)
          
          // If we have a collection address and it's different from what was initially stored, update it
          if (result.contractAddress && nftData.contract_address !== result.contractAddress) {
            console.log('🔄 Updating database with correct collection address...')
            try {
              const updateResponse = await fetch('/api/nfts/update-contract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transaction_hash: result.transactionHash,
                  contract_address: result.contractAddress
                })
              })
              
              if (updateResponse.ok) {
                const updateResult = await updateResponse.json()
                console.log('✅ Contract address updated in database:', updateResult)
              } else {
                console.warn('Failed to update contract address:', await updateResponse.text())
              }
            } catch (updateError) {
              console.warn('Error updating contract address:', updateError)
            }
          }
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

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
            <CardDescription className="text-sm sm:text-base text-center">
              {t.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{t.walletRequired}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Network Selector */}
                {/*}
                <NetworkSelector
                  selectedNetwork={selectedNetwork}
                  onNetworkChange={setSelectedNetwork}
                  locale={locale}
                />
                */}
                
                {/* Wallet Information */}
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3">
                      {/* Wallet Address */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm font-medium text-gray-700">{t.walletAddress}</Label>
                          <p className="text-sm font-mono text-gray-600 break-all">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copyAddressToClipboard}
                          className="w-full sm:w-auto"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          {t.copyAddress}
                        </Button>
                      </div>
                      
                      {/* Balance Information */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-700">{t.walletBalance}</Label>
                          <p className="text-sm font-semibold text-gray-900">
                            {balanceLoading ? (
                              <span className="animate-pulse">Loading...</span>
                            ) : balance ? (
                              `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
                            ) : (
                              "0.0000 ETH"
                            )}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-500">{t.deploymentFee}</p>
                        </div>
                      </div>
                      
                      {/* Insufficient Funds Warning */}
                      {!balanceLoading && balance && !isBalanceSufficient && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertTitle className="text-orange-800">{t.insufficientFunds}</AlertTitle>
                          <AlertDescription className="text-orange-700">
                            {t.insufficientFundsDesc}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div>
                  <Label className="text-sm font-medium">{t.image}</Label>
                  <div className="flex justify-center mt-2">
                    {image ? (
                      <div className="relative w-full max-w-xs">
                        <img
                          src={image || "/placeholder.svg"}
                          alt="NFT Preview"
                          className="w-full h-48 sm:h-64 object-cover rounded-lg border"
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
                      <label className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                          <ImagePlus className="w-8 h-8 sm:w-10 sm:h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 text-center">
                            <span className="font-semibold">{t.clickToUpload}</span> 
                            <span className="hidden sm:inline"> {t.dragAndDrop}</span>
                          </p>
                          <p className="text-xs text-gray-500 text-center">{t.imageFormats}</p>
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
                    className="mt-2 text-base"
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
                    rows={4}
                    required
                    className="mt-2 text-base resize-none"
                  />
                </div>

                {/* Artist Name */}
                <div>
                  <Label htmlFor="artistName" className="text-sm font-medium">
                    {t.artistName}
                  </Label>
                  <Input
                    id="artistName"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder={t.artistPlaceholder}
                    required
                    className="mt-2 text-base"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    {t.category}
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={t.selectCategory} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    className="mt-2 text-base"
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
                          <p>{t.networkInfo} {(() => {
                            const { getActiveNetwork } = require('@/lib/networks')
                            const activeNet = getActiveNetwork(selectedNetwork, isTestingMode)
                            return `${activeNet.displayName} ${isTestingMode ? 'Testnet' : 'Mainnet'}`
                          })()}</p>
                          <p className="text-sm mt-1">{t.nftRegistered}</p>
                          <p className="text-sm mt-1 text-blue-600">{t.ipfsNote}</p>
                          {!isTestingMode && (
                            <p className="text-orange-600 text-sm mt-1">
                              ⚠️ Mainnet transaction with real ETH fees
                            </p>
                          )}
                          {mintResult?.contractAddress && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border">
                              <p className="text-sm font-medium text-blue-800">Collection Details:</p>
                              <p className="text-xs text-blue-600 font-mono break-all">
                                Address: {mintResult.contractAddress}
                              </p>
                              <p className="text-xs text-blue-600">
                                Symbol: {title.replace(/\s+/g, '').toUpperCase().substring(0, 6)}
                              </p>
                            </div>
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
                        
                        {/* Debug Information */}
                        {isTestingMode && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-xs font-medium text-yellow-800 mb-1">🔍 Debug Info (Testnet Only):</p>
                            <div className="text-xs text-yellow-700 space-y-1">
                              <p>• Check console logs for detailed transaction info</p>
                              <p>• Collection address: {mintResult?.contractAddress || 'Extracting...'}</p>
                              <p>• Factory used: {(() => {
                                const { getArt3HubFactoryAddress } = require('@/lib/services/zora-service')
                                const { getActiveNetwork } = require('@/lib/networks')
                                const activeNet = getActiveNetwork(selectedNetwork, isTestingMode)
                                return process.env[`NEXT_PUBLIC_ART3HUB_FACTORY_${selectedNetwork.toUpperCase()}${isTestingMode ? '_SEPOLIA' : ''}`] || 'Not configured'
                              })()}</p>
                              <p>• If collection not found, check transaction logs on block explorer</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              window.open(getBlockExplorerUrl(transactionHash), '_blank')
                            }}
                            className="w-full h-10"
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
                              window.open(getBlockscoutCollectionLink(mintResult), '_blank')
                            }}
                            className="w-full h-10"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {t.viewCollection}
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
                              className="w-full h-10"
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
                              className="w-full h-10"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              {t.viewIPFSMetadata}
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Navigate with a timestamp parameter to force refresh
                              router.push(`/${locale}/my-nfts?refresh=${Date.now()}`)
                            }}
                            className="w-full h-10"
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
                            className="w-full h-10 bg-[#FF69B4] hover:bg-[#FF1493]"
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
                  className="w-full bg-[#FF69B4] hover:bg-[#FF1493] h-12 text-base font-medium"
                  disabled={!image || !title || !description || !artistName || isLoading || !isConnected || (!balanceLoading && !isBalanceSufficient)}
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