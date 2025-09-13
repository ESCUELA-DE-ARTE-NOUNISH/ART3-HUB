"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { 
  Upload, 
  Link, 
  Image as ImageIcon, 
  Loader2, 
  Check, 
  AlertCircle,
  CloudUpload,
  X
} from "lucide-react"
// Firebase Storage uploads handled server-side via admin SDK
import type { NFT } from "@/lib/firebase"
import { cn } from "@/lib/utils"

export interface ProfileImageSelectorProps {
  currentImage?: string
  onImageChange: (imageUrl: string, source: 'url' | 'upload' | 'nft') => void
  walletAddress?: string
  isProfilePicture?: boolean
}

export type ImageSource = 'url' | 'upload' | 'nft'

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
  result: string | null
}

export function ProfileImageSelector({ 
  currentImage, 
  onImageChange, 
  walletAddress,
  isProfilePicture = true 
}: ProfileImageSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<ImageSource>('upload')
  const [urlInput, setUrlInput] = useState(currentImage || '')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlValidating, setUrlValidating] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null
  })
  const [userNFTs, setUserNFTs] = useState<NFT[]>([])
  const [nftsLoading, setNftsLoading] = useState(false)
  const [nftsError, setNftsError] = useState<string | null>(null)
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Initialize URL input with current image
  useEffect(() => {
    if (currentImage && currentImage !== urlInput) {
      setUrlInput(currentImage)
    }
  }, [currentImage])

  // Load user NFTs when NFT tab is selected
  useEffect(() => {
    if (selectedTab === 'nft' && walletAddress && userNFTs.length === 0) {
      loadUserNFTs()
    }
  }, [selectedTab, walletAddress])

  const loadUserNFTs = async () => {
    if (!walletAddress) return
    
    setNftsLoading(true)
    setNftsError(null)
    
    try {
      const response = await fetch(`/api/nfts?wallet_address=${walletAddress}`)
      const data = await response.json()
      
      if (response.ok) {
        setUserNFTs(data.nfts || [])
      } else {
        setNftsError(data.error || 'Failed to load NFTs')
      }
    } catch (error) {
      console.error('Error loading NFTs:', error)
      setNftsError('Failed to load NFTs')
    } finally {
      setNftsLoading(false)
    }
  }

  const validateImageUrl = useCallback(async (url: string) => {
    if (!url.trim()) {
      setUrlError(null)
      return false
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setUrlError('Invalid URL format')
      return false
    }

    // Check if it's a supported image format
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i
    const isDirectImageUrl = imageExtensions.test(url)
    
    if (!isDirectImageUrl && !url.includes('ipfs://') && !url.includes('gateway.pinata.cloud')) {
      setUrlError('URL should point to an image file or IPFS resource')
      return false
    }

    setUrlValidating(true)
    setUrlError(null)

    // Try to load the image to verify it exists
    try {
      await new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = resolve
        img.onerror = reject
        img.src = url.startsWith('ipfs://') 
          ? `https://gateway.pinata.cloud/ipfs/${url.replace('ipfs://', '')}`
          : url
      })
      
      setUrlValidating(false)
      return true
    } catch {
      setUrlError('Unable to load image from this URL')
      setUrlValidating(false)
      return false
    }
  }, [])

  const handleUrlChange = (value: string) => {
    setUrlInput(value)
    setUrlError(null)
    
    // Debounced validation
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        validateImageUrl(value)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleUrlSubmit = async () => {
    const isValid = await validateImageUrl(urlInput)
    if (isValid) {
      onImageChange(urlInput, 'url')
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadState(prev => ({ ...prev, error: 'Please select an image file' }))
      return
    }

    // Validate file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      setUploadState(prev => ({ ...prev, error: 'File size must be less than 20MB' }))
      return
    }

    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
      result: null
    })

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }))
      }, 200)

      // Upload via API route (server-side Firebase Storage)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('walletAddress', walletAddress || 'anonymous')

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      clearInterval(progressInterval)
      
      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        result: result.url
      })

      // Auto-select the uploaded image
      onImageChange(result.url, 'upload')
      
    } catch (error) {
      console.error('Upload error:', error)
      setUploadState({
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
        result: null
      })
    }
  }

  const handleDragEvents = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(true)
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileUpload(files[0])
      }
    }
  }

  const handleNFTSelect = (nft: NFT) => {
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${nft.image_ipfs_hash}`
    setSelectedNFT(nft.id)
    onImageChange(imageUrl, 'nft')
  }

  const getImageUrl = (ipfsHash: string) => {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
  }

  const previewImageUrl = currentImage || uploadState.result || (selectedNFT && userNFTs.find(nft => nft.id === selectedNFT) 
    ? getImageUrl(userNFTs.find(nft => nft.id === selectedNFT)!.image_ipfs_hash) 
    : null)

  return (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as ImageSource)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="nft" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            My NFTs
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div
            {...handleDragEvents}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-[#FF69B4] bg-pink-50" : "border-gray-300",
              uploadState.uploading && "pointer-events-none opacity-50"
            )}
          >
            {uploadState.uploading ? (
              <div className="space-y-4">
                <CloudUpload className="h-12 w-12 mx-auto text-[#FF69B4] animate-bounce" />
                <div>
                  <p className="text-sm font-medium">Uploading to IPFS...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-[#FF69B4] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{uploadState.progress}%</p>
                </div>
              </div>
            ) : uploadState.result ? (
              <div className="space-y-4">
                <Check className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-600">Upload successful!</p>
                  <p className="text-xs text-gray-500">Image uploaded to IPFS</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <CloudUpload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Drop an image here or click to browse</p>
                  <p className="text-xs text-gray-500">Supports JPG, PNG, GIF, WebP (max 20MB)</p>
                </div>
                <Button 
                  onClick={() => document.getElementById('file-input')?.click()}
                  variant="outline"
                  type="button"
                >
                  Choose File
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                  className="hidden"
                />
              </div>
            )}
            
            {uploadState.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {uploadState.error}
                </p>
                <Button
                  onClick={() => setUploadState({ uploading: false, progress: 0, error: null, result: null })}
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-red-600 hover:text-red-700"
                  type="button"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="nft" className="space-y-4 mt-4">
          {!walletAddress ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-500">Connect your wallet to view your NFTs</p>
            </div>
          ) : nftsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-[#FF69B4] mb-4" />
              <p className="text-sm text-gray-500">Loading your NFTs...</p>
            </div>
          ) : nftsError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <p className="text-sm text-red-600 mb-4">{nftsError}</p>
              <Button onClick={loadUserNFTs} variant="outline" size="sm" type="button">
                Try Again
              </Button>
            </div>
          ) : userNFTs.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-2">No NFTs found</p>
              <p className="text-xs text-gray-400">Create your first NFT to use it as your profile image</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Select from your NFTs ({userNFTs.length})</Label>
                <Badge variant="secondary" className="text-xs">
                  {userNFTs.filter(nft => nft.source === 'user_created').length} Created
                </Badge>
              </div>
              <ScrollArea className="h-64">
                <div className="grid grid-cols-3 gap-3">
                  {userNFTs.map((nft) => (
                    <Card
                      key={nft.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedNFT === nft.id && "ring-2 ring-[#FF69B4]"
                      )}
                      onClick={() => handleNFTSelect(nft)}
                    >
                      <CardContent className="p-2">
                        <div className="aspect-square relative mb-2">
                          <Image
                            src={getImageUrl(nft.image_ipfs_hash)}
                            alt={nft.name}
                            fill
                            className="object-cover rounded-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg"
                            }}
                          />
                        </div>
                        <p className="text-xs font-medium truncate">{nft.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <Badge 
                            variant={nft.source === 'user_created' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {nft.source === 'user_created' ? 'Created' : 'Claimed'}
                          </Badge>
                          {selectedNFT === nft.id && (
                            <Check className="h-3 w-3 text-[#FF69B4]" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="image-url">
              {isProfilePicture ? 'Profile Picture URL' : 'Banner Image URL'}
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="image-url"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg or ipfs://..."
                type="url"
                className={cn(
                  urlError && "border-red-500",
                  !urlError && urlInput && "border-green-500"
                )}
              />
              <Button
                onClick={handleUrlSubmit}
                disabled={!urlInput || !!urlError || urlValidating}
                size="sm"
                type="button"
              >
                {urlValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
            {urlError && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {urlError}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Supports direct image URLs and IPFS links
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      {previewImageUrl && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className={cn(
            "relative border rounded-md overflow-hidden",
            isProfilePicture ? "w-16 h-16 rounded-full" : "w-full h-20"
          )}>
            <Image
              src={previewImageUrl}
              alt="Preview"
              fill
              className="object-cover"
              onError={() => {
                // Handle preview error
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}