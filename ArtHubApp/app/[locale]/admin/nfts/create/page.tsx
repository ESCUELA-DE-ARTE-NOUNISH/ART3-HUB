import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CreateNFTForm } from '@/components/admin/CreateNFTForm'
import { ArrowLeft } from 'lucide-react'

export default function CreateNFTPage() {
  return (
    <div className="container max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/admin/nfts" passHref>
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to NFTs
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-1">Create Claimable NFT</h1>
        <p className="text-muted-foreground mb-8">
          Create a new NFT that users can claim with a special code.
        </p>
      </div>
      
      <div className="bg-card rounded-lg p-6 shadow">
        <CreateNFTForm />
      </div>
    </div>
  )
} 