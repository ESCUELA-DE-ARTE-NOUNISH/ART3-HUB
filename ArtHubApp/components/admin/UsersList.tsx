'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { Eye } from 'lucide-react'
import Link from 'next/link'

interface User {
  userId: string
  walletAddress: string
  email: string | null
  createdAt: string
  lastLogin: string
  isProfileComplete: boolean
}

interface UsersListProps {
  pageSize?: number
}

export function UsersList({ pageSize = 10 }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}`)
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [page, pageSize])

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

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wallet</TableHead>
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