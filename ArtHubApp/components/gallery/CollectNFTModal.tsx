'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2, DollarSign } from 'lucide-react'
import type { NFT } from '@/lib/firebase'
import { useAccount } from 'wagmi'

interface CollectNFTModalProps {
  isOpen: boolean
  onClose: () => void
  nft: NFT
  onCollectSuccess?: () => void
}

const PRESET_AMOUNTS = [5, 10, 25, 50] // USDC amounts

export function CollectNFTModal({ isOpen, onClose, nft, onCollectSuccess }: CollectNFTModalProps) {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()

  const [selectedAmount, setSelectedAmount] = useState<number>(10)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [isCollecting, setIsCollecting] = useState(false)

  const getCollectAmount = (): number => {
    if (isCustom) {
      const amount = parseFloat(customAmount)
      return isNaN(amount) || amount < 1 ? 0 : amount
    }
    return selectedAmount
  }

  const treasuryFee = getCollectAmount() * 0.05 // 5%
  const artistAmount = getCollectAmount() * 0.95 // 95%

  const handleCollect = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to collect this NFT",
        variant: "destructive"
      })
      return
    }

    const amount = getCollectAmount()
    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least $1 USDC",
        variant: "destructive"
      })
      return
    }

    setIsCollecting(true)

    try {
      console.log('🎨 Collecting NFT:', {
        nft: nft.name,
        amount,
        treasuryFee,
        artistAmount,
        collector: address
      })

      const response = await fetch('/api/gallery/collect-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftId: nft.id,
          collectorAddress: address,
          amountUSDC: amount,
          artistAddress: nft.artist_wallet,
          metadata: {
            name: nft.name,
            description: nft.description,
            image_ipfs_hash: nft.image_ipfs_hash
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to collect NFT')
      }

      toast({
        title: "NFT Collected Successfully! 🎉",
        description: `You've collected "${nft.name}" for $${amount} USDC`,
      })

      onCollectSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('❌ Collect NFT error:', error)
      toast({
        title: "Collection Failed",
        description: error.message || "Failed to collect NFT. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCollecting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collect NFT</DialogTitle>
          <DialogDescription>
            Support the artist by collecting this artwork. Your contribution goes directly to the creator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* NFT Preview */}
          <div className="bg-muted rounded-lg p-4">
            <p className="font-semibold text-sm mb-1">{nft.name}</p>
            <p className="text-xs text-muted-foreground">by {nft.artist_name || 'Artist'}</p>
          </div>

          {/* Amount Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Amount (USDC)</label>

            {/* Preset Amounts */}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={!isCustom && selectedAmount === amount ? "default" : "outline"}
                  onClick={() => {
                    setIsCustom(false)
                    setSelectedAmount(amount)
                  }}
                  className="w-full"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="flex items-center gap-2">
              <Button
                variant={isCustom ? "default" : "outline"}
                onClick={() => setIsCustom(true)}
                className="flex-shrink-0"
              >
                Custom
              </Button>
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => {
                    setIsCustom(true)
                    setCustomAmount(e.target.value)
                  }}
                  onFocus={() => setIsCustom(true)}
                  className="pl-9"
                  min="1"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Artist receives:</span>
              <span className="font-semibold">${artistAmount.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee (5%):</span>
              <span>${treasuryFee.toFixed(2)} USDC</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span>${getCollectAmount().toFixed(2)} USDC</span>
            </div>
          </div>

          {/* Collect Button */}
          <Button
            onClick={handleCollect}
            disabled={isCollecting || !isConnected || getCollectAmount() < 1}
            className="w-full"
            size="lg"
          >
            {isCollecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Collecting NFT...
              </>
            ) : (
              `Collect for $${getCollectAmount().toFixed(2)} USDC`
            )}
          </Button>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to collect this NFT
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
