"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"
import { Edit, Users, Grid, Trophy, Twitter, Instagram, ExternalLink, Star, Check } from "lucide-react"
import { useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import { useUserProfile } from "@/hooks/useUserProfile"
import { ProfileEditForm } from "@/components/profile-edit-form"
import { SubscriptionStatusV3 } from "@/components/subscription-status-v3"

// Custom Verified Star Component
function VerifiedStar() {
  return (
    <div className="relative inline-flex items-center justify-center">
      <Star className="h-6 w-6 text-pink-500 fill-pink-500" />
      <Check className="absolute h-3.5 w-3.5 text-white stroke-[3]" />
    </div>
  )
}

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
    bio: "Bio",
    subscription: "Subscription",
    currentPlan: "Current Plan",
    freePlan: "Free",
    masterPlan: "Master",
    inactive: "Inactive",
    expires: "Expires",
    nftsUsed: "NFTs Used",
    unlimited: "Unlimited",
    gaslessMinting: "Gasless Minting",
    enabled: "Enabled",
    disabled: "Disabled",
    upgrade: "Upgrade to Master",
    subscribeMaster: "Subscribe to Master",
    loading: "Loading",
    month: "month"
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
    bio: "Biografía",
    subscription: "Suscripción",
    currentPlan: "Plan Actual",
    freePlan: "Gratis",
    masterPlan: "Master",
    inactive: "Inactivo",
    expires: "Expira",
    nftsUsed: "NFTs Usados",
    unlimited: "Ilimitado",
    gaslessMinting: "Minteo Sin Gas",
    enabled: "Activado",
    disabled: "Desactivado",
    upgrade: "Actualizar a Master",
    subscribeMaster: "Suscribirse a Master",
    loading: "Cargando",
    month: "mes"
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
    bio: "Biographie",
    subscription: "Abonnement",
    currentPlan: "Plan Actuel",
    freePlan: "Gratuit",
    masterPlan: "Master",
    inactive: "Inactif",
    expires: "Expire",
    nftsUsed: "NFTs Utilisés",
    unlimited: "Illimité",
    gaslessMinting: "Minage Sans Gaz",
    enabled: "Activé",
    disabled: "Désactivé",
    upgrade: "Passer à Master",
    subscribeMaster: "S'abonner à Master",
    loading: "Chargement",
    month: "mois"
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
    bio: "Biografia",
    subscription: "Assinatura",
    currentPlan: "Plano Atual",
    freePlan: "Grátis",
    masterPlan: "Master",
    inactive: "Inativo",
    expires: "Expira",
    nftsUsed: "NFTs Usados",
    unlimited: "Ilimitado",
    gaslessMinting: "Mintagem Sem Gás",
    enabled: "Ativado",
    disabled: "Desativado",
    upgrade: "Atualizar para Master",
    subscribeMaster: "Assinar Master",
    loading: "Carregando",
    month: "mês"
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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  
  // Get user profile data
  const { userProfile, loading, isConnected, walletAddress, isProfileComplete, refreshProfile } = useUserProfile()

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
    setT(translations[currentLocale as keyof typeof translations] || translations.en)
  }, [params])

  // Show connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
        <p className="text-gray-500 mb-6">Please connect your wallet to view your profile.</p>
        <Button className="bg-[#FF69B4] hover:bg-[#FF1493]">
          Connect Wallet
        </Button>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
        <p className="text-gray-500">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="pb-16">
      <div className="relative">
        {/* Cover Image */}
        <div className="h-40 w-full relative">
          <Image
            src={userProfile?.banner_image || "/profile-cover.png"}
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
                src={userProfile?.profile_picture || "/assets/blank-profile.png"}
                alt={userProfile?.name || "Profile"}
                fill
                className="object-cover"
                priority
              />
            </div>
            <h1 className="mt-4 text-2xl font-bold flex items-center gap-2">
              {userProfile?.name || "Unnamed User"}
              {isProfileComplete && <VerifiedStar />}
            </h1>
            <p className="text-gray-500">
              {userProfile?.username ? `@${userProfile.username}` : walletAddress?.slice(0, 8) + "..."}
            </p>
            
            <div className="mt-4 flex space-x-6 text-center">
              <div>
                <p className="font-semibold">0</p>
                <p className="text-sm text-gray-500">{t.followers}</p>
              </div>
              <div>
                <p className="font-semibold">0</p>
                <p className="text-sm text-gray-500">{t.following}</p>
              </div>
              <div>
                <p className="font-semibold">
                  {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : "N/A"}
                </p>
                <p className="text-sm text-gray-500">{t.joinedDate}</p>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {userProfile?.x_url && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center"
                  onClick={() => window.open(userProfile.x_url, '_blank')}
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  X
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              )}
              {userProfile?.instagram_url && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center"
                  onClick={() => window.open(userProfile.instagram_url, '_blank')}
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              )}
              {userProfile?.farcaster_url && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center"
                  onClick={() => window.open(userProfile.farcaster_url, '_blank')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Farcaster
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex space-x-4">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FF69B4] hover:bg-[#FF1493]">
                    <Edit className="h-4 w-4 mr-2" />
                    {t.editProfile}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t.editProfile}</DialogTitle>
                  </DialogHeader>
                  <ProfileEditForm 
                    userProfile={userProfile}
                    onSuccess={() => {
                      setEditDialogOpen(false)
                      refreshProfile()
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subscription Status Section */}
      <div className="container mx-auto px-4 mt-8">
        <SubscriptionStatusV3 
          translations={t} 
          onRefresh={() => {
            // Refresh profile data as well
            refreshProfile()
          }}
        />
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