"use client"

import { useUserProfile } from '@/hooks/useUserProfile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, User, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function UserProfileStatus() {
  const {
    userProfile,
    loading,
    error,
    isConnected,
    walletAddress,
    isProfileComplete,
    updateProfileCompletion,
  } = useUserProfile()

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Status
          </CardTitle>
          <CardDescription>Connect your wallet to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="flex items-center gap-2 w-fit">
            <XCircle className="h-4 w-4" />
            Not Connected
          </Badge>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Status
          </CardTitle>
          <CardDescription>Loading profile information...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Status
        </CardTitle>
        <CardDescription>
          Wallet: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Unknown'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Profile Complete:</span>
          <Badge 
            variant={isProfileComplete ? "default" : "secondary"}
            className={cn(
              "flex items-center gap-2",
              isProfileComplete 
                ? "bg-green-100 text-green-800 hover:bg-green-200" 
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            )}
          >
            {isProfileComplete ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Complete
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Incomplete
              </>
            )}
          </Badge>
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => updateProfileCompletion(!isProfileComplete)}
            variant={isProfileComplete ? "outline" : "default"}
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProfileComplete ? 'Mark as Incomplete' : 'Mark as Complete'}
          </Button>
        </div>

        {userProfile && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {new Date(userProfile.created_at).toLocaleDateString()}</p>
            <p>Updated: {new Date(userProfile.updated_at).toLocaleDateString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}