"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import { type Opportunity, type Community } from "@/lib/firebase"
import {
  ArrowRight,
  ExternalLink,
  Calendar,
  DollarSign,
  Palette,
  Sparkles,
  Users,
  Award,
  Search,
  MapPin,
  Star,
} from "lucide-react"

// Translation content
const translations = {
  en: {
    title: "Opportunities",
    subtitle: "Opportunities for Artists",
    description: "Discover how blockchain technology is creating new possibilities for artists to monetize, distribute, and protect their creative work.",
    heroTitle: "Transform Your Creative Career",
    heroDescription: "Web3 is revolutionizing how artists create, sell, and connect with audiences worldwide.",
    getStarted: "Get Started Today",
    tabNfts: "NFTs",
    tabCommunities: "Communities",
    tabOpportunities: "Opportunities",
    nftsTitle: "NFT Creation & Sales",
    nftsDescription: "Non-Fungible Tokens (NFTs) allow artists to tokenize their work, creating verifiable digital scarcity and ownership. This opens new revenue streams and ways to connect with collectors.",
    benefitsTitle: "Benefits for Artists",
    benefits: [
      "Earn royalties on secondary sales (typically 5-10%)",
      "Access global markets without intermediaries",
      "Build direct relationships with collectors"
    ],
    gettingStartedTitle: "Getting Started",
    gettingStarted: [
      "Set up a crypto wallet (like MetaMask)",
      "Choose an NFT marketplace (like Base)",
      "Create and mint your first NFT"
    ],
    startCreating: "Start Creating NFTs",
    readMore: "Read More",
    close: "Close"
  },
  es: {
    title: "Oportunidades",
    subtitle: "Oportunidades para Artistas",
    description: "Descubre cómo la tecnología blockchain está creando nuevas posibilidades para que los artistas moneticen, distribuyan y protejan su trabajo creativo.",
    heroTitle: "Transforma tu Carrera Creativa",
    heroDescription: "Web3 está revolucionando cómo los artistas crean, venden y se conectan con audiencias en todo el mundo.",
    getStarted: "Comienza Hoy",
    tabNfts: "NFTs",
    tabCommunities: "Comunidades",
    tabOpportunities: "Oportunidades",
    nftsTitle: "Creación y Venta de NFTs",
    nftsDescription: "Los Tokens No Fungibles (NFTs) permiten a los artistas tokenizar su trabajo, creando escasez digital verificable y propiedad. Esto abre nuevos flujos de ingresos y formas de conectarse con coleccionistas.",
    benefitsTitle: "Beneficios para Artistas",
    benefits: [
      "Gana regalías en ventas secundarias (típicamente 5-10%)",
      "Accede a mercados globales sin intermediarios",
      "Construye relaciones directas con coleccionistas"
    ],
    gettingStartedTitle: "Cómo Empezar",
    gettingStarted: [
      "Configura una billetera crypto (como MetaMask)",
      "Elige un mercado de NFTs (como Base)",
      "Crea y acuña tu primer NFT"
    ],
    startCreating: "Comienza a Crear NFTs",
    readMore: "Leer Más",
    close: "Cerrar"
  },
  fr: {
    title: "Opportunités",
    subtitle: "Opportunités pour les Artistes",
    description: "Découvrez comment la technologie blockchain crée de nouvelles possibilités pour les artistes de monétiser, distribuer et protéger leur travail créatif.",
    heroTitle: "Transformez Votre Carrière Créative",
    heroDescription: "Le Web3 révolutionne la façon dont les artistes créent, vendent et se connectent avec des audiences dans le monde entier.",
    getStarted: "Commencez Aujourd'hui",
    tabNfts: "NFTs",
    tabCommunities: "Communautés",
    tabOpportunities: "Opportunités",
    nftsTitle: "Création et Vente de NFTs",
    nftsDescription: "Les Tokens Non Fongibles (NFTs) permettent aux artistes de tokeniser leur travail, créant une rareté numérique vérifiable et une propriété. Cela ouvre de nouveaux flux de revenus et des façons de se connecter avec les collectionneurs.",
    benefitsTitle: "Avantages pour les Artistes",
    benefits: [
      "Gagnez des redevances sur les ventes secondaires (généralement 5-10%)",
      "Accédez aux marchés mondiaux sans intermédiaires",
      "Établissez des relations directes avec les collectionneurs"
    ],
    gettingStartedTitle: "Pour Commencer",
    gettingStarted: [
      "Configurez un portefeuille crypto (comme MetaMask)",
      "Choisissez une place de marché NFT (comme Base)",
      "Créez et frappez votre premier NFT"
    ],
    startCreating: "Commencez à Créer des NFTs",
    readMore: "Lire Plus",
    close: "Fermer"
  },
  pt: {
    title: "Oportunidades",
    subtitle: "Oportunidades para Artistas",
    description: "Descubra como a tecnologia blockchain está criando novas possibilidades para artistas monetizarem, distribuírem e protegerem seu trabalho criativo.",
    heroTitle: "Transforme Sua Carreira Criativa",
    heroDescription: "Web3 está revolucionando como os artistas criam, vendem e se conectam com audiências em todo o mundo.",
    getStarted: "Comece Hoje",
    tabNfts: "NFTs",
    tabCommunities: "Comunidades",
    tabOpportunities: "Oportunidades",
    nftsTitle: "Criação e Venda de NFTs",
    nftsDescription: "Tokens Não Fungíveis (NFTs) permitem que artistas tokenizem seu trabalho, criando escassez digital verificável e propriedade. Isso abre novos fluxos de receita e formas de se conectar com colecionadores.",
    benefitsTitle: "Benefícios para Artistas",
    benefits: [
      "Ganhe royalties em vendas secundárias (tipicamente 5-10%)",
      "Acesse mercados globais sem intermediários",
      "Construa relacionamentos diretos com colecionadores"
    ],
    gettingStartedTitle: "Como Começar",
    gettingStarted: [
      "Configure uma carteira crypto (como MetaMask)",
      "Escolha um mercado de NFTs (como Base)",
      "Crie e cunhe seu primeiro NFT"
    ],
    startCreating: "Comece a Criar NFTs",
    readMore: "Ler Mais",
    close: "Fechar"
  }
}

export default function OpportunitiesPage() {
  const params = useParams()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [t, setT] = useState(translations.en)
  
  // Opportunities state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [featuredOpportunities, setFeaturedOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Communities state
  const [communities, setCommunities] = useState<Community[]>([])
  const [communitiesLoading, setCommunitiesLoading] = useState(true)
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false)

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
    setT(translations[currentLocale as keyof typeof translations] || translations.en)
  }, [params])

  // Fetch opportunities and communities
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setCommunitiesLoading(true)
        
        // Fetch all active opportunities
        const allResponse = await fetch('/api/opportunities')
        const allResult = await allResponse.json()
        
        if (allResult.success) {
          setOpportunities(allResult.data)
        }
        
        // Fetch featured opportunities
        const featuredResponse = await fetch('/api/opportunities?featured=true&limit=3')
        const featuredResult = await featuredResponse.json()
        
        if (featuredResult.success) {
          setFeaturedOpportunities(featuredResult.data)
        }

        // Fetch published communities
        const communitiesResponse = await fetch('/api/communities')
        const communitiesResult = await communitiesResponse.json()
        
        if (communitiesResult.success) {
          setCommunities(communitiesResult.data)
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
        setCommunitiesLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter opportunities based on search and category
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.organization.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || opp.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Format amount for display
  const formatAmount = (opp: Opportunity) => {
    if (opp.amount) return opp.amount
    if (opp.amount_min && opp.amount_max) {
      return `$${opp.amount_min.toLocaleString()} - $${opp.amount_max.toLocaleString()}`
    }
    if (opp.amount_min) return `From $${opp.amount_min.toLocaleString()}`
    if (opp.amount_max) return `Up to $${opp.amount_max.toLocaleString()}`
    return 'Amount varies'
  }

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors = {
      grant: 'bg-green-100 text-green-800 border-green-200',
      residency: 'bg-blue-100 text-blue-800 border-blue-200',
      commission: 'bg-purple-100 text-purple-800 border-purple-200',
      competition: 'bg-orange-100 text-orange-800 border-orange-200',
      partnership: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      scholarship: 'bg-pink-100 text-pink-800 border-pink-200',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Get difficulty color
  const getDifficultyColor = (level: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700', 
      advanced: 'bg-red-100 text-red-700',
      any: 'bg-gray-100 text-gray-700'
    }
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl md:text-2xl font-bold text-center mt-10">{t.title}</h1>
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-7xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-[#FF69B4]">{t.subtitle}</h1>
          <p className="text-sm md:text-base text-gray-600">
            {t.description}
          </p>
        </div>

        <div className="relative mb-8 md:mb-10 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF69B4]/80 to-[#9ACD32]/80 z-10"></div>
          <Image
            src="/opportunities-hero.png"
            alt="Artists in Web3"
            width={1200}
            height={400}
            className="w-full h-40 md:h-48 object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center p-4 md:p-6 text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-2">{t.heroTitle}</h2>
            <p className="mb-4 max-w-lg text-sm md:text-base">
              {t.heroDescription}
            </p>
            {/*
            <Link href="#get-started">
              <Button className="bg-white text-[#FF69B4] hover:bg-gray-100 w-fit text-sm md:text-base">
                {t.getStarted}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            */}
          </div>
        </div>

        <Tabs defaultValue="opportunities" className="mb-8 md:mb-10">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="opportunities" className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2.5">
              <span className="truncate">{t.tabOpportunities}</span>
            </TabsTrigger>
            <TabsTrigger value="nfts" className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2.5">
              <span className="truncate">{t.tabNfts}</span>
            </TabsTrigger>
            <TabsTrigger value="communities" className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2.5">
              <span className="truncate">{t.tabCommunities}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nfts" className="mt-4 md:mt-6">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4 mb-6">
                  <div className="bg-[#FF69B4]/20 p-3 rounded-full flex-shrink-0 self-start">
                    <Palette className="h-5 w-5 md:h-6 md:w-6 text-[#FF69B4]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-semibold mb-2">{t.nftsTitle}</h3>
                    <p className="text-sm md:text-base text-gray-600 mb-4">
                      {t.nftsDescription}
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 text-sm md:text-base">{t.benefitsTitle}</h4>
                        <ul className="space-y-2 text-xs md:text-sm">
                          {t.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-[#9ACD32] mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 text-sm md:text-base">{t.gettingStartedTitle}</h4>
                        <ul className="space-y-2 text-xs md:text-sm">
                          {t.gettingStarted.map((step, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="bg-[#FF69B4] text-white rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <Link href={`/${locale}/create`}>
                      <Button className="w-full bg-[#FF69B4] hover:bg-[#FF1493] text-sm md:text-base">
                        {t.startCreating}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communities" className="mt-4 md:mt-6">
            <div className="space-y-6">
              {communitiesLoading ? (
                <Card>
                  <CardContent className="p-4 md:p-6">
                    <div className="text-center py-6 md:py-8">
                      <p className="text-gray-500">Loading communities...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : communities.length === 0 ? (
                <Card>
                  <CardContent className="p-4 md:p-6">
                    <div className="text-center py-6 md:py-8">
                      <div className="bg-[#9ACD32]/20 p-3 rounded-full w-fit mx-auto mb-4">
                        <Users className="h-6 w-6 md:h-8 md:w-8 text-[#9ACD32]" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold mb-2">Art Communities Coming Soon</h3>
                      <p className="text-sm md:text-base text-gray-600 mb-4 max-w-2xl mx-auto">
                        We're building a network of art communities to help artists connect and grow together.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communities.map((community) => (
                    <Card key={community.id} className="group hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="bg-[#9ACD32]/20 p-2 rounded-full flex-shrink-0">
                            <Users className="h-4 w-4 md:h-5 md:w-5 text-[#9ACD32]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-sm md:text-base line-clamp-2">
                                {community.title}
                              </h3>
                              {community.featured && (
                                <Star className="h-4 w-4 text-[#FF69B4] fill-[#FF69B4] flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-3">
                              {community.description}
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-[#9ACD32] hover:text-[#8BBB11] p-0 h-auto text-xs"
                              onClick={() => {
                                setSelectedCommunity(community)
                                setIsCommunityModalOpen(true)
                              }}
                            >
                              {t.readMore}
                            </Button>
                            {community.links.length > 0 && (
                              <div className="space-y-1 mb-3">
                                {community.links.slice(0, 3).map((link, linkIndex) => (
                                  <a
                                    key={linkIndex}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#9ACD32] hover:text-[#8BBB11] text-xs flex items-center gap-1 group-hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span className="truncate">
                                      {link.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}
                                    </span>
                                  </a>
                                ))}
                                {community.links.length > 3 && (
                                  <p className="text-xs text-gray-500">
                                    +{community.links.length - 3} more links
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="opportunities" className="mt-4 md:mt-6">
            <div className="space-y-6">
              {/* Featured Opportunities Section */}
              {featuredOpportunities.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-[#FF69B4]" />
                    <h3 className="text-lg font-semibold">Featured Opportunities</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {featuredOpportunities.map((opp) => (
                      <Card key={opp.id} className="border-2 border-[#FF69B4]/20 bg-gradient-to-br from-[#FF69B4]/5 to-white">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <Badge className={getCategoryColor(opp.category)} variant="outline">
                              {opp.category}
                            </Badge>
                            <Badge className={getDifficultyColor(opp.difficulty_level)} variant="secondary">
                              {opp.difficulty_level}
                            </Badge>
                          </div>
                          <h4 className="font-semibold mb-2 line-clamp-2">{opp.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{opp.organization}</p>
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{opp.description}</p>
                          <div className="space-y-2 text-xs text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatAmount(opp)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(opp.deadline).toLocaleDateString()}</span>
                            </div>
                            {opp.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span className="line-clamp-1">{opp.location}</span>
                              </div>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full bg-[#FF69B4] hover:bg-[#FF1493]"
                            onClick={() => window.open(opp.url, '_blank')}
                          >
                            View Details
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Search and Filter Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search opportunities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-md bg-white"
                    >
                      <option value="all">All Categories</option>
                      <option value="grant">Grants</option>
                      <option value="residency">Residencies</option>
                      <option value="commission">Commissions</option>
                      <option value="competition">Competitions</option>
                      <option value="partnership">Partnerships</option>
                      <option value="scholarship">Scholarships</option>
                    </select>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF69B4] mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading opportunities...</p>
                    </div>
                  ) : filteredOpportunities.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
                      <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredOpportunities.map((opp) => (
                        <Card key={opp.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex flex-wrap gap-2">
                                    <Badge className={getCategoryColor(opp.category)} variant="outline">
                                      {opp.category}
                                    </Badge>
                                    <Badge className={getDifficultyColor(opp.difficulty_level)} variant="secondary">
                                      {opp.difficulty_level}
                                    </Badge>
                                    {opp.featured && (
                                      <Badge className="bg-[#FF69B4] text-white">
                                        <Star className="h-3 w-3 mr-1" />
                                        Featured
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <h4 className="text-lg font-semibold mb-2">{opp.title}</h4>
                                <p className="text-sm text-gray-600 mb-2 font-medium">{opp.organization}</p>
                                <p className="text-sm text-gray-700 mb-4 line-clamp-3">{opp.description}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-[#9ACD32]" />
                                    <span>{formatAmount(opp)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-[#FF69B4]" />
                                    <span>{new Date(opp.deadline).toLocaleDateString()}</span>
                                  </div>
                                  {opp.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-blue-500" />
                                      <span className="line-clamp-1">{opp.location}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {opp.tags && opp.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-4">
                                    {opp.tags.slice(0, 4).map((tag, index) => (
                                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                    {opp.tags.length > 4 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        +{opp.tags.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-shrink-0">
                                <Button 
                                  className="bg-[#FF69B4] hover:bg-[#FF1493] w-full md:w-auto"
                                  onClick={() => window.open(opp.url, '_blank')}
                                >
                                  Apply Now
                                  <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Community Details Modal */}
      <Dialog open={isCommunityModalOpen} onOpenChange={setIsCommunityModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#9ACD32]" />
              {selectedCommunity?.title}
              {selectedCommunity?.featured && (
                <Star className="h-4 w-4 text-[#FF69B4] fill-[#FF69B4]" />
              )}
            </DialogTitle>
            <DialogDescription>
              Learn more about this art community and how they support artists.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCommunity && (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700">
                  {selectedCommunity.description}
                </div>
              </div>
              
              {selectedCommunity.links.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3">Connect with {selectedCommunity.title}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCommunity.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-[#9ACD32] hover:bg-[#9ACD32]/5 transition-colors group"
                      >
                        <ExternalLink className="h-4 w-4 text-[#9ACD32] group-hover:text-[#8BBB11]" />
                        <span className="text-sm font-medium truncate">
                          {link.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setIsCommunityModalOpen(false)}>
                  {t.close}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 