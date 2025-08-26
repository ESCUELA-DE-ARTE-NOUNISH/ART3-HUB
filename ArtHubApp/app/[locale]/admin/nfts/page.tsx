"use client"

// Prevent static generation for pages using Web3 hooks
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ClaimableNFTList } from '@/components/admin/ClaimableNFTList'
import { ArrowLeft, Plus } from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'

export default function NFTsPage() {
  const router = useRouter()
  const { isConnected } = useAccount()

  // Only redirect if user explicitly disconnects, not on initial load
  useEffect(() => {
    // Only redirect after the component has mounted and user is definitely disconnected
    const checkConnection = setTimeout(() => {
      if (!isConnected) {
        router.push('/')
      }
    }, 1000) // Give time for wallet connection to be established

    return () => clearTimeout(checkConnection)
  }, [isConnected, router])
  return (
    <div className="container max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/admin" passHref>
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold mb-1">Claimable NFTs</h1>
            <p className="text-muted-foreground">
              Create and manage NFTs that can be claimed with special codes.
            </p>
          </div>
          <Link href="/admin/nfts/create" passHref>
            <Button className="mt-4 md:mt-0">
              <Plus className="h-4 w-4 mr-2" /> 
              Create NFT
            </Button>
          </Link>
        </div>
      </div>
      
      <ClaimableNFTList />
    </div>
  )
} 