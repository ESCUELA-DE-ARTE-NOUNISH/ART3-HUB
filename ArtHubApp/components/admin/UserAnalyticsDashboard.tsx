"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FirebaseUserSessionService } from '@/lib/services/firebase-user-session-service'
import type { UserSession, UserAnalytics } from '@/lib/firebase'
import { Users, Activity, TrendingUp, Clock } from 'lucide-react'

interface PlatformStats {
  totalUsers: number
  newUsersToday: number
  totalLogins: number
  activeUsersToday: number
  topEvents: Array<{ event_type: string; count: number }>
}

export function UserAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchWallet, setSearchWallet] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('')
  const [limit, setLimit] = useState(50)

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [analyticsData, statsData] = await Promise.all([
        FirebaseUserSessionService.getUserAnalytics(
          searchWallet || undefined,
          eventTypeFilter as any || undefined,
          limit
        ),
        FirebaseUserSessionService.getPlatformStats()
      ])
      
      setAnalytics(analyticsData)
      setPlatformStats(statsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAnalytics()
  }, [searchWallet, eventTypeFilter, limit])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
      profile_update: 'bg-blue-100 text-blue-800',
      nft_created: 'bg-purple-100 text-purple-800',
      collection_created: 'bg-orange-100 text-orange-800',
      subscription_purchased: 'bg-yellow-100 text-yellow-800',
      ai_interaction: 'bg-pink-100 text-pink-800'
    }
    return colors[eventType] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Platform Statistics */}
      {platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {platformStats.newUsersToday} new today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.totalLogins}</div>
              <p className="text-xs text-muted-foreground">
                All time sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.activeUsersToday}</div>
              <p className="text-xs text-muted-foreground">
                Users active today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Event</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {platformStats.topEvents[0]?.event_type || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {platformStats.topEvents[0]?.count || 0} times today
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by wallet address..."
              value={searchWallet}
              onChange={(e) => setSearchWallet(e.target.value)}
            />
            
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Events</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="profile_update">Profile Update</SelectItem>
                <SelectItem value="nft_created">NFT Created</SelectItem>
                <SelectItem value="collection_created">Collection Created</SelectItem>
                <SelectItem value="subscription_purchased">Subscription Purchased</SelectItem>
                <SelectItem value="ai_interaction">AI Interaction</SelectItem>
              </SelectContent>
            </Select>

            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 records</SelectItem>
                <SelectItem value="50">50 records</SelectItem>
                <SelectItem value="100">100 records</SelectItem>
                <SelectItem value="200">200 records</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadAnalytics} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="top-events">Top Events</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No analytics data found. Try adjusting your filters.
                  </p>
                ) : (
                  analytics.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge className={getEventColor(event.event_type)}>
                          {event.event_type}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {event.wallet_address.slice(0, 6)}...{event.wallet_address.slice(-4)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {event.event_data && Object.keys(event.event_data).length > 0 && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-md">
                              {JSON.stringify(event.event_data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-events">
          <Card>
            <CardHeader>
              <CardTitle>Top Events Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformStats?.topEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No events recorded today.
                  </p>
                ) : (
                  platformStats?.topEvents.map((event, index) => (
                    <div key={event.event_type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-gray-400">
                          #{index + 1}
                        </span>
                        <Badge className={getEventColor(event.event_type)}>
                          {event.event_type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{event.count}</p>
                        <p className="text-sm text-muted-foreground">times today</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}