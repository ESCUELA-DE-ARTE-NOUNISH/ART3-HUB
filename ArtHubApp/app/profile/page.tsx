"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import Header from "@/components/header"
import Image from "next/image"
import Link from "next/link"
import { LogOut, Edit, ExternalLink, Bell, Moon, Globe, Shield, CreditCard, Plus } from "lucide-react"

export default function ProfilePage() {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)

  // Sample user data
  const user = {
    name: "Sofia Martinez",
    username: "@sofiart",
    bio: "Digital artist from Mexico City. Creating at the intersection of art and technology.",
    avatar: "/profile-avatar.png",
    coverImage: "/profile-cover.png",
    stats: {
      nfts: 12,
      following: 87,
      followers: 143,
    },
  }

  // Sample NFT data
  const userNFTs = [
    {
      id: "1",
      title: "Digital Dreams",
      image: "/colorful-abstract-digital-art.png",
      price: "0.05 ETH",
    },
    {
      id: "2",
      title: "Neon Jungle",
      image: "/neon-jungle-animals.png",
      price: "0.08 ETH",
    },
    {
      id: "3",
      title: "Cosmic Voyage",
      image: "/space-nebula-with-planets.png",
      price: "0.12 ETH",
    },
  ]

  return (
    <div className="pb-16">
      <Header title="Profile" showBack={false} />

      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-[#FF69B4] to-[#9ACD32]">
          {user.coverImage && (
            <Image src={user.coverImage || "/placeholder.svg"} alt="Cover" fill className="object-cover opacity-70" />
          )}
        </div>

        <div className="container mx-auto px-4">
          <div className="relative -mt-16 mb-4 flex justify-between">
            <div className="relative h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden">
              <Image
                src={user.avatar || "/placeholder.svg?height=96&width=96&query=user"}
                alt={user.name}
                fill
                className="object-cover"
              />
            </div>
            <Button className="mt-16 bg-[#FF69B4] hover:bg-[#FF1493]" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-500">{user.username}</p>
            <p className="mt-2">{user.bio}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-[#FF69B4]">{user.stats.nfts}</div>
                <div className="text-sm text-gray-500">NFTs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-[#9ACD32]">{user.stats.following}</div>
                <div className="text-sm text-gray-500">Following</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-[#FF69B4]">{user.stats.followers}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="nfts" className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="nfts">My NFTs</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="nfts" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {userNFTs.map((nft) => (
                  <Card key={nft.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <Image src={nft.image || "/placeholder.svg"} alt={nft.title} fill className="object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm truncate">{nft.title}</h3>
                        <span className="text-xs font-medium text-[#FF69B4]">{nft.price}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Link href="/create">
                  <Card className="flex flex-col items-center justify-center h-full aspect-square border-dashed border-2 hover:border-[#9ACD32] transition-colors">
                    <div className="p-6 text-center">
                      <div className="rounded-full bg-[#9ACD32] p-3 inline-flex mb-2">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-sm font-medium">Create New</p>
                    </div>
                  </Card>
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link href="/my-nfts">
                  <Button variant="outline" className="w-full">
                    View All NFTs
                  </Button>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium">Notifications</h3>
                        <p className="text-sm text-gray-500">Receive alerts about your activity</p>
                      </div>
                    </div>
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="h-5 w-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium">Dark Mode</h3>
                        <p className="text-sm text-gray-500">Switch to dark theme</p>
                      </div>
                    </div>
                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <Link href="/wallet" className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-gray-500" />
                      <h3 className="font-medium">Wallet Settings</h3>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </Link>

                  <Link href="#" className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-gray-500" />
                      <h3 className="font-medium">Language</h3>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">English</span>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>

                  <Link href="#" className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-gray-500" />
                      <h3 className="font-medium">Privacy & Security</h3>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </Link>
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
