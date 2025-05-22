"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { Search, TrendingUp, Users, Tag, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Confetti from "@/components/confetti"
import { useRouter, useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"

// Translation content
const translations = {
  en: {
    title: "Explore",
    searchPlaceholder: "Search NFTs, artists, or collections...",
    searchButton: "Search",
    trending: "Trending",
    artists: "Artists",
    categories: "Categories",
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
    artists: "Artistas",
    categories: "Categorías",
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
    artists: "Artistes",
    categories: "Catégories",
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
    artists: "Artistas",
    categories: "Categorias",
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

// Sample data for trending NFTs
const trendingNFTs = [
  {
    id: "1",
    title: "Digital Dreams",
    artist: "Maria Rodriguez",
    image: "/colorful-abstract-digital-art.png",
    price: "0.05 ETH",
  },
  {
    id: "2",
    title: "Neon Jungle",
    artist: "Carlos Mendez",
    image: "/neon-jungle-animals.png",
    price: "0.08 ETH",
  },
  {
    id: "3",
    title: "Cosmic Voyage",
    artist: "Ana Sofia",
    image: "/space-nebula-with-planets.png",
    price: "0.12 ETH",
  },
]

// Sample data for artists
const artists = [
  {
    id: "1",
    name: "Maria Rodriguez",
    avatar: "/abstract-expressionist-painting.png",
    nfts: 12,
  },
  {
    id: "2",
    name: "Carlos Mendez",
    avatar: "/placeholder-74z4w.png",
    nfts: 8,
  },
  {
    id: "3",
    name: "Ana Sofia",
    avatar: "/abstract-geometric-art.png",
    nfts: 15,
  },
]

// Sample data for categories
const categories = [
  { id: "1", name: "Digital Art", count: 245 },
  { id: "2", name: "Illustrations", count: 189 },
  { id: "3", name: "Photography", count: 132 },
  { id: "4", name: "3D Art", count: 97 },
  { id: "5", name: "Pixel Art", count: 76 },
  { id: "6", name: "Animation", count: 54 },
]

export default function ExplorePage() {
  const params = useParams()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [t, setT] = useState(translations.en)
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [mintingNFT, setMintingNFT] = useState<null | (typeof trendingNFTs)[0]>(null)
  const [mintingStep, setMintingStep] = useState(0)
  const [mintingProgress, setMintingProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
    setT(translations[currentLocale as keyof typeof translations] || translations.en)
  }, [params])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would trigger a search API call
    console.log("Searching for:", searchQuery)
  }

  const startMinting = (nft: (typeof trendingNFTs)[0]) => {
    setMintingNFT(nft)
    setMintingStep(1)
    setMintingProgress(0)

    // Simulate the minting process
    const interval = setInterval(() => {
      setMintingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setMintingStep(2) // Move to success state
            setShowConfetti(true)

            // Hide confetti after a few seconds
            setTimeout(() => {
              setShowConfetti(false)
            }, 5000)
          }, 500)
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  const closeMintingDialog = () => {
    if (mintingNFT) {
      // Navigate to My Collection page with the newly minted NFT highlighted
      router.push(`/${locale}/my-nfts?highlight=${mintingNFT.id}`)
    }
    setMintingNFT(null)
    setMintingStep(0)
    setMintingProgress(0)
  }

  return (
    <div className="pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">{t.title}</h1>
      </div>

      {showConfetti && <Confetti />}

      <div className="container mx-auto px-4 py-4">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="pl-10"
            />
            <Button
              type="submit"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#FF69B4] hover:bg-[#FF1493] h-8 px-3"
            >
              {t.searchButton}
            </Button>
          </div>
        </form>

        <Tabs defaultValue="trending">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="trending" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{t.trending}</span>
            </TabsTrigger>
            <TabsTrigger value="artists" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{t.artists}</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              <span>{t.categories}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t.trendingNFTs}</h2>
            <div className="grid grid-cols-1 gap-4">
              {trendingNFTs.map((nft) => (
                <Card key={nft.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <Image src={nft.image || "/placeholder.svg"} alt={nft.title} fill className="object-cover" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{nft.title}</h3>
                        <p className="text-sm text-gray-500">{t.by} {nft.artist}</p>
                      </div>
                      <span className="text-sm font-medium text-[#FF69B4]">{nft.price}</span>
                    </div>
                    <Button className="w-full bg-[#9ACD32] hover:bg-[#7CFC00]" onClick={() => startMinting(nft)}>
                      {t.mintNFT}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full">
              {t.viewMore}
            </Button>
          </TabsContent>

          <TabsContent value="artists" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t.popularArtists}</h2>
            <div className="grid grid-cols-1 gap-4">
              {artists.map((artist) => (
                <Card key={artist.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden">
                        <Image
                          src={artist.avatar || "/placeholder.svg"}
                          alt={artist.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{artist.name}</h3>
                        <p className="text-sm text-gray-500">{artist.nfts} {t.nftsCreated}</p>
                      </div>
                      <Button className="ml-auto bg-[#9ACD32] hover:bg-[#7CFC00]" size="sm">
                        {t.follow}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full">
              {t.viewMore}
            </Button>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{t.browseCategories}</h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.count} {t.items}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Minting Dialog */}
      <Dialog open={mintingNFT !== null} onOpenChange={() => mintingStep === 2 && closeMintingDialog()}>
        <DialogContent className="sm:max-w-md">
          {mintingStep === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>{t.mintingNFT}</DialogTitle>
                <DialogDescription>{t.mintingDescription}</DialogDescription>
              </DialogHeader>
              <div className="py-6">
                {mintingNFT && (
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                      <Image
                        src={mintingNFT.image || "/placeholder.svg"}
                        alt={mintingNFT.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{mintingNFT.title}</h3>
                      <p className="text-sm text-gray-500">{t.by} {mintingNFT.artist}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>{t.mintingProgress}</span>
                    <span>{mintingProgress}%</span>
                  </div>
                  <Progress value={mintingProgress} className="h-2" />
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.processingTransaction}
                  </div>
                </div>
              </div>
            </>
          )}

          {mintingStep === 2 && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-[#9ACD32]">{t.congratulations}</DialogTitle>
                <DialogDescription className="text-center">
                  {t.nftSuccess}
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                {mintingNFT && (
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative h-40 w-40 rounded-lg overflow-hidden border-4 border-[#9ACD32]">
                      <Image
                        src={mintingNFT.image || "/placeholder.svg"}
                        alt={mintingNFT.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-lg">{mintingNFT.title}</h3>
                      <p className="text-sm text-gray-500">{t.by} {mintingNFT.artist}</p>
                      <p className="text-[#FF69B4] font-medium mt-2">{mintingNFT.price}</p>
                    </div>
                  </div>
                )}
                <Button className="w-full bg-[#9ACD32] hover:bg-[#7CFC00]" onClick={closeMintingDialog}>
                  {t.viewInCollection}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 