"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import {
  ArrowRight,
  ExternalLink,
  Calendar,
  DollarSign,
  Palette,
  Sparkles,
  Users,
  Globe,
  Lightbulb,
  Award,
} from "lucide-react"

// Translation content
const translations = {
  en: {
    title: "Opportunities",
    subtitle: "Web3 Opportunities for Artists",
    description: "Discover how blockchain technology is creating new possibilities for artists to monetize, distribute, and protect their creative work.",
    heroTitle: "Transform Your Creative Career",
    heroDescription: "Web3 is revolutionizing how artists create, sell, and connect with audiences worldwide.",
    getStarted: "Get Started Today",
    tabNfts: "NFTs",
    tabCommunities: "Communities",
    tabGrants: "Grants & Funding",
    tabMarketplaces: "Marketplaces",
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
    startCreating: "Start Creating NFTs"
  },
  es: {
    title: "Oportunidades",
    subtitle: "Oportunidades Web3 para Artistas",
    description: "Descubre cómo la tecnología blockchain está creando nuevas posibilidades para que los artistas moneticen, distribuyan y protejan su trabajo creativo.",
    heroTitle: "Transforma tu Carrera Creativa",
    heroDescription: "Web3 está revolucionando cómo los artistas crean, venden y se conectan con audiencias en todo el mundo.",
    getStarted: "Comienza Hoy",
    tabNfts: "NFTs",
    tabCommunities: "Comunidades",
    tabGrants: "Becas y Financiamiento",
    tabMarketplaces: "Mercados",
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
    startCreating: "Comienza a Crear NFTs"
  },
  fr: {
    title: "Opportunités",
    subtitle: "Opportunités Web3 pour les Artistes",
    description: "Découvrez comment la technologie blockchain crée de nouvelles possibilités pour les artistes de monétiser, distribuer et protéger leur travail créatif.",
    heroTitle: "Transformez Votre Carrière Créative",
    heroDescription: "Le Web3 révolutionne la façon dont les artistes créent, vendent et se connectent avec des audiences dans le monde entier.",
    getStarted: "Commencez Aujourd'hui",
    tabNfts: "NFTs",
    tabCommunities: "Communautés",
    tabGrants: "Subventions & Financement",
    tabMarketplaces: "Marchés",
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
    startCreating: "Commencez à Créer des NFTs"
  },
  pt: {
    title: "Oportunidades",
    subtitle: "Oportunidades Web3 para Artistas",
    description: "Descubra como a tecnologia blockchain está criando novas possibilidades para artistas monetizarem, distribuírem e protegerem seu trabalho criativo.",
    heroTitle: "Transforme Sua Carreira Criativa",
    heroDescription: "Web3 está revolucionando como os artistas criam, vendem e se conectam com audiências em todo o mundo.",
    getStarted: "Comece Hoje",
    tabNfts: "NFTs",
    tabCommunities: "Comunidades",
    tabGrants: "Bolsas e Financiamento",
    tabMarketplaces: "Mercados",
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
    startCreating: "Comece a Criar NFTs"
  }
}

export default function OpportunitiesPage() {
  const params = useParams()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [t, setT] = useState(translations.en)

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
    setT(translations[currentLocale as keyof typeof translations] || translations.en)
  }, [params])

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
            <Link href="#get-started">
              <Button className="bg-white text-[#FF69B4] hover:bg-gray-100 w-fit text-sm md:text-base">
                {t.getStarted}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="nfts" className="mb-8 md:mb-10">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1">
            <TabsTrigger value="nfts" className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2.5">
              <span className="truncate">{t.tabNfts}</span>
            </TabsTrigger>
            <TabsTrigger value="communities" className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2.5">
              <span className="truncate">{t.tabCommunities}</span>
            </TabsTrigger>
            <TabsTrigger value="grants" className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2.5">
              <span className="truncate">{t.tabGrants}</span>
            </TabsTrigger>
            <TabsTrigger value="marketplaces" className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2.5">
              <span className="truncate">{t.tabMarketplaces}</span>
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
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="text-center py-6 md:py-8">
                  <div className="bg-[#9ACD32]/20 p-3 rounded-full w-fit mx-auto mb-4">
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-[#9ACD32]" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2">Web3 Artist Communities</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4 max-w-2xl mx-auto">
                    Connect with fellow artists, share experiences, and learn from the community. Join Discord servers, Twitter spaces, and local meetups.
                  </p>
                  <Button variant="outline" className="text-sm md:text-base">
                    Explore Communities
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="grants" className="mt-4 md:mt-6">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="text-center py-6 md:py-8">
                  <div className="bg-[#FF69B4]/20 p-3 rounded-full w-fit mx-auto mb-4">
                    <Award className="h-6 w-6 md:h-8 md:w-8 text-[#FF69B4]" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2">Grants & Funding</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4 max-w-2xl mx-auto">
                    Discover funding opportunities for Web3 artists. From foundation grants to DAO funding, find resources to support your creative journey.
                  </p>
                  <Button variant="outline" className="text-sm md:text-base">
                    Find Funding
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="marketplaces" className="mt-4 md:mt-6">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="text-center py-6 md:py-8">
                  <div className="bg-[#9ACD32]/20 p-3 rounded-full w-fit mx-auto mb-4">
                    <Globe className="h-6 w-6 md:h-8 md:w-8 text-[#9ACD32]" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2">NFT Marketplaces</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4 max-w-2xl mx-auto">
                    Explore different NFT marketplaces to find the best platform for your art. Each marketplace has unique features and communities.
                  </p>
                  <Button variant="outline" className="text-sm md:text-base">
                    Browse Marketplaces
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 