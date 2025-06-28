"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Crown, Check, ArrowRight, ExternalLink, Star, RefreshCw } from "lucide-react"
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi"
import { createArt3HubV4ServiceWithUtils, type V4SubscriptionInfo } from "@/lib/services/art3hub-v4-service"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionStatusV4Props {
  translations: {
    subscription: string
    currentPlan: string
    freePlan: string
    masterPlan: string
    elitePlan?: string
    inactive: string
    expires: string
    nftsUsed: string
    unlimited: string
    gaslessMinting: string
    enabled: string
    disabled: string
    upgrade: string
    subscribeMaster: string
    subscribeElite?: string
    loading: string
    month: string
  }
  onRefresh?: () => void // Optional callback for parent to request refresh
}

export function SubscriptionStatusV4({ translations: t, onRefresh }: SubscriptionStatusV4Props) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
  const { toast } = useToast()
  
  const [subscriptionData, setSubscriptionData] = useState<V4SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeType, setUpgradeType] = useState<'master' | 'elite' | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load V4 subscription data
  useEffect(() => {
    if (!address || !publicClient || !isConnected || !chainId) {
      console.log('❌ Cannot load V4 subscription data - missing requirements:', { 
        address: !!address, 
        publicClient: !!publicClient, 
        isConnected,
        chainId 
      })
      
      // Provide default V4 Free Plan for connected users
      if (isConnected && address) {
        console.log('🆓 User is connected but missing client/chain data, providing default V4 Free Plan')
        setSubscriptionData({
          plan: 'FREE',
          planName: 'Free Plan',
          isActive: true,
          expiresAt: null,
          nftsMinted: 0,
          nftLimit: 1, // V4 Free Plan: 1 NFT/month
          remainingNFTs: 1,
          autoRenew: false,
          hasGaslessMinting: true // V4 has built-in gasless for all plans
        })
      }
      
      setLoading(false)
      return
    }

    loadV4SubscriptionData()
  }, [address, publicClient, isConnected, chainId, refreshKey])

  const loadV4SubscriptionData = useCallback(async () => {
    if (!address || !publicClient || !chainId) {
      console.log('❌ Cannot load V4 subscription data - missing requirements:', { 
        address: !!address, 
        publicClient: !!publicClient, 
        chainId 
      })
      return
    }

    try {
      console.log('🚀 Starting V4 subscription data load for:', { address, chainId })
      setLoading(true)
      
      console.log('🔧 Creating V4 Art3Hub Service...')
      // Determine network based on chain ID
      let networkName = 'base'
      if (chainId === 999999999 || chainId === 7777777) {
        networkName = 'zora'
      } else if (chainId === 44787 || chainId === 42220) {
        networkName = 'celo'
      }
      
      const isTestingMode = chainId === 84532 || chainId === 999999999 || chainId === 44787
      
      const { art3hubV4Service } = createArt3HubV4ServiceWithUtils(publicClient, null, networkName, isTestingMode)
      
      console.log('📊 Getting V4 user subscription...')
      const subscription = await art3hubV4Service.getUserSubscription(address)
      const canMintData = await art3hubV4Service.canUserMint(address)
      
      // Also check database for actual NFT count (same as create page)
      let dbNftCount = 0
      try {
        const nftResponse = await fetch(`/api/nfts?wallet_address=${address}`)
        if (nftResponse.ok) {
          const nftData = await nftResponse.json()
          dbNftCount = nftData.nfts?.length || 0
          console.log('📊 Database NFT count:', dbNftCount)
          console.log('📊 Database NFT data sample:', nftData.nfts?.slice(0, 2))
        } else {
          console.warn('Database NFT query failed:', nftResponse.status)
        }
      } catch (error) {
        console.warn('Could not fetch NFT count from database:', error)
      }
      
      // Also try to get count from current month/plan period
      let monthlyNftCount = 0
      try {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const monthlyResponse = await fetch(`/api/nfts?wallet_address=${address}&created_after=${startOfMonth}`)
        if (monthlyResponse.ok) {
          const monthlyData = await monthlyResponse.json()
          monthlyNftCount = monthlyData.nfts?.length || 0
          console.log('📊 Monthly NFT count:', monthlyNftCount)
        }
      } catch (error) {
        console.warn('Could not fetch monthly NFT count:', error)
      }
      
      // Use the highest count among contract, database total, and monthly count
      // Note: When upgrading plans, contract count might reset but database has the real history
      // For monthly plans, we should ideally track monthly usage, but for now use total count
      const actualNftsMinted = Math.max(subscription.nftsMinted, dbNftCount, monthlyNftCount)
      const actualRemainingNFTs = Math.max(0, subscription.nftLimit - actualNftsMinted)
      
      console.log('📊 NFT count calculation:', {
        contractCount: subscription.nftsMinted,
        dbCount: dbNftCount,
        monthlyCount: monthlyNftCount,
        actualNftsMinted,
        nftLimit: subscription.nftLimit,
        actualRemainingNFTs
      })
      
      console.log('📊 V4 subscription data loaded:', { 
        plan: subscription.plan,
        planName: subscription.planName,
        nftsMinted: actualNftsMinted,
        nftLimit: subscription.nftLimit,
        isActive: subscription.isActive,
        hasGaslessMinting: subscription.hasGaslessMinting
      })
      
      setSubscriptionData({
        ...subscription,
        nftsMinted: actualNftsMinted,
        remainingNFTs: actualRemainingNFTs
      })
      
    } catch (error) {
      console.error('❌ Error loading V4 subscription data:', error)
      
      // Fallback to default free plan
      setSubscriptionData({
        plan: 'FREE',
        planName: 'Free Plan (Error)',
        isActive: true,
        expiresAt: null,
        nftsMinted: 0,
        nftLimit: 1,
        remainingNFTs: 1,
        autoRenew: false,
        hasGaslessMinting: true
      })
    } finally {
      setLoading(false)
    }
  }, [address, publicClient, chainId])

  // Listen for global subscription refresh events
  useEffect(() => {
    const handleRefreshV4Subscription = () => {
      console.log('🔄 Global V4 subscription refresh event received')
      setRefreshKey(prev => prev + 1)
    }
    
    window.addEventListener('refreshV4Subscription', handleRefreshV4Subscription)
    return () => window.removeEventListener('refreshV4Subscription', handleRefreshV4Subscription)
  }, [])

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    console.log('🔄 Manual refresh triggered')
    setRefreshKey(prev => prev + 1)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 2000)
  }

  // Handle subscription upgrades
  const handleUpgrade = async (planType: 'master' | 'elite') => {
    if (!address || !walletClient || !publicClient || !chainId) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to upgrade your subscription.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpgrading(true)
      setUpgradeType(planType)
      
      console.log(`🚀 Starting V4 ${planType} plan upgrade...`)
      
      // Determine network based on chain ID
      let networkName = 'base'
      if (chainId === 999999999 || chainId === 7777777) {
        networkName = 'zora'
      } else if (chainId === 44787 || chainId === 42220) {
        networkName = 'celo'
      }
      
      const isTestingMode = chainId === 84532 || chainId === 999999999 || chainId === 44787
      
      const { art3hubV4Service } = createArt3HubV4ServiceWithUtils(publicClient, walletClient, networkName, isTestingMode)
      
      let result
      if (planType === 'master') {
        result = await art3hubV4Service.upgradeToMasterPlanGasless(false)
      } else {
        result = await art3hubV4Service.upgradeToElitePlanGasless(false)
      }
      
      toast({
        title: "Upgrade Successful!",
        description: `Successfully upgraded to ${planType === 'master' ? 'Master' : 'Elite Creator'} Plan!`,
      })
      
      // Refresh subscription data
      console.log('🔄 Refreshing subscription data after upgrade...')
      setTimeout(() => {
        setRefreshKey(prev => prev + 1)
        window.dispatchEvent(new CustomEvent('refreshV4Subscription'))
        onRefresh?.()
      }, 2000)
      
    } catch (error) {
      console.error(`❌ Error upgrading to ${planType} plan:`, error)
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUpgrading(false)
      setUpgradeType(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{t.loading}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscriptionData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No subscription data available</p>
        </CardContent>
      </Card>
    )
  }

  const getPlanIcon = () => {
    switch (subscriptionData.plan) {
      case 'MASTER':
        return <Crown className="h-4 w-4" />
      case 'ELITE':
        return <Star className="h-4 w-4" />
      default:
        return <Check className="h-4 w-4" />
    }
  }

  const getPlanColor = () => {
    switch (subscriptionData.plan) {
      case 'MASTER':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'ELITE':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const usagePercent = subscriptionData.nftLimit > 0 
    ? (subscriptionData.nftsMinted / subscriptionData.nftLimit) * 100 
    : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getPlanIcon()}
            {t.subscription}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing || loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Badge className={`${getPlanColor()} flex items-center gap-1`}>
              {subscriptionData.planName}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {subscriptionData.isActive ? (
            <span className="text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Active
            </span>
          ) : (
            <span className="text-red-600">{t.inactive}</span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* NFT Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">{t.nftsUsed}</span>
            <span className="text-sm text-muted-foreground">
              {subscriptionData.nftsMinted} / {subscriptionData.nftLimit}
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {subscriptionData.remainingNFTs} NFTs remaining this {t.month}
          </p>
        </div>

        {/* Gasless Minting Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t.gaslessMinting}</span>
          <Badge variant={subscriptionData.hasGaslessMinting ? "default" : "secondary"}>
            {subscriptionData.hasGaslessMinting ? t.enabled : t.disabled}
          </Badge>
        </div>

        {/* Expiration */}
        {subscriptionData.expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.expires}</span>
            <span className="text-sm text-muted-foreground">
              {subscriptionData.expiresAt.toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Subscription Plans Cards */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium">Subscription Plans</h4>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Free Plan */}
            <Card className={`relative ${subscriptionData.plan === 'FREE' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md transition-shadow'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <h5 className="font-semibold">Free Plan</h5>
                  </div>
                  <div className="text-lg font-bold">$0/{t.month}</div>
                  {subscriptionData.plan === 'FREE' && (
                    <Badge className="absolute -top-2 -right-2 bg-green-600">Current</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">Perfect for getting started</p>
                {subscriptionData.plan === 'FREE' && subscriptionData.expiresAt && (
                  <p className="text-xs text-blue-600 font-medium mb-2">
                    Expires: {subscriptionData.expiresAt.toLocaleDateString()}
                  </p>
                )}
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Upload 1 gasless NFT</li>
                  <li>• Basic educational content</li>
                  <li>• AI guidance for first steps</li>
                </ul>
              </CardContent>
            </Card>

            {/* Master Plan */}
            <Card className={`relative ${subscriptionData.plan === 'MASTER' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md transition-shadow cursor-pointer'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <h5 className="font-semibold">Master Plan</h5>
                  </div>
                  <div className="text-lg font-bold">$4.99/{t.month}</div>
                  {subscriptionData.plan === 'MASTER' && (
                    <Badge className="absolute -top-2 -right-2 bg-purple-600">Current</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">Unlock your creative potential</p>
                {subscriptionData.plan === 'MASTER' && subscriptionData.expiresAt && (
                  <p className="text-xs text-purple-600 font-medium mb-2">
                    Expires: {subscriptionData.expiresAt.toLocaleDateString()}
                  </p>
                )}
                <ul className="text-xs space-y-1 text-muted-foreground mb-3">
                  <li>• 10 gasless NFT uploads</li>
                  <li>• Full AI access</li>
                  <li>• Better visibility</li>
                  <li>• Exclusive workshops</li>
                </ul>
                {subscriptionData.plan !== 'MASTER' && (
                  <Button
                    className="w-full mt-2"
                    variant={subscriptionData.plan === 'FREE' ? 'default' : 'outline'}
                    onClick={() => handleUpgrade('master')}
                    disabled={isUpgrading || subscriptionData.plan === 'ELITE'}
                    size="sm"
                  >
                    {isUpgrading && upgradeType === 'master' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {subscriptionData.plan === 'ELITE' ? 'Downgrade' : 'Upgrade to Master'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Elite Creator Plan */}
            <Card className={`relative ${subscriptionData.plan === 'ELITE' ? 'ring-2 ring-gradient-to-r from-yellow-500 to-orange-500 bg-gradient-to-br from-yellow-50 to-orange-50' : 'hover:shadow-md transition-shadow cursor-pointer'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-orange-600" />
                    <h5 className="font-semibold">Elite Creator</h5>
                  </div>
                  <div className="text-lg font-bold">$9.99/{t.month}</div>
                  {subscriptionData.plan === 'ELITE' && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500">Current</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">Premium support for serious artists</p>
                {subscriptionData.plan === 'ELITE' && subscriptionData.expiresAt && (
                  <p className="text-xs text-orange-600 font-medium mb-2">
                    Expires: {subscriptionData.expiresAt.toLocaleDateString()}
                  </p>
                )}
                <ul className="text-xs space-y-1 text-muted-foreground mb-3">
                  <li>• 25 gasless NFT uploads</li>
                  <li>• Advanced analytics</li>
                  <li>• 1:1 expert mentorship</li>
                  <li>• Priority support</li>
                  <li>• Custom branding</li>
                </ul>
                {subscriptionData.plan !== 'ELITE' && (
                  <Button
                    className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                    onClick={() => handleUpgrade('elite')}
                    disabled={isUpgrading}
                    size="sm"
                  >
                    {isUpgrading && upgradeType === 'elite' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Upgrade to Elite Creator
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}