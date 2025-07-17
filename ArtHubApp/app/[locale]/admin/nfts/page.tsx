import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ClaimableNFTList } from '@/components/admin/ClaimableNFTList'
import { ArrowLeft, Plus } from 'lucide-react'

export default function NFTsPage() {
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