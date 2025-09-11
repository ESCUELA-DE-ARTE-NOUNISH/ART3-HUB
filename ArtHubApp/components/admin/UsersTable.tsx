'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { Input } from '../ui/input'
import { Eye, Search, X } from 'lucide-react'
import Link from 'next/link'

interface User {
  userId: string
  walletAddress: string
  email: string | null
  username: string | null
  authSource: string
  createdAt: string
  lastLogin: string
  isProfileComplete: boolean
}

interface UsersTableProps {
  initialData?: User[]
  initialTotal?: number
  initialPage?: number
  initialPageSize?: number
}

export function UsersTable({
  initialData = [],
  initialTotal = 0,
  initialPage = 1,
  initialPageSize = 25,
}: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialData)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [isLoading, setIsLoading] = useState(true)
  const [authSourceStats, setAuthSourceStats] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true)
      try {
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
        const res = await fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}${searchParam}`)
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
  }, [page, pageSize, searchQuery])

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return '—'
    }
  }

  // Handle search
  const handleSearch = () => {
    setSearchQuery(searchInput.trim())
    setPage(1) // Reset to first page when searching
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setPage(1)
  }

  // Handle Enter key in search
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="w-full">
      {/* Environment Statistics */}
      {authSourceStats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">User Environment Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{authSourceStats.total}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{authSourceStats.privy || 0}</div>
              <div className="text-sm text-gray-600">Browser</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{authSourceStats.mini_app || 0}</div>
              <div className="text-sm text-gray-600">Mini App</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{authSourceStats.unknown || 0}</div>
              <div className="text-sm text-gray-600">Unknown</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search by wallet address, email, or username..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          {searchQuery && (
            <Button onClick={handleClearSearch} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Search results for:</span> "{searchQuery}" 
            {total > 0 ? ` (${total} ${total === 1 ? 'user' : 'users'} found)` : ' (no users found)'}
          </p>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wallet</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Username</TableHead>
              <TableHead className="hidden md:table-cell">Environment</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="hidden md:table-cell">Last Login</TableHead>
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
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              : users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="truncate max-w-[120px]" title={user.walletAddress}>
                      {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px]">
                      {user.email || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell truncate max-w-[100px]">
                      {user.username || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.authSource === 'mini_app' 
                          ? 'bg-blue-100 text-blue-800' 
                          : user.authSource === 'privy'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.authSource === 'mini_app' ? 'Mini App' : 
                         user.authSource === 'privy' ? 'Browser' : 
                         user.authSource || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(user.lastLogin)}</TableCell>
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
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                
                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? `No users found matching "${searchQuery}"` : 'No users found'}
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
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
    </div>
  )
} 