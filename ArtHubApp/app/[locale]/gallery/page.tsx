'use client'

// Prevent static generation for pages using Web3 hooks
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, Fragment } from 'react'
import { useParams } from 'next/navigation'
import { defaultLocale } from '@/config/i18n'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Heart, Info, X, Maximize2, Minimize2, Play, Pause } from 'lucide-react'
import Image from 'next/image'
import { FirebaseNFTService } from '@/lib/services/firebase-nft-service'
import type { NFT } from '@/lib/firebase'
import { useToast } from '@/hooks/use-toast'

export default function GalleryPage() {
  const params = useParams()
  const { toast } = useToast()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [nfts, setNfts] = useState<NFT[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set([0]))
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAutoplay, setIsAutoplay] = useState(false)

  const [messages, setMessages] = useState({
    title: "Art Gallery",
    loading: "Loading gallery...",
    noNfts: "No NFTs found",
    creator: "Creator",
    collection: "Collection",
    blockchain: "Blockchain",
    viewOnBaseScan: "View on BaseScan",
    previous: "Previous",
    next: "Next",
    hideDetails: "Hide Details",
    showDetails: "Show Details",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit Fullscreen",
    autoplay: "Autoplay",
    stopAutoplay: "Stop Autoplay"
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
            ...(translations.default.gallery || {})
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
        if (allNfts.length > 0) {
          setNfts(allNfts)
          // Preload first image
          setPreloadedImages(new Set([0]))
        }
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

  // Preload adjacent images
  const preloadAdjacentImages = useCallback((index: number) => {
    const indicesToPreload = [
      index - 1, // Previous
      index,     // Current
      index + 1, // Next
      index + 2  // Next + 1
    ].filter(i => i >= 0 && i < nfts.length)

    setPreloadedImages(prev => {
      const newSet = new Set(prev)
      indicesToPreload.forEach(i => newSet.add(i))
      return newSet
    })

    // Preload images in the background
    indicesToPreload.forEach(i => {
      if (nfts[i]?.image_ipfs_hash) {
        const img = new window.Image()
        img.src = getImageUrl(nfts[i].image_ipfs_hash)
      }
    })
  }, [nfts])

  // Navigate to previous NFT
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => {
      const newIndex = prev > 0 ? prev - 1 : nfts.length - 1
      preloadAdjacentImages(newIndex)
      return newIndex
    })
  }, [nfts.length, preloadAdjacentImages])

  // Navigate to next NFT
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => {
      const newIndex = prev < nfts.length - 1 ? prev + 1 : 0
      preloadAdjacentImages(newIndex)
      return newIndex
    })
  }, [nfts.length, preloadAdjacentImages])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key === 'i' || e.key === 'I') {
        setShowDetails(prev => !prev)
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext, isFullscreen])

  // Preload adjacent images when index changes
  useEffect(() => {
    if (nfts.length > 0) {
      preloadAdjacentImages(currentIndex)
    }
  }, [currentIndex, nfts.length, preloadAdjacentImages])

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  // Toggle autoplay
  const toggleAutoplay = useCallback(() => {
    setIsAutoplay(prev => !prev)
  }, [])

  // Autoplay effect - advance to next image every 10 seconds
  useEffect(() => {
    if (!isAutoplay || nfts.length === 0) return

    const autoplayInterval = setInterval(() => {
      goToNext()
    }, 10000) // 10 seconds

    return () => clearInterval(autoplayInterval)
  }, [isAutoplay, nfts.length, goToNext])

  // Touch swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">{messages.loading}</p>
        </div>
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">{messages.noNfts}</p>
        </div>
      </div>
    )
  }

  const currentNft = nfts[currentIndex]

  // Fullscreen Modal Component
  const FullscreenModal = () => (
    <div
      className="fixed inset-0 bg-black z-[9999] overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Main Image Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Current NFT Image */}
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={getImageUrl(currentNft.image_ipfs_hash)}
            alt={currentNft.name || 'NFT'}
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        {/* Navigation Buttons */}
        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          <Button
            onClick={goToPrevious}
            className="pointer-events-auto w-14 h-14 rounded-full bg-black/50 hover:bg-black/70 text-white border-2 border-white/20 backdrop-blur-sm"
            aria-label={messages.previous}
          >
            <ChevronLeft size={28} />
          </Button>
          <Button
            onClick={goToNext}
            className="pointer-events-auto w-14 h-14 rounded-full bg-black/50 hover:bg-black/70 text-white border-2 border-white/20 backdrop-blur-sm"
            aria-label={messages.next}
          >
            <ChevronRight size={28} />
          </Button>
        </div>

        {/* Counter - Top Right */}
        <div className="absolute top-4 md:top-6 right-4 md:right-6 text-white/70 text-sm md:text-base font-mono bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
          {currentIndex + 1} / {nfts.length}
        </div>

        {/* Control Icons */}
        <div className="absolute top-16 md:top-20 right-4 md:right-6 flex flex-col gap-3 z-10">
          {/* Autoplay Toggle */}
          <Button
            onClick={toggleAutoplay}
            className="w-12 h-12 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
            aria-label={isAutoplay ? messages.stopAutoplay : messages.autoplay}
            title={isAutoplay ? messages.stopAutoplay : messages.autoplay}
          >
            {isAutoplay ? <Pause size={20} /> : <Play size={20} />}
          </Button>

          {/* Exit Fullscreen */}
          <Button
            onClick={toggleFullscreen}
            className="w-12 h-12 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
            aria-label={messages.exitFullscreen}
            title={messages.exitFullscreen}
          >
            <Minimize2 size={20} />
          </Button>
        </div>

        {/* NFT Info Card - Bottom left, semi-transparent */}
        <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-24 z-10">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 md:p-5 border border-white/20 max-w-lg">
            <h1 className="text-white text-lg md:text-xl font-bold mb-2 drop-shadow-lg">
              {currentNft.name || 'Untitled'}
            </h1>
            <p className="text-white/90 text-sm md:text-base mb-2 drop-shadow-lg">
              by {getDisplayArtistName(currentNft)}
            </p>
            {currentNft.description && (
              <p className="text-white/80 text-sm line-clamp-2 drop-shadow-md">
                {currentNft.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress Indicator - Bottom center */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-64 md:w-96">
          <div className="w-full bg-white/20 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / nfts.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Keyboard Hints */}
        <div className="hidden md:block absolute bottom-6 right-6 text-white/40 text-xs text-right">
          ← → to navigate<br/>ESC to exit
        </div>
      </div>
    </div>
  )

  return (
    <Fragment>
      {/* Fullscreen Modal */}
      {isFullscreen && <FullscreenModal />}

      {/* Regular Gallery View */}
      <div
        className="fixed inset-0 bg-black overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
      {/* Main Image Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Current NFT Image */}
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={getImageUrl(currentNft.image_ipfs_hash)}
            alt={currentNft.name || 'NFT'}
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        {/* Navigation Buttons - Desktop */}
        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          <Button
            onClick={goToPrevious}
            className="pointer-events-auto w-14 h-14 rounded-full bg-black/50 hover:bg-black/70 text-white border-2 border-white/20 backdrop-blur-sm"
            aria-label={messages.previous}
          >
            <ChevronLeft size={28} />
          </Button>
          <Button
            onClick={goToNext}
            className="pointer-events-auto w-14 h-14 rounded-full bg-black/50 hover:bg-black/70 text-white border-2 border-white/20 backdrop-blur-sm"
            aria-label={messages.next}
          >
            <ChevronRight size={28} />
          </Button>
        </div>

        {/* Counter - Top Right */}
        <div className="absolute top-4 md:top-6 right-4 md:right-6 text-white/70 text-sm md:text-base font-mono bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
          {currentIndex + 1} / {nfts.length}
        </div>

        {/* NFT Info Card - Bottom left, more transparent */}
        <div className="absolute bottom-24 md:bottom-28 left-4 md:left-6 right-4 md:right-24 z-10">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 md:p-5 border border-white/20 max-w-lg">
            <h1 className="text-white text-lg md:text-xl font-bold mb-2 drop-shadow-lg">
              {currentNft.name || 'Untitled'}
            </h1>
            <p className="text-white/90 text-sm md:text-base mb-2 drop-shadow-lg">
              by {getDisplayArtistName(currentNft)}
            </p>
            {currentNft.description && (
              <p className="text-white/80 text-sm line-clamp-2 drop-shadow-md">
                {currentNft.description}
              </p>
            )}
          </div>
        </div>

        {/* Control Icons - Right side below counter */}
        <div className="absolute top-28 md:top-32 right-4 md:right-6 flex flex-col gap-3 z-10">
          {/* Autoplay Toggle */}
          <Button
            onClick={toggleAutoplay}
            className="w-12 h-12 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
            aria-label={isAutoplay ? messages.stopAutoplay : messages.autoplay}
            title={isAutoplay ? messages.stopAutoplay : messages.autoplay}
          >
            {isAutoplay ? <Pause size={20} /> : <Play size={20} />}
          </Button>

          {/* Enter Fullscreen */}
          <Button
            onClick={toggleFullscreen}
            className="w-12 h-12 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
            aria-label={messages.fullscreen}
            title={messages.fullscreen}
          >
            <Maximize2 size={20} />
          </Button>
        </div>

        {/* Bottom Bar - Details Toggle and Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                onClick={() => setShowDetails(!showDetails)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
              >
                {showDetails ? (
                  <>
                    <X size={16} className="mr-2" />
                    {messages.hideDetails}
                  </>
                ) : (
                  <>
                    <Info size={16} className="mr-2" />
                    {messages.showDetails}
                  </>
                )}
              </Button>
              <Button
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
              >
                <Heart size={16} className="mr-2" />
                Like
              </Button>
            </div>

            {/* Details Panel */}
            {showDetails && (
              <div className="bg-black/60 backdrop-blur-lg rounded-lg p-4 md:p-6 border border-white/10 animate-in slide-in-from-bottom duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                  {/* Description */}
                  {currentNft.description && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-white/70 mb-1">Description</p>
                      <p className="text-base">{currentNft.description}</p>
                    </div>
                  )}

                  {/* Creator */}
                  <div>
                    <p className="text-sm text-white/70 mb-1">{messages.creator}</p>
                    <p className="font-mono text-sm break-all">
                      {formatAddress(currentNft.wallet_address)}
                    </p>
                  </div>

                  {/* Artist Name */}
                  {currentNft.artist_name && currentNft.artist_name.trim() && (
                    <div>
                      <p className="text-sm text-white/70 mb-1">Artist Name</p>
                      <p className="text-base font-semibold">{currentNft.artist_name}</p>
                    </div>
                  )}

                  {/* Collection */}
                  {currentNft.contract_address && (
                    <div>
                      <p className="text-sm text-white/70 mb-1">{messages.collection}</p>
                      <p className="font-mono text-sm break-all">
                        {formatAddress(currentNft.contract_address)}
                      </p>
                    </div>
                  )}

                  {/* Blockchain */}
                  <div>
                    <p className="text-sm text-white/70 mb-1">{messages.blockchain}</p>
                    <p className="text-base font-semibold">
                      {currentNft.network === 'base' ? 'Base' : currentNft.network === 'base-sepolia' ? 'Base Sepolia' : 'Base'}
                    </p>
                  </div>

                  {/* Royalty */}
                  {currentNft.royalty_percentage !== undefined && (
                    <div>
                      <p className="text-sm text-white/70 mb-1">Royalty</p>
                      <p className="text-base font-semibold">{currentNft.royalty_percentage}%</p>
                    </div>
                  )}

                  {/* View on BaseScan Button */}
                  {currentNft.contract_address && (
                    <div className="md:col-span-2 mt-2">
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        onClick={() => {
                          const isTestnet = currentNft.network === 'base-sepolia'
                          const explorerUrl = isTestnet
                            ? `https://sepolia.basescan.org/address/${currentNft.contract_address}`
                            : `https://basescan.org/address/${currentNft.contract_address}`
                          window.open(explorerUrl, '_blank')
                        }}
                      >
                        {messages.viewOnBaseScan}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="mt-4">
              <div className="w-full bg-white/20 rounded-full h-1">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / nfts.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Hints - Desktop Only */}
        <div className="hidden md:block absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/40 text-sm">
          Use ← → keys or swipe to navigate • Press I for info
        </div>
      </div>
    </div>
    </Fragment>
  )
}
