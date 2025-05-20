"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Sparkles, Palette, Coins } from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";

export default function Home() {

  const { setFrameReady, isFrameReady, context } = useMiniKit();

  // The setFrameReady() function is called when your mini-app is ready to be shown
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

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
            <Link href="/my-collection">
              <Button className="w-full bg-[#9ACD32] hover:bg-[#7CFC00]">View Collection</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Web3 Opportunities Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-[#FF69B4]">Unlock Your Creative Future in Web3</h2>

        <Card className="bg-gradient-to-r from-[#FF69B4]/10 to-[#9ACD32]/10 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="bg-[#FF69B4]/20 p-3 rounded-full">
                <Sparkles className="h-8 w-8 text-[#FF69B4]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Check out opportunities for artists on Web3</h3>
                <p className="text-gray-600">
                  Discover how Web3 is revolutionizing the art world with new income streams, direct fan connections,
                  and ownership of your creative work.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-start gap-2">
                <Palette className="h-5 w-5 text-[#FF69B4] mt-0.5" />
                <div>
                  <h4 className="font-medium">Creative Freedom</h4>
                  <p className="text-sm text-gray-600">Mint and sell your art without gatekeepers</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Coins className="h-5 w-5 text-[#9ACD32] mt-0.5" />
                <div>
                  <h4 className="font-medium">Royalties</h4>
                  <p className="text-sm text-gray-600">Earn from secondary sales of your work</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-[#FF69B4] mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-medium">Global Community</h4>
                  <p className="text-sm text-gray-600">Connect with collectors worldwide</p>
                </div>
              </div>
            </div>

            <Link href="/opportunities">
              <Button className="w-full bg-gradient-to-r from-[#FF69B4] to-[#9ACD32] hover:from-[#FF1493] hover:to-[#7CFC00] text-white">
                <span>Explore Web3 Opportunities</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-500 mb-8">
        <p>Created by Escuela de Arte Nounish</p>
        <p>Built with ❤️ from LATAM</p>
      </div>
    </div>
  )
}
