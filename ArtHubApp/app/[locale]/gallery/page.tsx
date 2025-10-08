'use client'

// Prevent static generation for pages using Web3 hooks
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { defaultLocale } from '@/config/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ImageIcon, Heart } from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FirebaseNFTService } from '@/lib/services/firebase-nft-service'
import type { NFT } from '@/lib/firebase'
import { useToast } from '@/hooks/use-toast'

export default function GalleryPage() {
  const params = useParams()
  const { toast } = useToast()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [searchQuery, setSearchQuery] = useState('')
  const [nfts, setNfts] = useState<NFT[]>([])
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [messages, setMessages] = useState({
    title: "Art Gallery",
    subtitle: "Explore unique NFT artwork from talented artists worldwide",
    search: "Search NFTs...",
    noNfts: "No NFTs found",
    loading: "Loading gallery...",
    viewDetails: "View Details",
    owner: "Owner",
    creator: "Creator",
    collection: "Collection",
    blockchain: "Blockchain",
    common: {
      close: "Close"
    }
  })

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
  }, [params?.locale])

  // Load messages when locale changes
  useEffect(() => {
    async function loadMessages() {
      try {
        const translations = await import(`@/messages/${locale}/index.json`)
        if (translations?.default?.gallery) {
          setMessages(prev => ({
            ...prev,
            ...(translations.default.gallery || {}),
            common: {
              ...prev.common,
              ...(translations.default.common || {})
            }
          }))
        }
      } catch (error) {
        console.error('Failed to load gallery translations:', error)
      }
    }

    loadMessages()
  }, [locale])

  // Load all NFTs on mount
  useEffect(() => {
    async function loadNFTs() {
      try {
        setIsLoading(true)
        const allNfts = await FirebaseNFTService.getAllNFTs()
        setNfts(allNfts)
        setFilteredNfts(allNfts)
      } catch (error) {
        console.error('Error loading NFTs:', error)
        toast({
          title: "Error",
          description: "Failed to load gallery. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadNFTs()
  }, [toast])

  // Filter NFTs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNfts(nfts)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = nfts.filter(nft =>
      nft.name?.toLowerCase().includes(query) ||
      nft.description?.toLowerCase().includes(query) ||
      nft.artist_name?.toLowerCase().includes(query) ||
      nft.wallet_address?.toLowerCase().includes(query)
    )
    setFilteredNfts(filtered)
  }, [searchQuery, nfts])

  // Handle NFT card click
  const handleNftClick = (nft: NFT) => {
    setSelectedNft(nft)
    setIsDialogOpen(true)
  }

  // Helper function to get IPFS image URL
  const getImageUrl = (ipfsHash: string) => {
    if (!ipfsHash) return '/images/placeholder-nft.png'
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
  }

  // Helper function to format wallet address
  const formatAddress = (address: string) => {
    if (!address) return 'Unknown'
    return `${address.substring(0, 6)}...${address.substring(38)}`
  }

  // Helper function to get display artist name
  const getDisplayArtistName = (nft: NFT) => {
    if (nft.artist_name &&
        nft.artist_name.trim() &&
        !nft.artist_name.startsWith('Artist 0x') &&
        nft.artist_name.toLowerCase() !== 'artist') {
      return nft.artist_name
    }
    return formatAddress(nft.wallet_address)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <ImageIcon className="text-purple-500 mr-3" size={40} />
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            {messages.title}
          </h1>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          {messages.subtitle}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder={messages.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 w-full rounded-full border border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </div>
      </div>

      {/* NFT Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{messages.loading}</p>
        </div>
      ) : filteredNfts.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="text-gray-600 text-lg">{messages.noNfts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNfts.map((nft) => (
            <Card
              key={nft.id}
              className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-purple-300"
              onClick={() => handleNftClick(nft)}
            >
              <CardContent className="p-0">
                {/* NFT Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <Image
                    src={getImageUrl(nft.image_ipfs_hash)}
                    alt={nft.name || 'NFT'}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart size={16} className="text-pink-500" />
                  </div>
                </div>

                {/* NFT Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">
                    {nft.name || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 truncate">
                    by {getDisplayArtistName(nft)}
                  </p>
                  {nft.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {nft.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* NFT Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedNft && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {selectedNft.name || 'Untitled'}
                </DialogTitle>
                <DialogDescription>
                  {selectedNft.description || 'No description available'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* NFT Image */}
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={getImageUrl(selectedNft.image_ipfs_hash)}
                    alt={selectedNft.name || 'NFT'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* NFT Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">{messages.creator}</p>
                    <p className="font-mono text-sm break-all">
                      {formatAddress(selectedNft.wallet_address)}
                    </p>
                  </div>

                  {selectedNft.artist_name && selectedNft.artist_name.trim() && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Artist Name</p>
                      <p className="font-semibold text-sm">
                        {selectedNft.artist_name}
                      </p>
                    </div>
                  )}

                  {selectedNft.contract_address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">{messages.collection}</p>
                      <p className="font-mono text-sm break-all">
                        {formatAddress(selectedNft.contract_address)}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500 mb-1">{messages.blockchain}</p>
                    <p className="font-semibold">
                      {selectedNft.network === 'base' ? 'Base' : selectedNft.network === 'base-sepolia' ? 'Base Sepolia' : 'Base'}
                    </p>
                  </div>

                  {selectedNft.royalty_percentage !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Royalty</p>
                      <p className="font-semibold">{selectedNft.royalty_percentage}%</p>
                    </div>
                  )}
                </div>

                {/* View on Explorer Button */}
                {selectedNft.contract_address && (
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={() => {
                      const isTestnet = selectedNft.network === 'base-sepolia'
                      const explorerUrl = isTestnet
                        ? `https://sepolia.basescan.org/address/${selectedNft.contract_address}`
                        : `https://basescan.org/address/${selectedNft.contract_address}`
                      window.open(explorerUrl, '_blank')
                    }}
                  >
                    View on BaseScan
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
