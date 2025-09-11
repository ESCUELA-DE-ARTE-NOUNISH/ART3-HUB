'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Eye, Users, Smartphone, Globe } from 'lucide-react'
import Link from 'next/link'

interface User {
  userId: string
  walletAddress: string
  email: string | null
  authSource: 'privy' | 'mini_app' | 'farcaster' | 'unknown'
  createdAt: string
  lastLogin: string
  isProfileComplete: boolean
}

interface AuthSourceStats {
  total: number
  privy: number
  mini_app: number
  farcaster: number
  unknown: number
  connected: number
  incomplete: number
}

interface UsersListProps {
  initialPageSize?: number
}

export function UsersList({ initialPageSize = 10 }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [isLoading, setIsLoading] = useState(true)
  const [authSourceFilter, setAuthSourceFilter] = useState<string>('all')
  const [profileStatusFilter, setProfileStatusFilter] = useState<string>('all')
  const [authSourceStats, setAuthSourceStats] = useState<AuthSourceStats | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true)
      try {
        const authParam = authSourceFilter !== 'all' ? `&authSource=${authSourceFilter}` : ''
        const statusParam = profileStatusFilter !== 'all' ? `&profileStatus=${profileStatusFilter}` : ''
        const res = await fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}${authParam}${statusParam}`)
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
        setAuthSourceStats(data.authSourceStats)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [page, pageSize, authSourceFilter, profileStatusFilter])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [authSourceFilter, profileStatusFilter])

  // Format date and time in EST timezone
  const formatDateTimeEST = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    } catch (e) {
      return '—'
    }
  }

  // Get auth source display info
  const getAuthSourceInfo = (authSource: string) => {
    switch (authSource) {
      case 'privy':
        return { label: 'Privy', color: 'bg-blue-100 text-blue-800', icon: Globe }
      case 'mini_app':
        return { label: 'Mini App', color: 'bg-purple-100 text-purple-800', icon: Smartphone }
      case 'farcaster':
        return { label: 'Farcaster', color: 'bg-purple-100 text-purple-800', icon: Smartphone }
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Users }
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Platform Statistics */}
      {authSourceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <Card className="cursor-pointer hover:bg-accent" onClick={() => { setAuthSourceFilter('all'); setProfileStatusFilter('all'); }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authSourceStats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent" onClick={() => setAuthSourceFilter('privy')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Privy Users</CardTitle>
              <Globe className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authSourceStats.privy}</div>
              <p className="text-xs text-muted-foreground">
                {authSourceStats.total > 0 ? ((authSourceStats.privy / authSourceStats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent" onClick={() => setAuthSourceFilter('mini_app')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mini App Users</CardTitle>
              <Smartphone className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authSourceStats.mini_app + authSourceStats.farcaster}</div>
              <p className="text-xs text-muted-foreground">
                {authSourceStats.total > 0 ? (((authSourceStats.mini_app + authSourceStats.farcaster) / authSourceStats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Base Mini App</CardTitle>
              <Smartphone className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authSourceStats.farcaster}</div>
              <p className="text-xs text-muted-foreground">
                {authSourceStats.total > 0 ? ((authSourceStats.farcaster / authSourceStats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent" onClick={() => setProfileStatusFilter('connected')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Users</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authSourceStats.connected}</div>
              <p className="text-xs text-muted-foreground">
                {authSourceStats.total > 0 ? ((authSourceStats.connected / authSourceStats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent" onClick={() => setProfileStatusFilter('incomplete')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incomplete Profiles</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authSourceStats.incomplete}</div>
              <p className="text-xs text-muted-foreground">
                {authSourceStats.total > 0 ? ((authSourceStats.incomplete / authSourceStats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unknown Source</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authSourceStats.unknown}</div>
              <p className="text-xs text-muted-foreground">
                {authSourceStats.total > 0 ? ((authSourceStats.unknown / authSourceStats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center space-x-2">
          <label htmlFor="auth-source-filter" className="text-sm font-medium">
            Filter by Platform:
          </label>
          <Select value={authSourceFilter} onValueChange={setAuthSourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="privy">Privy</SelectItem>
              <SelectItem value="mini_app">Mini App</SelectItem>
              <SelectItem value="farcaster">Farcaster</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="profile-status-filter" className="text-sm font-medium">
            Profile Status:
          </label>
          <Select value={profileStatusFilter} onValueChange={setProfileStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All profiles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profiles</SelectItem>
              <SelectItem value="connected">Connected Users</SelectItem>
              <SelectItem value="incomplete">Incomplete Profiles</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="page-size" className="text-sm font-medium">
            Show:
          </label>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wallet</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Created</TableHead>
              <TableHead className="hidden sm:table-cell">Last Login</TableHead>
              <TableHead className="text-center">Profile</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              : users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="truncate max-w-[120px]" title={user.walletAddress}>
                      {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const authInfo = getAuthSourceInfo(user.authSource)
                        const IconComponent = authInfo.icon
                        return (
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <Badge className={authInfo.color}>
                              {authInfo.label}
                            </Badge>
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px]">
                      {user.email || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm">
                        {formatDateTimeEST(user.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm">
                        {formatDateTimeEST(user.lastLogin)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.isProfileComplete ? (
                        <span className="inline-block rounded-full bg-green-500 w-3 h-3" title="Complete" />
                      ) : (
                        <span className="inline-block rounded-full bg-red-500 w-3 h-3" title="Incomplete" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/users/${user.userId}`} passHref>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {users.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              disabled={page * pageSize >= total} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Link href="/admin/users" passHref>
          <Button size="sm">
            View All Users
          </Button>
        </Link>
      </div>
    </div>
  )
} 