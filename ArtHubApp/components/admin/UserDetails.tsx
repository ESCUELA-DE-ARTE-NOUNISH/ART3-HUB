'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Skeleton } from '../ui/skeleton'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ArrowLeft } from 'lucide-react'

interface UserDetail {
  profile: {
    id: string
    wallet_address: string
    name?: string
    username?: string
    email?: string
    profile_picture?: string
    banner_image?: string
    instagram_url?: string
    farcaster_url?: string
    x_url?: string
    profile_complete: boolean
    created_at: string
    updated_at: string
  }
  session?: any
}

export function UserDetails() {
  const params = useParams() as { userId: string }
  const router = useRouter()
  const [data, setData] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/users/${params.userId}`)
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`)
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Error fetching user details:', err)
        setError('Failed to load user details')
      } finally {
        setIsLoading(false)
      }
    }
    fetchDetail()
  }, [params.userId])

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleString()
    } catch (e) {
      return dateString
    }
  }

  const goBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Error</h2>
        <p>{error || 'User not found'}</p>
        <Button variant="outline" onClick={goBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    )
  }

  const { profile, session } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="outline" onClick={goBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">User Details</h1>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="font-medium">Wallet Address</div>
            <div className="text-sm break-all">{profile.wallet_address}</div>
          </div>
          
          <div>
            <div className="font-medium">Profile Status</div>
            <div className="text-sm">
              {profile.profile_complete ? (
                <span className="text-green-600 font-semibold">Complete</span>
              ) : (
                <span className="text-red-600 font-semibold">Incomplete</span>
              )}
            </div>
          </div>
          
          <div>
            <div className="font-medium">Name</div>
            <div className="text-sm">{profile.name || <span className="text-muted-foreground">—</span>}</div>
          </div>
          
          <div>
            <div className="font-medium">Username</div>
            <div className="text-sm">{profile.username || <span className="text-muted-foreground">—</span>}</div>
          </div>
          
          <div>
            <div className="font-medium">Email</div>
            <div className="text-sm">{profile.email || <span className="text-muted-foreground">—</span>}</div>
          </div>
          
          <div>
            <div className="font-medium">Created</div>
            <div className="text-sm">{formatDate(profile.created_at)}</div>
          </div>
          
          <div>
            <div className="font-medium">Last Updated</div>
            <div className="text-sm">{formatDate(profile.updated_at)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="font-medium">Instagram</div>
            <div className="text-sm">
              {profile.instagram_url ? (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {profile.instagram_url}
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          
          <div>
            <div className="font-medium">X / Twitter</div>
            <div className="text-sm">
              {profile.x_url ? (
                <a href={profile.x_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {profile.x_url}
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          
          <div>
            <div className="font-medium">Farcaster</div>
            <div className="text-sm">
              {profile.farcaster_url ? (
                <a href={profile.farcaster_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {profile.farcaster_url}
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Session Information */}
      {session && (
        <Card>
          <CardHeader>
            <CardTitle>Login Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="font-medium">Privy User ID</div>
              <div className="text-sm">{session.privy_user_id || <span className="text-muted-foreground">—</span>}</div>
            </div>
            
            <div>
              <div className="font-medium">First Login</div>
              <div className="text-sm">{formatDate(session.first_login_date)}</div>
            </div>
            
            <div>
              <div className="font-medium">Last Login</div>
              <div className="text-sm">{formatDate(session.last_login_date)}</div>
            </div>
            
            <div>
              <div className="font-medium">Total Logins</div>
              <div className="text-sm">{session.total_logins || 0}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Profile Data</h3>
            <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{JSON.stringify(profile, null, 2)}</pre>
          </div>
          {session && (
            <div>
              <h3 className="text-lg font-medium mb-2">Session Data</h3>
              <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{JSON.stringify(session, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 