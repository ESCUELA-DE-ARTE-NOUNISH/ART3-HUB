import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Header from "@/components/header"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

// Sample NFT data
const nfts = [
  {
    id: "1",
    title: "Digital Dreams",
    image: "/colorful-abstract-digital-art.png",
    description: "An exploration of digital consciousness",
    price: "0.05 ETH",
    link: "https://opensea.io",
  },
  {
    id: "2",
    title: "Neon Jungle",
    image: "/neon-jungle-animals.png",
    description: "Vibrant wildlife in a neon-lit jungle",
    price: "0.08 ETH",
    link: "https://opensea.io",
  },
  {
    id: "3",
    title: "Cosmic Voyage",
    image: "/space-nebula-with-planets.png",
    description: "Journey through the cosmos",
    price: "0.12 ETH",
    link: "https://opensea.io",
  },
]

export default function MyNFTs() {
  return (
    <div className="pb-16">
      <Header title="My NFTs" />

      <div className="container mx-auto px-4 py-6">
        {nfts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {nfts.map((nft) => (
              <Card key={nft.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <Image src={nft.image || "/placeholder.svg"} alt={nft.title} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{nft.title}</h3>
                    <span className="text-sm font-medium text-[#FF69B4]">{nft.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{nft.description}</p>
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                      <Link href={nft.link} target="_blank">
                        View on OpenSea
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-2">No NFTs Yet</h2>
            <p className="text-gray-600 mb-6">You haven&apos;t minted any NFTs yet. Create your first NFT to get started.</p>
            <Link href="/create">
              <Button className="bg-[#9ACD32] hover:bg-[#7CFC00]">Create Your First NFT</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
