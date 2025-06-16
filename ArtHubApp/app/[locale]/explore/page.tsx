"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { Search, TrendingUp, Users, Tag, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Confetti from "@/components/confetti"
import { useRouter, useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"

// Types for NFT data
type NFT = {
  id: string
  name: string
  description: string
  artist_name: string
  category: string
  image_ipfs_hash: string
  wallet_address: string
  created_at: string
  view_count: number
  likes_count: number
}

type Artist = {
  artist_name: string
  nft_count: number
  avatar?: string
}

// Translation content
const translations = {
  en: {
    title: "Explore",
    searchPlaceholder: "Search NFTs, artists, or collections...",
    searchButton: "Search",
    trending: "Trending",
    latest: "Latest",
    popular: "Popular",
    artists: "Artists",
    categories: "Categories",
    allCategories: "All Categories",
    sortBy: "Sort by",
    loading: "Loading...",
    noResults: "No NFTs found",
    trendingNFTs: "Trending NFTs",
    viewMore: "View More",
    mintNFT: "Mint NFT",
    by: "by",
    popularArtists: "Popular Artists",
    nftsCreated: "NFTs created",
    follow: "Follow",
    browseCategories: "Browse Categories",
    items: "items",
    mintingNFT: "Minting NFT",
    mintingDescription: "Please wait while we mint your NFT on the Base blockchain...",
    mintingProgress: "Minting progress",
    processingTransaction: "Processing transaction...",
    congratulations: "Congratulations!",
    nftSuccess: "Your NFT has been successfully minted on the Base blockchain.",
    viewInCollection: "View in My Collection"
  },
  es: {
    title: "Explorar",
    searchPlaceholder: "Buscar NFTs, artistas o colecciones...",
    searchButton: "Buscar",
    trending: "Tendencias",
    latest: "Últimos",
    popular: "Populares",
    artists: "Artistas",
    categories: "Categorías",
    allCategories: "Todas las Categorías",
    sortBy: "Ordenar por",
    loading: "Cargando...",
    noResults: "No se encontraron NFTs",
    trendingNFTs: "NFTs en Tendencia",
    viewMore: "Ver Más",
    mintNFT: "Acuñar NFT",
    by: "por",
    popularArtists: "Artistas Populares",
    nftsCreated: "NFTs creados",
    follow: "Seguir",
    browseCategories: "Explorar Categorías",
    items: "elementos",
    mintingNFT: "Acuñando NFT",
    mintingDescription: "Por favor espera mientras acuñamos tu NFT en la blockchain Base...",
    mintingProgress: "Progreso de acuñación",
    processingTransaction: "Procesando transacción...",
    congratulations: "¡Felicidades!",
    nftSuccess: "Tu NFT ha sido acuñado exitosamente en la blockchain Base.",
    viewInCollection: "Ver en Mi Colección"
  },
  fr: {
    title: "Explorer",
    searchPlaceholder: "Rechercher des NFTs, artistes ou collections...",
    searchButton: "Rechercher",
    trending: "Tendances",
    latest: "Dernières",
    popular: "Populaires",
    artists: "Artistes",
    categories: "Catégories",
    allCategories: "Toutes les Catégories",
    sortBy: "Trier par",
    loading: "Chargement...",
    noResults: "Aucun NFT trouvé",
    trendingNFTs: "NFTs Tendance",
    viewMore: "Voir Plus",
    mintNFT: "Frapper le NFT",
    by: "par",
    popularArtists: "Artistes Populaires",
    nftsCreated: "NFTs créés",
    follow: "Suivre",
    browseCategories: "Parcourir les Catégories",
    items: "éléments",
    mintingNFT: "Frappe de NFT",
    mintingDescription: "Veuillez patienter pendant que nous frappons votre NFT sur la blockchain Base...",
    mintingProgress: "Progression de la frappe",
    processingTransaction: "Transaction en cours...",
    congratulations: "Félicitations !",
    nftSuccess: "Votre NFT a été frappé avec succès sur la blockchain Base.",
    viewInCollection: "Voir dans Ma Collection"
  },
  pt: {
    title: "Explorar",
    searchPlaceholder: "Pesquisar NFTs, artistas ou coleções...",
    searchButton: "Pesquisar",
    trending: "Tendências",
    latest: "Últimos",
    popular: "Populares",
    artists: "Artistas",
    categories: "Categorias",
    allCategories: "Todas as Categorias",
    sortBy: "Ordenar por",
    loading: "Carregando...",
    noResults: "Nenhum NFT encontrado",
    trendingNFTs: "NFTs em Tendência",
    viewMore: "Ver Mais",
    mintNFT: "Cunhar NFT",
    by: "por",
    popularArtists: "Artistas Populares",
    nftsCreated: "NFTs criados",
    follow: "Seguir",
    browseCategories: "Navegar por Categorias",
    items: "itens",
    mintingNFT: "Cunhando NFT",
    mintingDescription: "Aguarde enquanto cunhamos seu NFT na blockchain Base...",
    mintingProgress: "Progresso da cunhagem",
    processingTransaction: "Processando transação...",
    congratulations: "Parabéns!",
    nftSuccess: "Seu NFT foi cunhado com sucesso na blockchain Base.",
    viewInCollection: "Ver em Minha Coleção"
  }
}

// Available categories for filtering
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

export default function ExplorePage() {
  const params = useParams()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [t, setT] = useState(translations.en)
  const router = useRouter()
  
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [activeTab, setActiveTab] = useState("trending")
  
  // Data state
  const [nfts, setNfts] = useState<NFT[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [categoriesWithCount, setCategoriesWithCount] = useState<Array<{name: string, count: number}>>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  
  // Modal state for NFT viewing (replacing minting simulation)
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
    setT(translations[currentLocale as keyof typeof translations] || translations.en)
  }, [params])

  // Fetch NFTs from API
  const fetchNFTs = async (reset = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: reset ? '0' : offset.toString(),
        sortBy: activeTab === 'trending' ? 'trending' : activeTab === 'popular' ? 'popular' : 'latest'
      })
      
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      
      const response = await fetch(`/api/nfts?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (reset) {
          setNfts(data.nfts)
          setOffset(20)
        } else {
          setNfts(prev => [...prev, ...data.nfts])
          setOffset(prev => prev + 20)
        }
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Failed to fetch NFTs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch artists (aggregated from NFTs)
  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/nfts?limit=1000') // Get all to aggregate
      if (response.ok) {
        const data = await response.json()
        const artistMap = new Map<string, number>()
        
        data.nfts.forEach((nft: NFT) => {
          if (nft.artist_name) {
            artistMap.set(nft.artist_name, (artistMap.get(nft.artist_name) || 0) + 1)
          }
        })
        
        const sortedArtists = Array.from(artistMap.entries())
          .map(([name, count]) => ({ artist_name: name, nft_count: count }))
          .sort((a, b) => b.nft_count - a.nft_count)
          .slice(0, 10) // Top 10 artists
        
        setArtists(sortedArtists)
      }
    } catch (error) {
      console.error('Failed to fetch artists:', error)
    }
  }

  // Fetch categories with counts
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/nfts?limit=1000') // Get all to count categories
      if (response.ok) {
        const data = await response.json()
        const categoryMap = new Map<string, number>()
        
        data.nfts.forEach((nft: NFT) => {
          if (nft.category) {
            categoryMap.set(nft.category, (categoryMap.get(nft.category) || 0) + 1)
          }
        })
        
        const sortedCategories = Array.from(categoryMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
        
        setCategoriesWithCount(sortedCategories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  // Load initial data
  useEffect(() => {
    fetchNFTs(true)
    fetchArtists()
    fetchCategories()
  }, [activeTab, selectedCategory, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchNFTs(true)
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    setOffset(0)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setOffset(0)
  }

  const viewNFT = (nft: NFT) => {
    setSelectedNFT(nft)
  }

  const closeNFTDialog = () => {
    setSelectedNFT(null)
  }

  // Helper function to get IPFS image URL
  const getImageUrl = (ipfsHash: string) => {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
  }

  return (
    <div className="pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl md:text-2xl font-bold text-center mt-10">{t.title}</h1>
      </div>

      {showConfetti && <Confetti />}

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-7xl">
        <form onSubmit={handleSearch} className="mb-6 md:mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="pl-10 h-12 md:h-14 text-base"
            />
            <Button
              type="submit"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#FF69B4] hover:bg-[#FF1493] h-10 md:h-12 px-4 md:px-6"
            >
              {t.searchButton}
            </Button>
          </div>
        </form>

        {/* Filters */}
        <div className="mb-6 md:mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">{t.categories}</label>
              <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
                <SelectTrigger className="h-10 md:h-12">
                  <SelectValue placeholder={t.allCategories} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allCategories}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8 max-w-md mx-auto">
            <TabsTrigger value="trending" className="flex items-center gap-1 text-xs md:text-sm">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
              <span>{t.trending}</span>
            </TabsTrigger>
            <TabsTrigger value="artists" className="flex items-center gap-1 text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span>{t.artists}</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1 text-xs md:text-sm">
              <Tag className="h-3 w-3 md:h-4 md:w-4" />
              <span>{t.categories}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t.trendingNFTs}</h2>
            
            {loading && nfts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>{t.loading}</span>
              </div>
            ) : nfts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t.noResults}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {nfts.map((nft) => (
                    <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square md:aspect-[4/3] relative">
                        <Image 
                          src={getImageUrl(nft.image_ipfs_hash)} 
                          alt={nft.name} 
                          fill 
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg"
                          }}
                        />
                      </div>
                      <CardContent className="p-3 md:p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm md:text-base truncate">{nft.name}</h3>
                            <p className="text-xs md:text-sm text-gray-500 truncate">{t.by} {nft.artist_name}</p>
                            <p className="text-xs text-gray-400">{nft.category}</p>
                            {nft.view_count > 0 && (
                              <p className="text-xs text-blue-500">{nft.view_count} views</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          className="w-full bg-[#9ACD32] hover:bg-[#7CFC00] text-sm md:text-base" 
                          size="sm"
                          onClick={() => viewNFT(nft)}
                        >
                          View NFT
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {hasMore && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => fetchNFTs(false)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.loading}
                      </>
                    ) : (
                      t.viewMore
                    )}
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="artists" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t.popularArtists}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artists.map((artist) => (
                <Card key={artist.artist_name} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 md:h-16 md:w-16 rounded-full overflow-hidden bg-gradient-to-br from-[#FF69B4] to-[#9ACD32] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm md:text-lg">
                          {artist.artist_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base truncate">{artist.artist_name}</h3>
                        <p className="text-xs md:text-sm text-gray-500">{artist.nft_count} {t.nftsCreated}</p>
                      </div>
                      <Button 
                        className="bg-[#9ACD32] hover:bg-[#7CFC00] flex-shrink-0" 
                        size="sm"
                        onClick={() => {
                          handleCategoryFilter('all')
                          setSearchQuery(artist.artist_name)
                          handleTabChange('trending')
                        }}
                      >
                        <span className="hidden md:inline">View Works</span>
                        <span className="md:hidden">View</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t.browseCategories}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categoriesWithCount.map((category) => (
                <Card 
                  key={category.name} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    handleCategoryFilter(category.name)
                    handleTabChange('trending')
                  }}
                >
                  <CardContent className="p-3 md:p-4">
                    <h3 className="font-semibold text-sm md:text-base">{category.name}</h3>
                    <p className="text-xs md:text-sm text-gray-500">{category.count} {t.items}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* NFT Detail Dialog */}
      <Dialog open={selectedNFT !== null} onOpenChange={closeNFTDialog}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
          {selectedNFT && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">{selectedNFT.name}</DialogTitle>
                <DialogDescription className="text-sm md:text-base">
                  {t.by} {selectedNFT.artist_name} • {selectedNFT.category}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 md:py-6">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="relative w-full max-w-sm md:max-w-md aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={getImageUrl(selectedNFT.image_ipfs_hash)}
                      alt={selectedNFT.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg"
                      }}
                    />
                  </div>
                  <div className="text-center w-full">
                    <h3 className="font-semibold text-lg md:text-xl">{selectedNFT.name}</h3>
                    <p className="text-sm md:text-base text-gray-500">{t.by} {selectedNFT.artist_name}</p>
                    <p className="text-xs md:text-sm text-gray-400 mt-1">{selectedNFT.category}</p>
                    {selectedNFT.description && (
                      <p className="text-sm md:text-base text-gray-600 mt-2 px-2">{selectedNFT.description}</p>
                    )}
                    <div className="flex justify-center gap-4 mt-4 text-xs md:text-sm text-gray-500">
                      {selectedNFT.view_count > 0 && (
                        <span>{selectedNFT.view_count} views</span>
                      )}
                      {selectedNFT.likes_count > 0 && (
                        <span>{selectedNFT.likes_count} likes</span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-gray-400 mt-2">
                      Created on {new Date(selectedNFT.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      window.open(getImageUrl(selectedNFT.image_ipfs_hash), '_blank')
                    }}
                  >
                    View Full Size
                  </Button>
                  <Button 
                    className="flex-1 bg-[#9ACD32] hover:bg-[#7CFC00]" 
                    onClick={closeNFTDialog}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 