import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="container mx-auto px-4 pb-16">
      <div className="flex justify-center py-6">
        <Image
          src="/images/logo.png"
          alt="Escuela de Arte Nounish Logo"
          width={120}
          height={120}
          className="rounded-full"
        />
      </div>

      <h1 className="text-3xl font-bold text-center mb-2 text-[#FF69B4]">AI ART3 HUB</h1>
      <p className="text-center mb-8 text-gray-600">Your bridge to Web3 creativity</p>

      <div className="grid grid-cols-1 gap-4 mb-8">

        <Card className="border-[#9ACD32] border-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2 text-[#9ACD32]">AI Education Agent</h2>
            <p className="text-gray-600 mb-4">Learn about Web3, NFTs, and blockchain with our AI assistant.</p>
            <Link href="/ai-agent">
              <Button className="w-full bg-[#9ACD32] hover:bg-[#7CFC00]">Ask Questions</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[#FF69B4] border-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2 text-[#FF69B4]">Create & Mint NFTs</h2>
            <p className="text-gray-600 mb-4">Upload your artwork and mint it as an NFT on the Base blockchain.</p>
            <Link href="/create">
              <Button className="w-full bg-[#FF69B4] hover:bg-[#FF1493]">Create NFT</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[#FF69B4] border-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2 text-[#FF69B4]">Manage Wallet</h2>
            <p className="text-gray-600 mb-4">Set up and manage your Web3 wallet for minting and transactions.</p>
            <Link href="/wallet">
              <Button className="w-full bg-[#FF69B4] hover:bg-[#FF1493]">Wallet</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[#9ACD32] border-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2 text-[#9ACD32]">My NFTs</h2>
            <p className="text-gray-600 mb-4">View and manage your minted NFT collection.</p>
            <Link href="/my-nfts">
              <Button className="w-full bg-[#9ACD32] hover:bg-[#7CFC00]">View Collection</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Created by Escuela de Arte Nounish</p>
        <p>Built with ❤️ from LATAM</p>
      </div>
    </div>
  )
}
