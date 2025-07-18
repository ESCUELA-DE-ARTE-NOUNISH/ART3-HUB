'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Loader2, Trash2, Calendar, Clock, Hash, Users, Activity } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { ClaimableNFT } from '@/types/nft-claim'

interface NFTDetailViewProps {
  id: string
}

export function NFTDetailView({ id }: NFTDetailViewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [nft, setNft] = useState<ClaimableNFT | null>(null)
  
  // Fetch NFT details
  useEffect(() => {
    async function fetchNFT() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/nfts/${id}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch NFT: ${response.status}`)
        }
        
        const data = await response.json()
        setNft(data.nft)
      } catch (error) {
        console.error('Error fetching NFT:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch NFT details.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchNFT()
  }, [id])
  
  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    try {
      return format(parseISO(dateStr), 'PPP')
    } catch (e) {
      return dateStr
    }
  }
  
  // Format time helper
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    try {
      return format(parseISO(dateStr), 'PPpp')
    } catch (e) {
      return dateStr
    }
  }
  
  // Status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>
      case 'draft':
        return <Badge className="bg-yellow-500">Draft</Badge>
      case 'unpublished':
        return <Badge className="bg-gray-500">Unpublished</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  // Delete NFT
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/nfts/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete NFT: ${response.status}`)
      }
      
      toast({
        title: 'NFT Deleted',
        description: 'The NFT has been deleted successfully.',
      })
      
      router.push('/admin/nfts')
    } catch (error) {
      console.error('Error deleting NFT:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete NFT.',
        variant: 'destructive',
      })
      setIsDeleting(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  if (!nft) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        NFT not found. <Button variant="link" onClick={() => router.push('/admin/nfts')}>Return to NFT list</Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Main NFT info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{nft.title}</CardTitle>
            {renderStatusBadge(nft.status)}
          </div>
          <CardDescription>{nft.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image preview */}
            {nft.imageUrl && (
              <div className="flex flex-col items-center">
                <img 
                  src={nft.imageUrl} 
                  alt={nft.title} 
                  className="max-w-full max-h-64 object-contain rounded-md" 
                />
              </div>
            )}
            
            {/* NFT details */}
            <div className="space-y-4">
              {/* Claim Code */}
              <div className="flex items-center">
                <Hash className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Claim Code</div>
                  <div className="font-mono bg-muted px-2 py-0.5 rounded mt-1">
                    {nft.claimCode}
                  </div>
                </div>
              </div>
              
              {/* Dates */}
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Available</div>
                  <div>
                    {formatDate(nft.startDate)}
                    {nft.endDate ? ` to ${formatDate(nft.endDate)}` : ' (No end date)'}
                  </div>
                </div>
              </div>
              
              {/* Claims */}
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Claims</div>
                  <div>
                    {nft.currentClaims || 0} / {nft.maxClaims ? nft.maxClaims : '∞'}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({nft.maxClaims ? `Limited to ${nft.maxClaims}` : 'Unlimited'})
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Network */}
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Network</div>
                  <div>{nft.network || 'Base'}</div>
                </div>
              </div>
              
              {/* IPFS Metadata */}
              {nft.metadataIpfsHash && (
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-muted-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 17L12 22L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 12L12 17L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div className="text-sm font-medium">IPFS Metadata</div>
                    <div className="font-mono text-xs truncate max-w-[200px]">
                      {nft.metadataIpfsHash}
                    </div>
                    {nft.metadataUrl && (
                      <a 
                        href={nft.metadataUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View on IPFS
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Meta information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1">{formatDateTime(nft.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
              <dd className="mt-1">{formatDateTime(nft.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created By</dt>
              <dd className="mt-1 font-mono text-sm">{nft.createdBy}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Contract Address</dt>
              <dd className="mt-1 font-mono text-sm flex items-center gap-2">
                {nft.contractAddress || 'Not deployed'}
                {!nft.contractAddress && nft.status === 'published' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const address = prompt('Enter contract address for testing:')
                      if (address) {
                        // Update the NFT with the contract address
                        fetch(`/api/admin/nfts/${nft.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            contractAddress: address
                          }),
                        }).then(response => {
                          if (response.ok) {
                            toast({
                              title: 'Contract address updated',
                              description: 'The contract address has been set for testing.',
                            })
                            // Reload the page to show the updated contract address
                            window.location.reload()
                          }
                        })
                      }
                    }}
                  >
                    Set for Testing
                  </Button>
                )}
              </dd>
            </div>
            {nft.deploymentTxHash && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Deployment Transaction</dt>
                <dd className="mt-1 font-mono text-sm">
                  {nft.deploymentTxHash}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
        <CardFooter className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete NFT
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the NFT 
                  "{nft.title}" and remove it from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  )
} 