"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Edit, Users, Grid, Trophy, Twitter, Instagram } from "lucide-react"
import { useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"

// Translation content
const translations = {
  en: {
    title: "Profile",
    editProfile: "Edit Profile",
    followers: "Followers",
    following: "Following",
    created: "Created",
    collected: "Collected",
    achievements: "Achievements",
    connectSocial: "Connect Social",
    joinedDate: "Joined",
    noCreations: "No creations yet",
    startCreating: "Start Creating",
    noCollections: "No collected NFTs yet",
    exploreMarketplace: "Explore Marketplace",
    noAchievements: "No achievements yet",
    keepExploring: "Keep exploring to earn achievements",
    bio: "Bio"
  },
  es: {
    title: "Perfil",
    editProfile: "Editar Perfil",
    followers: "Seguidores",
    following: "Siguiendo",
    created: "Creados",
    collected: "Coleccionados",
    achievements: "Logros",
    connectSocial: "Conectar Redes",
    joinedDate: "Se unió",
    noCreations: "Sin creaciones aún",
    startCreating: "Comenzar a Crear",
    noCollections: "Sin NFTs coleccionados aún",
    exploreMarketplace: "Explorar Mercado",
    noAchievements: "Sin logros aún",
    keepExploring: "Sigue explorando para ganar logros",
    bio: "Biografía"
  },
  fr: {
    title: "Profil",
    editProfile: "Modifier le Profil",
    followers: "Abonnés",
    following: "Abonnements",
    created: "Créés",
    collected: "Collectionnés",
    achievements: "Réalisations",
    connectSocial: "Connecter Réseaux",
    joinedDate: "Inscrit",
    noCreations: "Pas encore de créations",
    startCreating: "Commencer à Créer",
    noCollections: "Pas encore de NFTs collectionnés",
    exploreMarketplace: "Explorer le Marché",
    noAchievements: "Pas encore de réalisations",
    keepExploring: "Continuez à explorer pour gagner des réalisations",
    bio: "Biographie"
  },
  pt: {
    title: "Perfil",
    editProfile: "Editar Perfil",
    followers: "Seguidores",
    following: "Seguindo",
    created: "Criados",
    collected: "Colecionados",
    achievements: "Conquistas",
    connectSocial: "Conectar Redes",
    joinedDate: "Ingressou",
    noCreations: "Nenhuma criação ainda",
    startCreating: "Começar a Criar",
    noCollections: "Nenhum NFT colecionado ainda",
    exploreMarketplace: "Explorar Mercado",
    noAchievements: "Nenhuma conquista ainda",
    keepExploring: "Continue explorando para ganhar conquistas",
    bio: "Biografia"
  }
}

// Sample user data
const userData = {
  name: "Alex Rivera",
  username: "alexrivera",
  avatar: "/placeholder-74z4w.png",
  coverImage: "/profile-cover.png",
  bio: "Digital artist exploring the intersection of art and technology. Creating unique NFTs since 2021.",
  followers: 128,
  following: 56,
  joinedDate: "Jan 2021",
  socialLinks: {
    twitter: "alexrivera",
    instagram: "alex.rivera.art"
  }
}

// Sample created NFTs
const createdNFTs = [
  {
    id: "1",
    title: "Digital Dreamscape",
    image: "/colorful-abstract-digital-art.png",
    price: "0.08 ETH"
  },
  {
    id: "2",
    title: "Neon Horizon",
    image: "/neon-jungle-animals.png",
    price: "0.12 ETH"
  }
]

// Sample collected NFTs
const collectedNFTs = [
  {
    id: "3",
    title: "Cosmic Voyage",
    artist: "Ana Sofia",
    image: "/space-nebula-with-planets.png",
    price: "0.05 ETH"
  }
]

// Sample achievements
const achievements = [
  {
    id: "1",
    title: "First Creation",
    description: "Created your first NFT",
    icon: "🎨",
    date: "Feb 2021"
  },
  {
    id: "2",
    title: "Rising Star",
    description: "Reached 100 followers",
    icon: "⭐",
    date: "May 2021"
  }
]

export default function ProfilePage() {
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
      <div className="relative">
        {/* Cover Image */}
        <div className="h-40 w-full relative">
          <Image
            src={userData.coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Profile Picture and Basic Info */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-16 flex flex-col items-center">
            <div className="relative h-32 w-32 rounded-full border-4 border-white overflow-hidden bg-white">
              <Image
                src={userData.avatar}
                alt={userData.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            <h1 className="mt-4 text-2xl font-bold">{userData.name}</h1>
            <p className="text-gray-500">@{userData.username}</p>
            
            <div className="mt-4 flex space-x-6 text-center">
              <div>
                <p className="font-semibold">{userData.followers}</p>
                <p className="text-sm text-gray-500">{t.followers}</p>
              </div>
              <div>
                <p className="font-semibold">{userData.following}</p>
                <p className="text-sm text-gray-500">{t.following}</p>
              </div>
              <div>
                <p className="font-semibold">{userData.joinedDate}</p>
                <p className="text-sm text-gray-500">{t.joinedDate}</p>
              </div>
            </div>
            
            {/* Bio */}
            <div className="mt-4 text-center max-w-md">
              <h3 className="font-medium text-gray-500">{t.bio}</h3>
              <p className="mt-1">{userData.bio}</p>
            </div>
            
            {/* Social Links */}
            <div className="mt-4 flex space-x-2">
              {userData.socialLinks.twitter && (
                <Button variant="outline" size="sm" className="flex items-center">
                  <Twitter className="h-4 w-4 mr-2" />
                  @{userData.socialLinks.twitter}
                </Button>
              )}
              {userData.socialLinks.instagram && (
                <Button variant="outline" size="sm" className="flex items-center">
                  <Instagram className="h-4 w-4 mr-2" />
                  @{userData.socialLinks.instagram}
                </Button>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex space-x-4">
              <Button className="bg-[#FF69B4] hover:bg-[#FF1493]">
                <Edit className="h-4 w-4 mr-2" />
                {t.editProfile}
              </Button>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                {t.connectSocial}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for NFTs and Achievements */}
      <div className="container mx-auto px-4 mt-8">
        <Tabs defaultValue="created">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="created" className="flex items-center gap-1">
              <Grid className="h-4 w-4" />
              <span>{t.created}</span>
            </TabsTrigger>
            <TabsTrigger value="collected" className="flex items-center gap-1">
              <Grid className="h-4 w-4" />
              <span>{t.collected}</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>{t.achievements}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="created" className="space-y-4">
            {createdNFTs.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {createdNFTs.map((nft) => (
                  <Card key={nft.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <Image src={nft.image} alt={nft.title} fill className="object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm truncate">{nft.title}</h3>
                        <span className="text-xs font-medium text-[#FF69B4]">{nft.price}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">{t.noCreations}</p>
                <Button className="bg-[#9ACD32] hover:bg-[#7CFC00]">
                  {t.startCreating}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collected" className="space-y-4">
            {collectedNFTs.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {collectedNFTs.map((nft) => (
                  <Card key={nft.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <Image src={nft.image} alt={nft.title} fill className="object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm truncate">{nft.title}</h3>
                        <span className="text-xs font-medium text-[#FF69B4]">{nft.price}</span>
                      </div>
                      {nft.artist && (
                        <p className="text-xs text-gray-500">by {nft.artist}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">{t.noCollections}</p>
                <Button className="bg-[#9ACD32] hover:bg-[#7CFC00]">
                  {t.exploreMarketplace}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[#f0f0f0] flex items-center justify-center text-2xl">
                        {achievement.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-gray-500">{achievement.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{achievement.date}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">{t.noAchievements}</p>
                <p className="text-sm text-gray-400">{t.keepExploring}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 