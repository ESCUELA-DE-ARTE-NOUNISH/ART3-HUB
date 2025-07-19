import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EditNFTForm } from '@/components/admin/EditNFTForm'

interface EditNFTPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditNFTPage({ params }: EditNFTPageProps) {
  const { id } = await params
  
  return (
    <div className="container max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <Link href={`/admin/nfts/${id}`} passHref>
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to NFT Details
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-1">Edit Claimable NFT</h1>
        <p className="text-muted-foreground mb-8">
          Update details for this claimable NFT.
        </p>
      </div>
      
      <div className="bg-card rounded-lg p-6 shadow">
        <EditNFTForm nftId={id} />
      </div>
    </div>
  )
} 