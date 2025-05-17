"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Header from "@/components/header"
import Image from "next/image"
import { Grid, List, ChevronDown, Filter, ExternalLink, Share2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"

// Sample NFT data - in a real app, this would come from a database or API
const userNFTs = [
  {
    id: "1",
    title: "Digital Dreams",
    image: "/colorful-abstract-digital-art.png",
    description: "An exploration of digital consciousness",
    price: "0.05 ETH",
    artist: "You",
    mintedAt: "2 days ago",
    link: "https://opensea.io",
  },
  {
    id: "2",
    title: "Neon Jungle",
    image: "/neon-jungle-animals.png",
    description: "Vibrant wildlife in a neon-lit jungle",
    price: "0.08 ETH",
    artist: "You",
    mintedAt: "1 week ago",
    link: "https://opensea.io",
  },
  {
    id: "3",
    title: "Cosmic Voyage",
    image: "/space-nebula-with-planets.png",
    description: "Journey through the cosmos",
    price: "0.12 ETH",
    artist: "You",
    mintedAt: "2 weeks ago",
    link: "https://opensea.io",
  },
]

export default function MyCollectionPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<string>("newest")
  const searchParams = useSearchParams()
  const highlightedNftId = searchParams.get("highlight")

  // Filter options
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const filterOptions = [
    { value: "all", label: "All NFTs" },
    { value: "created", label: "Created by me" },
    { value: "collected", label: "Collected" },
    { value: "recent", label: "Recently minted" },
  ]

  // Sort options
  const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "price-low", label: "Price: Low to High" },
  ]

  const currentSortOption = sortOptions.find((option) => option.value === sortBy)

  return (
    <div className="pb-16">
      <Header title="My Collection" />

      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              {filterOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              className={viewMode === "grid" ? "bg-[#FF69B4] hover:bg-[#FF1493]" : ""}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              className={viewMode === "list" ? "bg-[#FF69B4] hover:bg-[#FF1493]" : ""}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4 mr-1" />
                {currentSortOption?.label}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => setSortBy(option.value)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {userNFTs.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-4"}>
            {userNFTs.map((nft) => (
              <Card
                key={nft.id}
                className={`overflow-hidden ${
                  highlightedNftId === nft.id ? "border-[#9ACD32] border-2 shadow-lg" : ""
                }`}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-square relative">
                      <Image src={nft.image || "/placeholder.svg"} alt={nft.title} fill className="object-cover" />
                      {highlightedNftId === nft.id && (
                        <Badge className="absolute top-2 right-2 bg-[#9ACD32]">New</Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-sm truncate">{nft.title}</h3>
                        <span className="text-xs font-medium text-[#FF69B4]">{nft.price}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Minted {nft.mintedAt}</p>
                      <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm" className="text-xs px-2 py-0 h-7">
                          Details
                        </Button>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Share2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex p-3">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                      <Image src={nft.image || "/placeholder.svg"} alt={nft.title} fill className="object-cover" />
                      {highlightedNftId === nft.id && (
                        <Badge className="absolute top-1 right-1 bg-[#9ACD32] text-xs">New</Badge>
                      )}
                    </div>
                    <div className="ml-3 flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{nft.title}</h3>
                        <span className="text-xs font-medium text-[#FF69B4]">{nft.price}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{nft.description}</p>
                      <p className="text-xs text-gray-500 mb-2">Minted {nft.mintedAt}</p>
                      <div className="flex justify-between items-center">
                        <Button variant="outline" size="sm" className="text-xs px-2 py-0 h-7">
                          Details
                        </Button>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Share2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-2">No NFTs Yet</h2>
            <p className="text-gray-600 mb-6">You haven't minted or collected any NFTs yet.</p>
            <Button className="bg-[#9ACD32] hover:bg-[#7CFC00]">Create Your First NFT</Button>
          </div>
        )}
      </div>
    </div>
  )
}
