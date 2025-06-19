"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Crown, Check, ArrowRight, ExternalLink } from "lucide-react"
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi"
import { createArt3HubV3ServiceWithUtils, type V3SubscriptionInfo } from "@/lib/services/art3hub-v3-service"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionStatusV3Props {
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

export function SubscriptionStatusV3({ translations: t, onRefresh }: SubscriptionStatusV3Props) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
  const { toast } = useToast()
  
  const [subscriptionData, setSubscriptionData] = useState<V3SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load V3 subscription data
  useEffect(() => {
    if (!address || !publicClient || !isConnected || !chainId) {
      console.log('❌ Cannot load V3 subscription data - missing requirements:', { 
        address: !!address, 
        publicClient: !!publicClient, 
        isConnected,
        chainId 
      })
      
      // Provide default V3 Free Plan for connected users
      if (isConnected && address) {
        console.log('🆓 User is connected but missing client/chain data, providing default V3 Free Plan')
        setSubscriptionData({
          plan: 'FREE',
          planName: 'Free Plan V3',
          isActive: true,
          expiresAt: null,
          nftsMinted: 0,
          nftLimit: 1,
          remainingNFTs: 1,
          autoRenew: false,
          hasGaslessMinting: true // V3 has built-in gasless
        })
      }
      
      setLoading(false)
      return
    }

    loadV3SubscriptionData()
  }, [address, publicClient, isConnected, chainId, refreshKey])

  const loadV3SubscriptionData = useCallback(async () => {
    if (!address || !publicClient || !chainId) {
      console.log('❌ Cannot load V3 subscription data - missing requirements:', { 
        address: !!address, 
        publicClient: !!publicClient, 
        chainId 
      })
      return
    }

    try {
      console.log('🚀 Starting V3 subscription data load for:', { address, chainId })
      setLoading(true)
      
      console.log('🔧 Creating V3 Art3Hub Service...')
      const { art3hubV3Service } = createArt3HubV3ServiceWithUtils(publicClient, null, 'base', true) // Default to base testnet
      
      console.log('📊 Getting V3 user subscription...')
      const subscription = await art3hubV3Service.getUserSubscription(address)
      const canMintData = await art3hubV3Service.canUserMint(address)
      
      // Also check database for actual NFT count (same as create page)
      let dbNftCount = 0
      try {
        const nftResponse = await fetch(`/api/nfts?wallet_address=${address}`)
        if (nftResponse.ok) {
          const nftData = await nftResponse.json()
          dbNftCount = nftData.nfts?.length || 0
        }
      } catch (error) {
        console.warn('Could not fetch NFT count from database:', error)
      }
      
      console.log('🔍 V3 Subscription comparison (Profile page):', {
        blockchain: {
          planName: subscription.planName,
          nftsMinted: subscription.nftsMinted,
          nftLimit: subscription.nftLimit,
          isActive: subscription.isActive,
          canMint: canMintData.canMint,
          remainingNFTs: canMintData.remainingNFTs
        },
        database: {
          nftCount: dbNftCount
        }
      })
      
      // Use database count if it's higher (more accurate due to direct minting)
      const actualNftsMinted = Math.max(subscription.nftsMinted, dbNftCount)
      const actualRemainingNFTs = Math.max(0, subscription.nftLimit - actualNftsMinted)
      
      console.log('✅ Got V3 subscription data with corrected counts:', {
        ...subscription,
        nftsMinted: actualNftsMinted,
        remainingNFTs: actualRemainingNFTs
      })
      
      // Update subscription data with corrected counts
      const correctedSubscription = {
        ...subscription,
        nftsMinted: actualNftsMinted,
        remainingNFTs: actualRemainingNFTs
      }
      
      console.log('✅ Setting V3 subscription data to state:', correctedSubscription)
      setSubscriptionData(correctedSubscription)
    } catch (error) {
      console.error('Failed to load V3 subscription data:', error)
      
      // For new wallets, provide default active V3 Free Plan instead of showing error
      console.log('🆓 Providing default V3 Free Plan for new wallet due to service error')
      const fallbackData: V3SubscriptionInfo = {
        plan: 'FREE',
        planName: 'Free Plan V3',
        isActive: true,
        expiresAt: null,
        nftsMinted: 0,
        nftLimit: 1,
        remainingNFTs: 1,
        autoRenew: false,
        hasGaslessMinting: true // V3 has built-in gasless
      }
      console.log('🆓 V3 Fallback data details:', fallbackData)
      setSubscriptionData(fallbackData)
      
      // Only show error toast if it's not a contract address issue (which is expected for new networks)
      if (error instanceof Error && !error.message.includes('not deployed on chain')) {
        toast({
          title: "Note",
          description: "Using default V3 Free Plan. Some features may be limited.",
          variant: "default"
        })
      }
    } finally {
      setLoading(false)
    }
  }, [address, publicClient, chainId, toast])

  // Function to refresh V3 subscription data
  const refreshV3SubscriptionData = useCallback(() => {
    console.log('🔄 Manual V3 refresh requested')
    setRefreshKey(prev => prev + 1)
    if (onRefresh) {
      onRefresh()
    }
  }, [onRefresh])

  // Expose refresh function to parent via window event
  useEffect(() => {
    const handleRefreshV3Subscription = () => {
      refreshV3SubscriptionData()
    }
    
    window.addEventListener('refreshV3Subscription', handleRefreshV3Subscription)
    return () => window.removeEventListener('refreshV3Subscription', handleRefreshV3Subscription)
  }, [refreshV3SubscriptionData])

  const subscribeV3FreePlan = async () => {
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
      console.log('🆓 Starting V3 Free plan enrollment...')
      
      // Create V3 subscription service
      const { art3hubV3Service } = createArt3HubV3ServiceWithUtils(publicClient!, walletClient, 'base', true)
      
      // Show loading toast
      toast({
        title: "Enrolling in V3 Free Plan",
        description: "Please confirm the transaction in your wallet...",
      })
      
      // Auto-enroll in V3 Free Plan
      console.log('🆓 Auto-enrolling in V3 Free plan...')
      const freeHash = await art3hubV3Service.subscribeToFreePlan()
      console.log('✅ V3 Free plan subscription transaction:', freeHash)
      
      toast({
        title: "Success!",
        description: "Welcome to Art3Hub V3 Free Plan! You now have built-in gasless functionality.",
      })
      
      // Wait for blockchain state to be readable, then refresh
      await new Promise(resolve => setTimeout(resolve, 5000))
      refreshV3SubscriptionData()
      
      // Trigger global refresh for other components
      window.dispatchEvent(new CustomEvent('refreshV3Subscription'))
      
    } catch (error) {
      console.error('V3 Free plan enrollment error:', error)
      toast({
        title: "Enrollment Failed",
        description: error instanceof Error ? error.message : "Failed to enroll in V3 Free Plan. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const upgradeToMasterPlan = async () => {
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
      console.log('💎 Starting V3 Master plan upgrade...')
      
      // Create V3 subscription service
      const { art3hubV3Service } = createArt3HubV3ServiceWithUtils(publicClient!, walletClient, 'base', true)
      
      // Check USDC status first
      console.log('💰 Checking USDC balance and allowance...')
      toast({
        title: "Checking USDC Balance",
        description: "Verifying your USDC balance and approval status...",
      })
      
      const usdcStatus = await art3hubV3Service.checkUSDCStatus(address)
      console.log('💰 USDC Status:', usdcStatus)
      
      if (!usdcStatus.hasEnoughBalance) {
        toast({
          title: "Insufficient USDC",
          description: `You have $${(Number(usdcStatus.balance) / 1000000).toFixed(2)} USDC but need $4.99 USDC. Please get USDC from a faucet or exchange.`,
          variant: "destructive"
        })
        return
      }
      
      // Show appropriate loading message
      if (!usdcStatus.hasEnoughAllowance) {
        toast({
          title: "USDC Approval Required",
          description: "Please approve USDC spending (~$0.50 gas). Subscription upgrade will be gasless!",
        })
      } else {
        toast({
          title: "Upgrading to Master Plan",
          description: "Processing gasless subscription upgrade...",
        })
      }
      
      // Upgrade to V3 Master Plan (gasless - relayer pays gas)
      console.log('💎 Upgrading to V3 Master plan (gasless)...')
      const result = await art3hubV3Service.upgradeToMasterPlanGasless(false) // No auto-renew for now
      console.log('✅ V3 Master plan upgrade result:', result)
      
      toast({
        title: "Upgrade Successful! 🎉",
        description: "Welcome to Art3Hub V3 Master Plan! You now have 10 NFTs/month with built-in gasless functionality.",
        duration: 6000
      })
      
      // Wait for blockchain state to be readable, then refresh
      await new Promise(resolve => setTimeout(resolve, 5000))
      refreshV3SubscriptionData()
      
      // Trigger global refresh for other components
      window.dispatchEvent(new CustomEvent('refreshV3Subscription'))
      
    } catch (error) {
      console.error('V3 Master plan upgrade error:', error)
      
      let errorMessage = "Failed to upgrade to V3 Master Plan. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient USDC balance')) {
          errorMessage = error.message + " Please get USDC from a faucet or exchange."
        } else if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
          errorMessage = "Transaction cancelled. You can try again when ready."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Upgrade Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 8000
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return null
  }

  // Auto-provide V3 Free Plan for new users even when data is loading
  // Force V3 Free Plan if subscription data is null, or if it shows inactive
  const effectiveSubscriptionData = (subscriptionData && subscriptionData.isActive) ? subscriptionData : {
    plan: 'FREE' as const,
    planName: 'Free Plan V3',
    isActive: true,
    expiresAt: null,
    nftsMinted: subscriptionData?.nftsMinted || 0,
    nftLimit: 1,
    remainingNFTs: 1,
    autoRenew: false,
    hasGaslessMinting: true // V3 has built-in gasless
  }
  
  console.log('📊 effectiveV3SubscriptionData:', {
    hasRealData: !!subscriptionData,
    plan: effectiveSubscriptionData.plan,
    isActive: effectiveSubscriptionData.isActive,
    isUsingFallback: !subscriptionData
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            {t.subscription} V3
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

  const getPlanBadge = (plan: 'FREE' | 'MASTER', isActive: boolean) => {
    console.log('🏷️ getPlanBadge called with V3:', { plan, isActive, planType: typeof plan, planValue: plan })
    
    if (!isActive) {
      console.log('❌ Plan is not active, showing inactive badge')
      return <Badge variant="outline">{t.inactive}</Badge>
    }

    console.log('✅ Plan is active, checking V3 plan type...')
    switch (plan) {
      case 'FREE':
        console.log('🆓 Showing V3 Free Plan badge')
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t.freePlan} V3</Badge>
      case 'MASTER':
        console.log('💎 Showing V3 Master Plan badge')
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">{t.masterPlan} V3</Badge>
      default:
        console.log('❓ Unknown V3 plan type, showing inactive badge:', plan)
        return <Badge variant="outline">{t.inactive}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          {t.subscription} V3
        </CardTitle>
        <CardDescription>
          {t.currentPlan}: {getPlanBadge(effectiveSubscriptionData.plan, effectiveSubscriptionData.isActive)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {effectiveSubscriptionData.isActive ? (
          <>
            {/* Subscription Details */}
            <div className="space-y-3">
              {/* Expiration */}
              {effectiveSubscriptionData.expiresAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t.expires}:</span>
                  <span>{effectiveSubscriptionData.expiresAt.toLocaleDateString()} 
                    {effectiveSubscriptionData.plan !== 'FREE' && (
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
                    {effectiveSubscriptionData.nftsMinted} / {effectiveSubscriptionData.nftLimit === 999999 ? t.unlimited : effectiveSubscriptionData.nftLimit}
                    <span className="text-xs text-blue-500 ml-1">(V3)</span>
                  </span>
                </div>
                {effectiveSubscriptionData.nftLimit !== 999999 && (
                  <Progress value={effectiveSubscriptionData.nftLimit === 0 ? 0 : (effectiveSubscriptionData.nftsMinted / effectiveSubscriptionData.nftLimit) * 100} className="h-2" />
                )}
              </div>

              {/* Gasless Minting */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.gaslessMinting}:</span>
                <div className="flex items-center gap-1">
                  {effectiveSubscriptionData.hasGaslessMinting ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">{t.enabled} (V3 Built-in)</span>
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
                console.log('🔄 Force refreshing V3 subscription data...')
                if (publicClient && address) {
                  // Wait a moment and then refresh
                  await new Promise(resolve => setTimeout(resolve, 1000))
                  refreshV3SubscriptionData()
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
                  Refresh V3 Status
                </>
              )}
            </Button>

            {/* V3 Master Plan Upgrade */}
            {effectiveSubscriptionData.plan === 'FREE' && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 text-center mb-2">
                  Upgrade to Master Plan: 10 NFTs/month + built-in gasless for $4.99 USDC
                </div>
                
                <Button 
                  onClick={upgradeToMasterPlan}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Master Plan ($4.99 USDC)
                </Button>
                
                <div className="text-xs text-center text-gray-400 mt-2">
                  Need USDC? Get testnet USDC from{' '}
                  <a 
                    href="https://faucet.circle.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    Circle Faucet
                  </a>
                  {' '}or{' '}
                  <a 
                    href="https://docs.base.org/tools/bridge-faucet/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    Base Bridge
                  </a>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Inactive Subscription - shouldn't happen with default active plan, but keep as fallback */
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">V3 Subscription inactive</p>
              
              {/* V3 Free Plan Button */}
              <Button
                onClick={subscribeV3FreePlan}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Crown className="h-4 w-4 mr-2" />
                Enroll in V3 Free Plan
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}