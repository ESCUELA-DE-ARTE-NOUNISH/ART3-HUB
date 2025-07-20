"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { Grid, List, ChevronDown, Filter, ExternalLink, Share2, Copy } from "lucide-react"
import { useSearchParams, useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { defaultLocale } from "@/config/i18n"
import { useAccount } from 'wagmi'
import { useToast } from '@/hooks/use-toast'
import { getOpenSeaLinkFromNFT } from '@/lib/opensea-utils'

// Translation content
const translations = {
  en: {
    title: "My Collection",
    filterOptions: [
      { value: "all", label: "All" },
      { value: "created", label: "Created by Me" },
      { value: "collected", label: "Collected" }
    ],
    sortOptions: [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
      { value: "price-high", label: "Price: High to Low" },
      { value: "price-low", label: "Price: Low to High" }
    ],
    minted: "Minted",
    details: "Details",
    new: "New",
    noNftsTitle: "No NFTs Yet",
    noNftsDescription: "You haven't minted or collected any NFTs yet.",
    createFirstNft: "Create Your First NFT",
    loading: "Loading your NFTs...",
    error: "Failed to load NFTs",
    connectWallet: "Connect your wallet to view your NFTs",
    viewImage: "View Image",
    viewMetadata: "View Metadata",
    viewTransaction: "View Transaction",
    viewCollection: "View Collection",
    viewOnOpenSea: "View on OpenSea",
    copyHash: "Copy Hash",
    copied: "Copied!",
    copiedDesc: "Hash copied to clipboard",
    retry: "Retry",
    noFilterResults: "No NFTs found",
    noFilterResultsDesc: "No NFTs match the current filter selection.",
    showAllNfts: "Show All NFTs"
  },
  es: {
    title: "Mi Colección",
    filterOptions: [
      { value: "all", label: "Todos" },
      { value: "created", label: "Creados por mí" },
      { value: "collected", label: "Coleccionados" }
    ],
    sortOptions: [
      { value: "newest", label: "Más recientes primero" },
      { value: "oldest", label: "Más antiguos primero" },
      { value: "price-high", label: "Precio: Mayor a Menor" },
      { value: "price-low", label: "Precio: Menor a Mayor" }
    ],
    minted: "Acuñado",
    details: "Detalles",
    new: "Nuevo",
    noNftsTitle: "Aún no hay NFTs",
    noNftsDescription: "Todavía no has acuñado ni coleccionado ningún NFT.",
    createFirstNft: "Crea Tu Primer NFT",
    loading: "Cargando tus NFTs...",
    error: "Error al cargar NFTs",
    connectWallet: "Conecta tu billetera para ver tus NFTs",
    viewImage: "Ver Imagen",
    viewMetadata: "Ver Metadatos",
    viewTransaction: "Ver Transacción",
    viewCollection: "Ver Colección",
    viewOnOpenSea: "Ver en OpenSea",
    copyHash: "Copiar Hash",
    copied: "¡Copiado!",
    copiedDesc: "Hash copiado al portapapeles",
    retry: "Reintentar",
    noFilterResults: "No se encontraron NFTs",
    noFilterResultsDesc: "Ningún NFT coincide con el filtro seleccionado.",
    showAllNfts: "Mostrar Todos los NFTs"
  },
  fr: {
    title: "Ma Collection",
    filterOptions: [
      { value: "all", label: "Tous" },
      { value: "created", label: "Créés par moi" },
      { value: "collected", label: "Collectionnés" }
    ],
    sortOptions: [
      { value: "newest", label: "Plus récents d'abord" },
      { value: "oldest", label: "Plus anciens d'abord" },
      { value: "price-high", label: "Prix: Élevé à Bas" },
      { value: "price-low", label: "Prix: Bas à Élevé" }
    ],
    minted: "Frappé",
    details: "Détails",
    new: "Nouveau",
    noNftsTitle: "Pas encore de NFTs",
    noNftsDescription: "Vous n'avez pas encore frappé ou collectionné de NFTs.",
    createFirstNft: "Créez Votre Premier NFT",
    loading: "Chargement de vos NFTs...",
    error: "Échec du chargement des NFTs",
    connectWallet: "Connectez votre portefeuille pour voir vos NFTs",
    viewImage: "Voir l'Image",
    viewMetadata: "Voir les Métadonnées",
    viewTransaction: "Voir la Transaction",
    viewCollection: "Voir la Collection",
    viewOnOpenSea: "Voir sur OpenSea",
    copyHash: "Copier le Hash",
    copied: "Copié!",
    copiedDesc: "Hash copié dans le presse-papiers",
    retry: "Réessayer",
    noFilterResults: "Aucun NFT trouvé",
    noFilterResultsDesc: "Aucun NFT ne correspond au filtre sélectionné.",
    showAllNfts: "Afficher Tous les NFTs"
  },
  pt: {
    title: "Minha Coleção",
    filterOptions: [
      { value: "all", label: "Todos" },
      { value: "created", label: "Criados por mim" },
      { value: "collected", label: "Colecionados" }
    ],
    sortOptions: [
      { value: "newest", label: "Mais recentes primeiro" },
      { value: "oldest", label: "Mais antigos primeiro" },
      { value: "price-high", label: "Preço: Alto para Baixo" },
      { value: "price-low", label: "Preço: Baixo para Alto" }
    ],
    minted: "Cunhado",
    details: "Detalhes",
    new: "Novo",
    noNftsTitle: "Ainda Sem NFTs",
    noNftsDescription: "Você ainda não cunhou ou colecionou nenhum NFT.",
    createFirstNft: "Crie Seu Primeiro NFT",
    loading: "Carregando seus NFTs...",
    error: "Falha ao carregar NFTs",
    connectWallet: "Conecte sua carteira para ver seus NFTs",
    viewImage: "Ver Imagem",
    viewMetadata: "Ver Metadados",
    viewTransaction: "Ver Transação",
    viewCollection: "Ver Coleção",
    viewOnOpenSea: "Ver no OpenSea",
    copyHash: "Copiar Hash",
    copied: "Copiado!",
    copiedDesc: "Hash copiado para área de transferência",
    retry: "Tentar Novamente",
    noFilterResults: "Nenhum NFT encontrado",
    noFilterResultsDesc: "Nenhum NFT corresponde ao filtro selecionado.",
    showAllNfts: "Mostrar Todos os NFTs"
  }
}

// NFT data structure
interface NFT {
  id: string
  name: string
  description: string
  image_ipfs_hash: string
  metadata_ipfs_hash: string
  transaction_hash: string
  network: string
  royalty_percentage: number
  created_at: string
  contract_address?: string
  token_id?: number
  source?: 'user_created' | 'claimable'
}

export default function MyNFTsPage() {
  const params = useParams()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [t, setT] = useState(translations.en)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const highlightedNftId = searchParams.get("highlight")
  const refreshParam = searchParams.get("refresh")
  
  const { address, isConnected } = useAccount()
  const { toast } = useToast()

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
    setT(translations[currentLocale as keyof typeof translations] || translations.en)
  }, [params])

  // Fetch NFTs when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchNFTs()
    } else {
      setLoading(false)
      setNfts([])
    }
  }, [isConnected, address])

  // Refetch NFTs when page becomes visible (e.g., when navigating back from create page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isConnected && address) {
        fetchNFTs()
      }
    }

    const handleFocus = () => {
      if (isConnected && address) {
        fetchNFTs()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isConnected, address])

  // Also refetch when highlighted NFT changes or refresh param is present
  useEffect(() => {
    if ((highlightedNftId || refreshParam) && isConnected && address) {
      // Small delay to ensure the new NFT is in the database
      setTimeout(() => fetchNFTs(), 1000)
    }
  }, [highlightedNftId, refreshParam, isConnected, address])

  const fetchNFTs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/nfts?wallet_address=${address}`)
      const data = await response.json()
      
      if (response.ok) {
        setNfts(data.nfts || [])
        setError('')
      } else {
        setError(data.error || t.error)
      }
    } catch (err) {
      console.error('Error fetching NFTs:', err)
      setError(t.error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: t.copied,
        description: t.copiedDesc,
      })
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const getBlockExplorerUrl = (txHash: string, network: string) => {
    const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
    if (network?.toLowerCase().includes('base')) {
      return isTestingMode 
        ? `https://sepolia.basescan.org/tx/${txHash}`
        : `https://basescan.org/tx/${txHash}`
    } else {
      return isTestingMode
        ? `https://sepolia.explorer.zora.energy/tx/${txHash}`
        : `https://explorer.zora.energy/tx/${txHash}`
    }
  }

  const getBlockscoutCollectionUrl = (contractAddress: string, network: string) => {
    const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
    if (network?.toLowerCase().includes('base')) {
      return isTestingMode 
        ? `https://base-sepolia.blockscout.com/address/${contractAddress}`
        : `https://base.blockscout.com/address/${contractAddress}`
    } else {
      return isTestingMode
        ? `https://zora-sepolia.blockscout.com/address/${contractAddress}`
        : `https://zora.blockscout.com/address/${contractAddress}`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    })
  }

  // Helper function to get the correct image URL for display
  const getImageUrl = (nft: NFT) => {
    // Check if image_ipfs_hash contains a Firebase Storage URL
    if (nft.image_ipfs_hash && nft.image_ipfs_hash.includes('firebasestorage.googleapis.com')) {
      return nft.image_ipfs_hash // Direct Firebase Storage URL
    }
    
    // Check if image_ipfs_hash is already a full gateway URL
    if (nft.image_ipfs_hash && nft.image_ipfs_hash.startsWith('https://')) {
      return nft.image_ipfs_hash // Direct gateway URL
    }
    
    // Check if image_ipfs_hash uses ipfs:// protocol
    if (nft.image_ipfs_hash && nft.image_ipfs_hash.startsWith('ipfs://')) {
      // Extract the hash from ipfs:// URL and convert to gateway URL
      const hash = nft.image_ipfs_hash.replace('ipfs://', '')
      return `https://gateway.pinata.cloud/ipfs/${hash}`
    }
    
    // If the image_ipfs_hash is a valid IPFS hash (not placeholder), use IPFS
    if (nft.image_ipfs_hash && nft.image_ipfs_hash !== 'QmcEs17g1UJvppq71hC8ssxVQLYXMQPnpnJm7o6eQ41s4L') {
      return `https://gateway.pinata.cloud/ipfs/${nft.image_ipfs_hash}`
    }
    
    // Fallback to placeholder for any remaining NFTs with placeholder hashes
    return '/placeholder.svg'
  }

  // Filter options
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  
  // Filter and sort NFTs based on current selections
  const filteredAndSortedNfts = nfts
    .filter((nft) => {
      switch (selectedFilter) {
        case "all":
          return true
        case "created":
          // NFTs created by the user through the platform
          return nft.source === 'user_created'
        case "collected":
          // NFTs minted/claimed through claimable NFT system
          return nft.source === 'claimable'
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price-high":
        case "price-low":
          // Future enhancement: implement price sorting when price field is added
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  
  // Get current sort option
  const currentSortOption = t.sortOptions.find((option) => option.value === sortBy)

  if (!isConnected) {
    return (
      <div className="pb-16">
        <div className="p-4 border-b">
          <h1 className="text-xl md:text-2xl font-bold text-center mt-10">{t.title}</h1>
        </div>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-7xl">
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-2">{t.connectWallet}</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl md:text-2xl font-bold text-center mt-10">{t.title}</h1>
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-7xl">
        <div className="mb-6 md:mb-8">
          <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-full">
            <TabsList className="grid grid-cols-3 gap-1 h-auto p-1 max-w-lg mx-auto">
              {t.filterOptions.map((option) => (
                <TabsTrigger 
                  key={option.value} 
                  value={option.value} 
                  className="text-xs md:text-sm px-2 py-2 data-[state=active]:bg-[#FF69B4] data-[state=active]:text-white"
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Controls - Desktop Optimized */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
          <div className="flex items-center justify-between md:justify-start gap-4">
            <span className="text-sm md:text-base text-gray-600">
              {filteredAndSortedNfts.length} of {nfts.length} NFTs
            </span>
            
            {/* View Mode Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 md:h-10 md:w-10 p-0 ${viewMode === "grid" ? "bg-[#FF69B4] hover:bg-[#FF1493]" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 md:h-10 md:w-10 p-0 ${viewMode === "list" ? "bg-[#FF69B4] hover:bg-[#FF1493]" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 text-sm md:text-base h-8 md:h-10 px-3 md:px-4">
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{currentSortOption?.label}</span>
                <span className="sm:hidden">Sort</span>
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {t.sortOptions.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => setSortBy(option.value)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchNFTs} variant="outline">
              {t.retry}
            </Button>
          </div>
        ) : nfts.length > 0 ? (
          <>
            {filteredAndSortedNfts.length > 0 ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" : "space-y-4 md:space-y-6"}>
                {filteredAndSortedNfts.map((nft) => (
              <Card
                key={nft.id}
                className={`overflow-hidden hover:shadow-lg transition-shadow ${
                  highlightedNftId === nft.id ? "border-[#9ACD32] border-2 shadow-lg" : ""
                }`}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-square relative">
                      <Image 
                        src={getImageUrl(nft)} 
                        alt={nft.name} 
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg'
                        }}
                      />
                      {highlightedNftId === nft.id && (
                        <Badge className="absolute top-2 right-2 bg-[#9ACD32]">{t.new}</Badge>
                      )}
                    </div>
                    <CardContent className="p-3 md:p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm md:text-base truncate pr-2">{nft.name}</h3>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">{nft.network}</Badge>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 mb-2">{t.minted} {formatDate(nft.created_at)}</p>
                      <p className="text-xs md:text-sm text-gray-600 mb-3 line-clamp-2" title={nft.description}>{nft.description}</p>
                      
                      {/* Transaction and Collection Info */}
                      <div className="space-y-1 md:space-y-2 mb-3">
                        {nft.contract_address && (
                          <div className="text-xs md:text-sm text-blue-600">
                            <span className="font-medium">Collection:</span>
                            <span className="font-mono ml-1 break-all">{nft.contract_address.slice(0, 10)}...{nft.contract_address.slice(-8)}</span>
                          </div>
                        )}
                        <div className="text-xs md:text-sm text-gray-500">
                          <span className="font-medium">TX:</span>
                          <span className="font-mono ml-1">{nft.transaction_hash.slice(0, 10)}...{nft.transaction_hash.slice(-8)}</span>
                        </div>
                      </div>

                      {/* Action Buttons - Responsive Design */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs md:text-sm px-2 md:px-3 py-2 h-8 md:h-9 flex-1"
                            onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${nft.image_ipfs_hash}`, '_blank')}
                          >
                            <span className="hidden md:inline">{t.viewImage}</span>
                            <span className="md:hidden">Image</span>
                          </Button>
                          {nft.metadata_ipfs_hash && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs md:text-sm px-2 md:px-3 py-2 h-8 md:h-9 flex-1"
                              onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${nft.metadata_ipfs_hash}`, '_blank')}
                            >
                              <span className="hidden md:inline">{t.viewMetadata}</span>
                              <span className="md:hidden">Meta</span>
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {nft.transaction_hash && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs md:text-sm px-2 md:px-3 py-2 h-8 md:h-9 flex-1"
                              onClick={() => window.open(getBlockExplorerUrl(nft.transaction_hash, nft.network), '_blank')}
                            >
                              <span className="hidden md:inline">{t.viewTransaction}</span>
                              <span className="md:hidden">TX</span>
                            </Button>
                          )}
                          {nft.contract_address && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs md:text-sm px-2 md:px-3 py-2 h-8 md:h-9 flex-1"
                              onClick={() => nft.contract_address && window.open(getBlockscoutCollectionUrl(nft.contract_address, nft.network), '_blank')}
                            >
                              <span className="hidden md:inline">{t.viewCollection}</span>
                              <span className="md:hidden">Collection</span>
                            </Button>
                          )}
                        </div>
                        {/* OpenSea button - only show if we can generate a link */}
                        {(() => {
                          const openSeaLink = getOpenSeaLinkFromNFT(nft)
                          return openSeaLink ? (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="text-xs md:text-sm px-2 md:px-3 py-2 h-8 md:h-9 w-full bg-[#2081E2] hover:bg-[#1868B7] text-white"
                              onClick={() => window.open(openSeaLink, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              <span>{t.viewOnOpenSea}</span>
                            </Button>
                          ) : null
                        })()}
                      </div>
                    </CardContent>
                  </>
                ) : (
                  /* List View - Enhanced for Desktop */
                  <div className="flex p-3 md:p-4 gap-3 md:gap-4">
                    <div className="relative h-16 w-16 md:h-24 md:w-24 rounded-md overflow-hidden flex-shrink-0">
                      <Image 
                        src={getImageUrl(nft)} 
                        alt={nft.name} 
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg'
                        }}
                      />
                      {highlightedNftId === nft.id && (
                        <Badge className="absolute top-1 right-1 bg-[#9ACD32] text-xs">{t.new}</Badge>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start mb-1 md:mb-2">
                        <h3 className="font-semibold text-sm md:text-base truncate pr-2">{nft.name}</h3>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">{nft.network}</Badge>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 line-clamp-2">{nft.description}</p>
                      <p className="text-xs md:text-sm text-gray-500 mb-2 md:mb-3">{t.minted} {formatDate(nft.created_at)}</p>
                      
                      {/* Transaction and Collection Info for List View */}
                      <div className="hidden md:block space-y-1 mb-3">
                        {nft.contract_address && (
                          <div className="text-sm text-blue-600">
                            <span className="font-medium">Collection:</span>
                            <span className="font-mono ml-1">{nft.contract_address.slice(0, 10)}...{nft.contract_address.slice(-8)}</span>
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">TX:</span>
                          <span className="font-mono ml-1">{nft.transaction_hash.slice(0, 10)}...{nft.transaction_hash.slice(-8)}</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons for List View */}
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 h-7 md:h-8"
                          onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${nft.image_ipfs_hash}`, '_blank')}
                        >
                          <span className="hidden md:inline">{t.viewImage}</span>
                          <span className="md:hidden">Image</span>
                        </Button>
                        {nft.transaction_hash && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 h-7 md:h-8"
                            onClick={() => window.open(getBlockExplorerUrl(nft.transaction_hash, nft.network), '_blank')}
                          >
                            <span className="hidden md:inline">{t.viewTransaction}</span>
                            <span className="md:hidden">TX</span>
                          </Button>
                        )}
                        {nft.metadata_ipfs_hash && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 h-7 md:h-8"
                            onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${nft.metadata_ipfs_hash}`, '_blank')}
                          >
                            <span className="hidden md:inline">{t.viewMetadata}</span>
                            <span className="md:hidden">Meta</span>
                          </Button>
                        )}
                        {nft.contract_address && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 h-7 md:h-8"
                            onClick={() => nft.contract_address && window.open(getBlockscoutCollectionUrl(nft.contract_address, nft.network), '_blank')}
                          >
                            <span className="hidden md:inline">{t.viewCollection}</span>
                            <span className="md:hidden">Collection</span>
                          </Button>
                        )}
                        {(() => {
                          const openSeaLink = getOpenSeaLinkFromNFT(nft)
                          return openSeaLink ? (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 h-7 md:h-8 bg-[#2081E2] hover:bg-[#1868B7] text-white"
                              onClick={() => window.open(openSeaLink, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              <span className="hidden md:inline">{t.viewOnOpenSea}</span>
                              <span className="md:hidden">OpenSea</span>
                            </Button>
                          ) : null
                        })()}
                      </div>
                    </div>
                  </div>
                )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 md:py-16">
                <h2 className="text-xl md:text-2xl font-semibold mb-2">{t.noFilterResults}</h2>
                <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">{t.noFilterResultsDesc}</p>
                <Button 
                  onClick={() => setSelectedFilter("all")} 
                  variant="outline"
                  className="h-10 md:h-12 px-4 md:px-6"
                >
                  {t.showAllNfts}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 md:py-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">{t.noNftsTitle}</h2>
            <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">{t.noNftsDescription}</p>
            <Button className="bg-[#9ACD32] hover:bg-[#7CFC00] h-10 md:h-12 px-4 md:px-6">{t.createFirstNft}</Button>
          </div>
        )}
      </div>
    </div>
  )
} 