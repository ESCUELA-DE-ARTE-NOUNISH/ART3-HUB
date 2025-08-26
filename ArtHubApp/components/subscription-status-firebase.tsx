"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Crown, Check, ArrowRight, ExternalLink, Star, RefreshCw } from "lucide-react"
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi"
import { createArt3HubV4ServiceWithUtils } from "@/lib/services/art3hub-v4-service"
import { FirebaseSubscriptionService, type V6SubscriptionInfo } from "@/lib/services/firebase-subscription-service"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionStatusFirebaseProps {
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

export function SubscriptionStatusFirebase({ translations: t, onRefresh }: SubscriptionStatusFirebaseProps) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
  const { toast } = useToast()
  
  const [subscriptionData, setSubscriptionData] = useState<V6SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeType, setUpgradeType] = useState<'master' | 'elite' | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load V6 subscription data from Firebase (no contract calls!)
  useEffect(() => {
    if (!address || !isConnected) {
      console.log('❌ Cannot load subscription data - user not connected')
      setLoading(false)
      return
    }

    loadFirebaseSubscriptionData()
  }, [address, isConnected, refreshKey])

  const loadFirebaseSubscriptionData = useCallback(async () => {
    if (!address) {
      console.log('❌ Cannot load Firebase subscription data - no address')
      return
    }

    try {
      console.log('🔥 Loading V6 subscription data from Firebase for:', address)
      setLoading(true)
      
      // Get subscription from Firebase (fast, no RPC calls)
      const subscription = await FirebaseSubscriptionService.getUserSubscription(address)
      
      console.log('📊 Firebase subscription data loaded:', { 
        plan: subscription.plan,
        planName: subscription.planName,
        nftsMinted: subscription.nftsMinted,
        nftLimit: subscription.nftLimit,
        remainingNFTs: subscription.remainingNFTs,
        isActive: subscription.isActive,
        hasGaslessMinting: subscription.hasGaslessMinting,
        totalNFTs: subscription.totalNFTs,
        userCreatedNFTs: subscription.userCreatedNFTs
      })
      
      setSubscriptionData(subscription)
      
    } catch (error) {
      console.error('❌ Error loading Firebase subscription data:', error)
      
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
  }, [address])

  // Listen for global subscription refresh events
  useEffect(() => {
    const handleRefreshV6Subscription = () => {
      console.log('🔄 Global V6 Firebase subscription refresh event received')
      setRefreshKey(prev => prev + 1)
    }
    
    window.addEventListener('refreshV6Subscription', handleRefreshV6Subscription)
    window.addEventListener('refreshV4Subscription', handleRefreshV6Subscription) // Also listen to V4 events for compatibility
    return () => {
      window.removeEventListener('refreshV6Subscription', handleRefreshV6Subscription)
      window.removeEventListener('refreshV4Subscription', handleRefreshV6Subscription)
    }
  }, [])

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    console.log('🔄 Manual Firebase subscription refresh triggered')
    setRefreshKey(prev => prev + 1)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000) // Faster refresh since no contract calls
  }

  // Handle subscription upgrades (still uses smart contracts for transactions)
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
      
      console.log(`🚀 Starting V4 ${planType} plan upgrade via contract...`)
      
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
      
      // Update Firebase with the upgrade immediately after contract transaction
      console.log('🔥 Updating Firebase subscription after successful contract upgrade...')
      if (planType === 'master') {
        await FirebaseSubscriptionService.upgradeToMasterPlan(address, result.hash || result)
      } else {
        await FirebaseSubscriptionService.upgradeToElitePlan(address, result.hash || result)
      }
      
      toast({
        title: "Upgrade Successful!",
        description: `Successfully upgraded to ${planType === 'master' ? 'Master' : 'Elite Creator'} Plan!`,
      })
      
      // Refresh subscription data from Firebase
      console.log('🔄 Refreshing Firebase subscription data after upgrade...')
      setTimeout(() => {
        setRefreshKey(prev => prev + 1)
        window.dispatchEvent(new CustomEvent('refreshV6Subscription'))
        window.dispatchEvent(new CustomEvent('refreshV4Subscription'))
        onRefresh?.()
      }, 1000) // Faster refresh since we updated Firebase directly
      
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
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Firebase ⚡
            </Badge>
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
          {/* Show total NFT information if available */}
          {subscriptionData.totalNFTs !== undefined && subscriptionData.totalNFTs > subscriptionData.nftsMinted && (
            <p className="text-xs text-blue-600 mt-1">
              ℹ️ You have {subscriptionData.totalNFTs} total NFTs (including {subscriptionData.totalNFTs - subscriptionData.nftsMinted} claimable NFTs). Only user-created NFTs count toward your monthly quota.
            </p>
          )}
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

        {/* Performance Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-blue-50 p-2 rounded">
          <span>⚡ No RPC calls - Firebase powered</span>
          <span>🔥 Instant loading</span>
        </div>

        {/* Subscription Plans Cards */}
        <div className="space-y-4 pt-4 border-t max-w-md mx-auto">
          <h4 className="text-sm font-medium">Subscription Plans</h4>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Free Plan */}
            <Card className={`relative ${subscriptionData.plan === 'FREE' ? 'ring-2 ring-green-500 bg-green-50 text-black' : 'hover:shadow-md transition-shadow'}`}>
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
            <Card className={`relative ${subscriptionData.plan === 'MASTER' ? 'ring-2 ring-purple-500 bg-purple-200 text-black' : 'hover:shadow-md transition-shadow cursor-pointer texxt-white'}`}>
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