'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Download, Search, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react'
import type { GallerySale } from '@/lib/firebase'
import { FirebaseSalesService } from '@/lib/services/firebase-sales-service'

export function SalesManagement() {
  const { toast } = useToast()

  const [sales, setSales] = useState<GallerySale[]>([])
  const [filteredSales, setFilteredSales] = useState<GallerySale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [artistFilter, setArtistFilter] = useState('')
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalArtistEarnings: 0,
    totalTreasuryFees: 0,
    averageSalePrice: 0,
    uniqueCollectors: 0
  })

  // Load sales data
  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      setIsLoading(true)
      const salesData = await FirebaseSalesService.getSales()
      const statsData = await FirebaseSalesService.getSalesStats()

      setSales(salesData)
      setFilteredSales(salesData)
      setStats(statsData)
    } catch (error: any) {
      console.error('Error loading sales:', error)
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter sales by search term and artist wallet
  useEffect(() => {
    let filtered = sales

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(sale =>
        sale.nft_name.toLowerCase().includes(search) ||
        sale.artist_name?.toLowerCase().includes(search) ||
        sale.collector_wallet.toLowerCase().includes(search)
      )
    }

    if (artistFilter) {
      filtered = filtered.filter(sale =>
        sale.artist_wallet.toLowerCase() === artistFilter.toLowerCase()
      )
    }

    setFilteredSales(filtered)
  }, [searchTerm, artistFilter, sales])

  // Export sales to CSV
  const handleExport = async () => {
    try {
      const csv = await FirebaseSalesService.exportSalesToCSV({
        artistWallet: artistFilter || undefined
      })

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gallery-sales-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `${filteredSales.length} sales exported to CSV`
      })
    } catch (error: any) {
      console.error('Error exporting sales:', error)
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Format wallet address for display
  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${stats.averageSalePrice.toFixed(2)} USDC
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Artist: ${stats.totalArtistEarnings.toFixed(2)} • Treasury: ${stats.totalTreasuryFees.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Collectors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueCollectors}</div>
            <p className="text-xs text-muted-foreground">
              Total collectors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Sales Registry</CardTitle>
          <CardDescription>
            View and export all gallery collect transactions
          </CardDescription>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by NFT name, artist, or collector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1">
              <Input
                placeholder="Filter by artist wallet (0x...)"
                value={artistFilter}
                onChange={(e) => setArtistFilter(e.target.value)}
              />
            </div>

            <Button onClick={handleExport} disabled={isLoading || filteredSales.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading sales data...
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales found
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>NFT</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Collector</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Artist Earnings</TableHead>
                    <TableHead className="text-right">Treasury Fee</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Tx</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="text-xs">
                        {formatDate(sale.created_at)}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {sale.nft_name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{sale.artist_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {formatWallet(sale.artist_wallet)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatWallet(sale.collector_wallet)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${sale.amount_usdc.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ${sale.artist_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ${sale.treasury_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sale.network}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://${sale.network === 'base-sepolia' ? 'sepolia.' : ''}basescan.org/tx/${sale.mint_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Results summary */}
          {!isLoading && filteredSales.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredSales.length} of {sales.length} sales
              {artistFilter && ` • Filtered by artist: ${formatWallet(artistFilter)}`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
