"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Crown, Check, ArrowRight, ExternalLink } from "lucide-react"
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi"
import { SubscriptionService, PlanType } from "@/lib/services/subscription-service"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionData {
  plan: PlanType
  isActive: boolean
  expiresAt: Date | null
  nftsMinted: number
  nftQuota: number
  canMint: boolean
  hasGaslessMinting: boolean
}

interface SubscriptionStatusProps {
  translations: {
    subscription: string
    currentPlan: string
    freePlan: string
    masterPlan: string
    inactive: string
    expires: string
    nftsUsed: string
    unlimited: string
    gaslessMinting: string
    enabled: string
    disabled: string
    upgrade: string
    subscribeMaster: string
    loading: string
    month: string
  }
  onRefresh?: () => void // Optional callback for parent to request refresh
}

export function SubscriptionStatus({ translations: t, onRefresh }: SubscriptionStatusProps) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
  const { toast } = useToast()
  
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load subscription data
  useEffect(() => {
    if (!address || !publicClient || !isConnected || !chainId) {
      setLoading(false)
      return
    }

    loadSubscriptionData()
  }, [address, publicClient, isConnected, chainId, refreshKey])

  const loadSubscriptionData = useCallback(async () => {
    if (!address || !publicClient || !chainId) return

    try {
      setLoading(true)
      const subscriptionService = new SubscriptionService(publicClient, null, chainId)
      
      // Clear cache to get fresh data
      subscriptionService.clearUserCache(address)
      
      const subscription = await subscriptionService.getUserSubscription(address)
      const canMintData = await subscriptionService.canUserMint(address)
      
      console.log('🔄 Subscription data refreshed:', {
        nftsMinted: subscription.nftsMinted,
        nftLimit: subscription.nftLimit,
        plan: subscription.plan
      })
      
      setSubscriptionData({
        plan: subscription.plan,
        isActive: subscription.isActive,
        expiresAt: subscription.expiresAt,
        nftsMinted: subscription.nftsMinted,
        nftQuota: subscription.nftLimit,
        canMint: canMintData.canMint,
        hasGaslessMinting: subscription.hasGaslessMinting
      })
    } catch (error) {
      console.error('Failed to load subscription data:', error)
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [address, publicClient, chainId, toast])

  // Function to refresh subscription data
  const refreshSubscriptionData = useCallback(() => {
    console.log('🔄 Manual refresh requested')
    setRefreshKey(prev => prev + 1)
    if (onRefresh) {
      onRefresh()
    }
  }, [onRefresh])

  // Expose refresh function to parent via window event
  useEffect(() => {
    const handleRefreshSubscription = () => {
      refreshSubscriptionData()
    }
    
    window.addEventListener('refreshSubscription', handleRefreshSubscription)
    return () => window.removeEventListener('refreshSubscription', handleRefreshSubscription)
  }, [refreshSubscriptionData])

  const subscribeMasterPlan = async () => {
    if (!walletClient || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      console.log('💎 Starting Master plan upgrade...')
      
      // Create subscription service
      const subscriptionService = new SubscriptionService(publicClient!, walletClient, chainId)
      
      // Show loading toast
      toast({
        title: "Processing Upgrade",
        description: "Please confirm the transaction in your wallet...",
      })
      
      // CRITICAL: Ensure user has active Free Plan before upgrading to Master
      try {
        console.log('🔍 Checking current subscription status...')
        const currentSub = await subscriptionService.getUserSubscription(address)
        console.log('Current subscription:', currentSub)
        
        // The key requirement: User MUST have an active Free Plan on blockchain before upgrading to Master
        console.log('🆓 Ensuring user has Free plan subscription first...')
        
        toast({
          title: "Setting up subscription",
          description: "Ensuring you have Free plan before upgrading to Master...",
        })
        
        try {
          const freeHash = await subscriptionService.subscribeToFreePlan()
          console.log('✅ Free plan subscription transaction:', freeHash)
          
          // Wait for confirmation
          await new Promise(resolve => setTimeout(resolve, 5000))
          console.log('✅ Free plan setup complete')
        } catch (freeError) {
          // If free plan subscription fails because user already has one, that's OK
          if (freeError instanceof Error && freeError.message.includes('already')) {
            console.log('✅ User already has Free plan subscription')
          } else {
            console.warn('Free plan subscription issue (continuing anyway):', freeError)
          }
        }
      } catch (freeError) {
        console.error('Free plan setup error:', freeError)
        throw new Error(`Must have Free plan before upgrading to Master: ${freeError instanceof Error ? freeError.message : 'Unknown error'}`)
      }
      
      // Now attempt Master plan upgrade
      console.log('🚀 Attempting Master plan subscription...')
      
      try {
        // Try the actual master plan subscription
        const masterHash = await subscriptionService.subscribeToMasterPlan()
        console.log('✅ Master plan subscription successful:', masterHash)
        
        toast({
          title: "Success!",
          description: "Welcome to Master Plan! You now have 10 NFTs/month and gasless minting. Your monthly subscription is active.",
        })
        
        // Wait longer for blockchain state to be readable, then refresh
        await new Promise(resolve => setTimeout(resolve, 5000))  // Wait 5 seconds for blockchain state
        refreshSubscriptionData()
        
        // Trigger global refresh for other components
        window.dispatchEvent(new CustomEvent('refreshSubscription'))
        
      } catch (masterError) {
        console.error('Master plan subscription error:', masterError)
        
        // Check if it's a USDC balance issue
        if (masterError instanceof Error && masterError.message.includes('Insufficient USDC balance')) {
          toast({
            title: "Need USDC",
            description: "You need 4.99 USDC to upgrade to Master plan ($4.99/month). Get testnet USDC from a faucet first.",
            variant: "destructive"
          })
        } else if (masterError instanceof Error && (
          masterError.message.includes('USDC not configured') ||
          masterError.message.includes('price') ||
          masterError.message.includes('planConfig')
        )) {
          toast({
            title: "Testnet Limitation",
            description: "Master plan requires USDC payment which isn't fully configured on testnet. Feature works on mainnet.",
          })
        } else {
          // For other errors, show the actual error
          toast({
            title: "Upgrade Failed",
            description: `Error: ${masterError instanceof Error ? masterError.message : 'Unknown error'}`,
            variant: "destructive"
          })
        }
        
        // Still refresh to show any changes
        refreshSubscriptionData()
      }
      
    } catch (error) {
      console.error('Overall subscription error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process subscription. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            {t.subscription}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{t.loading}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getPlanBadge = (plan: PlanType, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="outline">{t.inactive}</Badge>
    }

    switch (plan) {
      case PlanType.FREE:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t.freePlan}</Badge>
      case PlanType.MASTER:
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">{t.masterPlan}</Badge>
      default:
        return <Badge variant="outline">{t.inactive}</Badge>
    }
  }

  const getProgressValue = () => {
    if (!subscriptionData || subscriptionData.nftQuota === 0) return 0
    return (subscriptionData.nftsMinted / subscriptionData.nftQuota) * 100
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          {t.subscription}
        </CardTitle>
        <CardDescription>
          {t.currentPlan}: {getPlanBadge(subscriptionData?.plan || PlanType.FREE, subscriptionData?.isActive || false)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionData && subscriptionData.isActive ? (
          <>
            {/* Subscription Details */}
            <div className="space-y-3">
              {/* Expiration */}
              {subscriptionData.expiresAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.expires}:</span>
                  <span>{subscriptionData.expiresAt.toLocaleDateString()} 
                    {subscriptionData.plan !== PlanType.FREE && (
                      <span className="text-xs text-gray-400 ml-1">(auto-renew)</span>
                    )}
                  </span>
                </div>
              )}

              {/* NFT Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.nftsUsed}:</span>
                  <span>
                    {subscriptionData.nftsMinted} / {subscriptionData.nftQuota === 999999 ? t.unlimited : subscriptionData.nftQuota}
                  </span>
                </div>
                {subscriptionData.nftQuota !== 999999 && (
                  <Progress value={getProgressValue()} className="h-2" />
                )}
              </div>

              {/* Gasless Minting */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.gaslessMinting}:</span>
                <div className="flex items-center gap-1">
                  {subscriptionData.hasGaslessMinting ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">{t.enabled}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">{t.disabled}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Manual Refresh Button */}
            <Button 
              onClick={async () => {
                console.log('🔄 Force refreshing subscription data...')
                if (publicClient && address) {
                  // Wait a moment and then refresh
                  await new Promise(resolve => setTimeout(resolve, 1000))
                  refreshSubscriptionData()
                }
              }}
              disabled={loading}
              variant="outline"
              size="sm"
              className="w-full mb-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Force Refresh
                </>
              )}
            </Button>

            {/* USDC Faucet Buttons for Testnet */}
            {subscriptionData.plan === PlanType.FREE && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 text-center mb-2">
                  You need 4.99 USDC to upgrade to Master ($4.99/month). Get testnet USDC:
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => {
                      window.open('https://faucet.circle.com/', '_blank')
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Circle Faucet
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      window.open('https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet', '_blank')
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Base Faucet
                  </Button>
                </div>
                
                <div className="text-xs text-gray-400 text-center">
                  Contract: 0x036C...7e
                </div>
                
                <Button 
                  onClick={subscribeMasterPlan}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      {t.upgrade} - $4.99/{t.month}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Inactive Subscription - shouldn't happen with default active plan, but keep as fallback */
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">Subscription inactive</p>
              
              {/* Master Plan Button */}
              <Button
                onClick={subscribeMasterPlan}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Crown className="h-4 w-4 mr-2" />
                {t.subscribeMaster} - $4.99/{t.month}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}