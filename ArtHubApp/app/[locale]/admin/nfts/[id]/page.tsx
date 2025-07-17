import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NFTDetailView } from '@/components/admin/NFTDetailView'
import { ArrowLeft, Pencil } from 'lucide-react'

interface NFTDetailPageProps {
  params: {
    id: string
  }
}

export default function NFTDetailPage({ params }: NFTDetailPageProps) {
  const { id } = params
  
  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/admin/nfts" passHref>
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to NFTs
          </Button>
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
          <h1 className="text-3xl font-bold">NFT Details</h1>
          <Link href={`/admin/nfts/${id}/edit`} passHref>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Edit NFT
            </Button>
          </Link>
        </div>
      </div>
      
      <Suspense fallback={<div>Loading NFT details...</div>}>
        <NFTDetailView id={id} />
      </Suspense>
    </div>
  )
} 