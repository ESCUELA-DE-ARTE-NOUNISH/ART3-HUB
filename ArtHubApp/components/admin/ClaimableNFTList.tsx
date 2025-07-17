'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { Eye, PenSquare, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { ClaimableNFT } from '@/types/nft-claim'

export function ClaimableNFTList() {
  const [nfts, setNfts] = useState<ClaimableNFT[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchNFTs() {
      setIsLoading(true)
      try {
        const response = await fetch('/api/admin/nfts')
        const data = await response.json()
        setNfts(data.nfts || [])
      } catch (error) {
        console.error('Error fetching NFTs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNFTs()
  }, [])

  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return dateString
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

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Claim Code</TableHead>
              <TableHead className="hidden md:table-cell">Start Date</TableHead>
              <TableHead className="hidden md:table-cell">End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : nfts.length > 0 ? (
              // NFT rows
              nfts.map((nft) => (
                <TableRow key={nft.id}>
                  <TableCell className="font-medium">{nft.title}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                      {nft.claimCode}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(nft.startDate)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(nft.endDate)}</TableCell>
                  <TableCell>{renderStatusBadge(nft.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/nfts/${nft.id}`} passHref>
                        <Button size="icon" variant="outline" className="h-8 w-8" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/nfts/${nft.id}/edit`} passHref>
                        <Button size="icon" variant="outline" className="h-8 w-8" title="Edit">
                          <PenSquare className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50" 
                        title="Delete"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this NFT?')) {
                            fetch(`/api/admin/nfts/${nft.id}`, { method: 'DELETE' })
                              .then(() => {
                                setNfts(nfts.filter(n => n.id !== nft.id))
                              })
                              .catch(err => console.error('Error deleting NFT:', err))
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No NFTs found. Create your first claimable NFT.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 