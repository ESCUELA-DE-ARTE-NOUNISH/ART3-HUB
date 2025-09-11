"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"
import { Edit, Users, Grid, Trophy, Twitter, Instagram, ExternalLink, Star, Check, Copy, CheckCheck, Heart } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useFavorites } from "@/hooks/useFavorites"
import { ProfileEditForm } from "@/components/profile-edit-form"
import { SubscriptionStatusFirebase } from "@/components/subscription-status-firebase"
import { Input } from "@/components/ui/input"

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
    elitePlan: "Elite Creator",
    inactive: "Inactive",
    expires: "Expires",
    nftsUsed: "NFTs Used",
    unlimited: "Unlimited",
    gaslessMinting: "Gasless Minting",
    enabled: "Enabled",
    disabled: "Disabled",
    upgrade: "Upgrade to Master",
    subscribeMaster: "Subscribe to Master",
    subscribeElite: "Subscribe to Elite Creator",
    loading: "Loading",
    month: "month",
    walletAddress: "Wallet Address",
    copyAddress: "Copy Address",
    addressCopied: "Address Copied!",
    favorites: "Favorites",
    noFavorites: "No favorite NFTs yet",
    exploreFavorites: "Explore and favorite NFTs to see them here"
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
    elitePlan: "Creador Elite",
    inactive: "Inactivo",
    expires: "Expira",
    nftsUsed: "NFTs Usados",
    unlimited: "Ilimitado",
    gaslessMinting: "Minteo Sin Gas",
    enabled: "Activado",
    disabled: "Desactivado",
    upgrade: "Actualizar a Master",
    subscribeMaster: "Suscribirse a Master",
    subscribeElite: "Suscribirse a Creador Elite",
    loading: "Cargando",
    month: "mes",
    walletAddress: "Dirección de Wallet",
    copyAddress: "Copiar Dirección",
    addressCopied: "¡Dirección Copiada!",
    favorites: "Favoritos",
    noFavorites: "No tienes NFTs favoritos aún",
    exploreFavorites: "Explora y marca NFTs como favoritos para verlos aquí"
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
    elitePlan: "Créateur Elite",
    inactive: "Inactif",
    expires: "Expire",
    nftsUsed: "NFTs Utilisés",
    unlimited: "Illimité",
    gaslessMinting: "Minage Sans Gaz",
    enabled: "Activé",
    disabled: "Désactivé",
    upgrade: "Passer à Master",
    subscribeMaster: "S'abonner à Master",
    subscribeElite: "S'abonner à Créateur Elite",
    loading: "Chargement",
    month: "mois",
    walletAddress: "Adresse de Portefeuille",
    copyAddress: "Copier l'Adresse",
    addressCopied: "Adresse Copiée!",
    favorites: "Favoris",
    noFavorites: "Aucun NFT favori pour le moment",
    exploreFavorites: "Explorez et marquez des NFTs comme favoris pour les voir ici"
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
    elitePlan: "Criador Elite",
    inactive: "Inativo",
    expires: "Expira",
    nftsUsed: "NFTs Usados",
    unlimited: "Ilimitado",
    gaslessMinting: "Mintagem Sem Gás",
    enabled: "Ativado",
    disabled: "Desativado",
    upgrade: "Atualizar para Master",
    subscribeMaster: "Assinar Master",
    subscribeElite: "Assinar Criador Elite",
    loading: "Carregando",
    month: "mês",
    walletAddress: "Endereço da Carteira",
    copyAddress: "Copiar Endereço",
    addressCopied: "Endereço Copiado!",
    favorites: "Favoritos",
    noFavorites: "Nenhum NFT favorito ainda",
    exploreFavorites: "Explore e marque NFTs como favoritos para vê-los aqui"
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
  const router = useRouter()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [t, setT] = useState(translations.en)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)
  
  // Get user profile data
  const { userProfile, loading, isConnected, walletAddress, isProfileComplete, refreshProfile } = useUserProfile()
  
  // Get favorites data
  const { userFavorites, loading: favoritesLoading } = useFavorites()

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
    setT(translations[currentLocale as keyof typeof translations] || translations.en)
  }, [params])

  // Copy wallet address to clipboard
  const copyWalletAddress = async () => {
    if (!walletAddress) return
    
    try {
      await navigator.clipboard.writeText(walletAddress)
      setAddressCopied(true)
      setTimeout(() => setAddressCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  // Helper function to get IPFS image URL
  const getImageUrl = (ipfsHash: string) => {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
  }

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
            
            {/* Wallet Address Section */}
            {walletAddress && (
              <div className="mt-4 w-full max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.walletAddress}
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={walletAddress}
                    readOnly
                    className="flex-1 bg-gray-50 border-gray-200 text-sm font-mono"
                  />
                  <Button
                    onClick={copyWalletAddress}
                    variant="outline"
                    size="sm"
                    className="px-3 flex-shrink-0"
                    title={addressCopied ? t.addressCopied : t.copyAddress}
                  >
                    {addressCopied ? (
                      <CheckCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex space-x-6 text-center">
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
      
      {/* Tabs for Subscription and Favorites */}
      <div className="container mx-auto px-4 mt-8">
        <Tabs defaultValue="subscription">
          <TabsList className="grid w-full grid-cols-2 mb-6 max-w-md mx-auto">
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>{t.subscription}</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span>{t.favorites}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="space-y-4">
            <SubscriptionStatusFirebase 
              translations={t} 
              onRefresh={() => {
                // Refresh profile data as well
                refreshProfile()
              }}
            />
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">{t.favorites}</h2>
              <p className="text-gray-500 text-sm">
                {userFavorites.length} NFT{userFavorites.length !== 1 ? 's' : ''} favorited
              </p>
            </div>
            
            {favoritesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF69B4]"></div>
                <span className="ml-2 text-gray-500">{t.loading}...</span>
              </div>
            ) : userFavorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {userFavorites.map((favorite) => (
                  <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/${locale}/explore`)}>
                    <div className="aspect-square relative">
                      <Image 
                        src={getImageUrl(favorite.nft_image_ipfs_hash)} 
                        alt={favorite.nft_name} 
                        fill 
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg"
                        }}
                      />
                      <div className="absolute top-2 right-2 p-2 rounded-full bg-black/20 backdrop-blur-sm">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </div>
                    </div>
                    <CardContent className="p-3 md:p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm md:text-base truncate">{favorite.nft_name}</h3>
                          <p className="text-xs md:text-sm text-gray-500 truncate">
                            by {favorite.nft_artist_name || 'Unknown Artist'}
                          </p>
                          <p className="text-xs text-gray-400">{favorite.nft_category || 'Uncategorized'}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Favorited on {new Date(favorite.favorited_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">{t.noFavorites}</p>
                <p className="text-sm text-gray-400 mb-6">{t.exploreFavorites}</p>
                <Button 
                  className="bg-[#FF69B4] hover:bg-[#FF1493]"
                  onClick={() => router.push(`/${locale}/explore`)}
                >
                  Explore NFTs
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

    </div>
  )
} 