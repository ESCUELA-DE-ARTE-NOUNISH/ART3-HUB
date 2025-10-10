'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  ImageIcon,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  PlusCircle
} from 'lucide-react'
import type { NFT } from '@/lib/firebase'

interface GalleryManagementProps {
  adminWallet: string
  translations: {
    title: string
    description: string
    filterAll: string
    filterInGallery: string
    filterNotInGallery: string
    addToGallery: string
    removeFromGallery: string
    bulkAdd: string
    bulkRemove: string
    selectAll: string
    deselectAll: string
    loading: string
    noNfts: string
    inGallery: string
    notInGallery: string
    page: string
    of: string
    showing: string
    nfts: string
    success: string
    error: string
    addedToGallery: string
    removedFromGallery: string
    bulkUpdateSuccess: string
    loadError: string
  }
}

type FilterType = 'all' | 'gallery' | 'not_gallery'

export function GalleryManagement({ adminWallet, translations }: GalleryManagementProps) {
  const { toast } = useToast()

  // State
  const [nfts, setNfts] = useState<NFT[]>([])
  const [selectedNftIds, setSelectedNftIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<FilterType>('all')
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const limit = 20 // NFTs per page

  // Helper to get IPFS image URL
  const getImageUrl = (ipfsHash: string) => {
    if (!ipfsHash) return '/images/placeholder-nft.png'

    // Use Pinata gateway with JWT token to avoid rate limits
    const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT
    if (pinataJWT) {
      return `https://gateway.pinata.cloud/ipfs/${ipfsHash}?pinataGatewayToken=${pinataJWT}`
    }

    // Fallback to ipfs.io gateway to avoid Pinata rate limits
    return `https://ipfs.io/ipfs/${ipfsHash}`
  }

  // Helper to format wallet address
  const formatAddress = (address: string) => {
    if (!address) return 'Unknown'
    return `${address.substring(0, 6)}...${address.substring(38)}`
  }

  // Helper to get display artist name
  const getDisplayArtistName = (nft: NFT) => {
    if (nft.artist_name &&
        nft.artist_name.trim() &&
        !nft.artist_name.startsWith('Artist 0x') &&
        nft.artist_name.toLowerCase() !== 'artist') {
      return nft.artist_name
    }
    return formatAddress(nft.wallet_address)
  }

  // Load NFTs with pagination
  const loadNFTs = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/admin/gallery?page=${currentPage}&limit=${limit}&filter=${filter}`
      )

      if (!response.ok) {
        throw new Error('Failed to load NFTs')
      }

      const data = await response.json()
      setNfts(data.nfts || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
      setSelectedNftIds(new Set()) // Clear selection on page change

      // Progressive image loading (batch of 5 with delay)
      if (data.nfts && data.nfts.length > 0) {
        batchLoadImages(data.nfts)
      }
    } catch (error) {
      console.error('Error loading NFTs:', error)
      toast({
        title: translations.error,
        description: translations.loadError,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, filter, limit, toast, translations])

  // Batch load images to avoid rate limits
  const batchLoadImages = async (nftsToLoad: NFT[]) => {
    for (let i = 0; i < nftsToLoad.length; i += 5) {
      const batch = nftsToLoad.slice(i, i + 5)
      batch.forEach(nft => {
        if (nft.image_ipfs_hash) {
          const img = new window.Image()
          img.src = getImageUrl(nft.image_ipfs_hash)
          img.onload = () => {
            setLoadedImages(prev => new Set(prev).add(nft.id))
          }
        }
      })
      // Add delay between batches
      if (i + 5 < nftsToLoad.length) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
  }

  // Load NFTs on mount and when dependencies change
  useEffect(() => {
    loadNFTs()
  }, [loadNFTs])

  // Toggle individual NFT selection
  const toggleSelection = (nftId: string) => {
    setSelectedNftIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nftId)) {
        newSet.delete(nftId)
      } else {
        newSet.add(nftId)
      }
      return newSet
    })
  }

  // Select/deselect all NFTs on current page
  const toggleSelectAll = () => {
    if (selectedNftIds.size === nfts.length) {
      setSelectedNftIds(new Set())
    } else {
      setSelectedNftIds(new Set(nfts.map(nft => nft.id)))
    }
  }

  // Toggle single NFT gallery status
  const toggleGalleryStatus = async (nftId: string, currentStatus: boolean) => {
    try {
      setActionLoading(nftId)
      const response = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftId,
          inGallery: !currentStatus,
          adminWallet
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update gallery status')
      }

      toast({
        title: translations.success,
        description: currentStatus ? translations.removedFromGallery : translations.addedToGallery
      })

      // Reload NFTs to reflect changes
      await loadNFTs()
    } catch (error) {
      console.error('Error toggling gallery status:', error)
      toast({
        title: translations.error,
        description: 'Failed to update gallery status',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Bulk toggle gallery status
  const bulkToggleGalleryStatus = async (inGallery: boolean) => {
    if (selectedNftIds.size === 0) return

    try {
      setActionLoading('bulk')
      const response = await fetch('/api/admin/gallery/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftIds: Array.from(selectedNftIds),
          inGallery,
          adminWallet
        })
      })

      if (!response.ok) {
        throw new Error('Failed to perform bulk update')
      }

      const data = await response.json()
      toast({
        title: translations.success,
        description: `${translations.bulkUpdateSuccess}: ${data.updatedCount} ${translations.nfts}`
      })

      // Reload NFTs to reflect changes
      await loadNFTs()
    } catch (error) {
      console.error('Error in bulk update:', error)
      toast({
        title: translations.error,
        description: 'Failed to perform bulk update',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Change page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Change filter
  const changeFilter = (newFilter: FilterType) => {
    setFilter(newFilter)
    setCurrentPage(1) // Reset to first page
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{translations.title}</h2>
        <p className="text-muted-foreground">{translations.description}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => changeFilter('all')}
        >
          {translations.filterAll}
        </Button>
        <Button
          variant={filter === 'gallery' ? 'default' : 'outline'}
          onClick={() => changeFilter('gallery')}
        >
          {translations.filterInGallery}
        </Button>
        <Button
          variant={filter === 'not_gallery' ? 'default' : 'outline'}
          onClick={() => changeFilter('not_gallery')}
        >
          {translations.filterNotInGallery}
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedNftIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="font-medium">{selectedNftIds.size} selected</span>
          <Button
            size="sm"
            onClick={() => bulkToggleGalleryStatus(true)}
            disabled={actionLoading === 'bulk'}
          >
            {actionLoading === 'bulk' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
            {translations.bulkAdd}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => bulkToggleGalleryStatus(false)}
            disabled={actionLoading === 'bulk'}
          >
            {actionLoading === 'bulk' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            {translations.bulkRemove}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={toggleSelectAll}
          >
            {selectedNftIds.size === nfts.length ? translations.deselectAll : translations.selectAll}
          </Button>
        </div>
      )}

      {/* NFT Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">{translations.loading}</span>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {translations.noNfts}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nfts.map((nft) => (
            <Card key={nft.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Selection Checkbox */}
                  <div className="flex items-start pt-1">
                    <Checkbox
                      checked={selectedNftIds.has(nft.id)}
                      onCheckedChange={() => toggleSelection(nft.id)}
                    />
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                    {loadedImages.has(nft.id) ? (
                      <Image
                        src={getImageUrl(nft.image_ipfs_hash)}
                        alt={nft.name || 'NFT'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold truncate">{nft.name || 'Untitled'}</h3>
                      <Badge variant={nft.in_gallery ? 'default' : 'secondary'}>
                        {nft.in_gallery ? translations.inGallery : translations.notInGallery}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      by {getDisplayArtistName(nft)}
                    </p>
                    {nft.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {nft.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={nft.in_gallery ? 'destructive' : 'default'}
                        onClick={() => toggleGalleryStatus(nft.id, nft.in_gallery || false)}
                        disabled={actionLoading === nft.id}
                      >
                        {actionLoading === nft.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : nft.in_gallery ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            {translations.removeFromGallery}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {translations.addToGallery}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en'}/gallery`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {translations.showing} {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, total)} {translations.of} {total} {translations.nfts}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {translations.page} {currentPage} {translations.of} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
