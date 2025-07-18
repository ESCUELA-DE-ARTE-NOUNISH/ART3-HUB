'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

// Form schema
const claimFormSchema = z.object({
  claimCode: z.string()
    .min(3, { message: 'Claim code must be at least 3 characters long' })
    .max(20, { message: 'Claim code must be less than 20 characters' })
    .regex(/^[A-Za-z0-9\-]+$/, { message: 'Claim code can only contain letters, numbers, and hyphens' })
})

interface NFTClaimFormProps {
  onSuccess?: (data: any) => void
}

export function NFTClaimForm({ onSuccess }: NFTClaimFormProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean
    message: string
    nft?: {
      id: string
      title: string
      description: string
      imageUrl?: string
    }
  } | null>(null)

  // Initialize form
  const form = useForm<z.infer<typeof claimFormSchema>>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      claimCode: ''
    }
  })

  // Verify claim code
  const verifyClaimCode = async (claimCode: string) => {
    setIsVerifying(true)
    setVerificationResult(null)
    
    try {
      const response = await fetch(`/api/nfts/claim?code=${encodeURIComponent(claimCode)}`)
      const data = await response.json()
      
      setVerificationResult(data)
      return data
    } catch (error) {
      console.error('Error verifying claim code:', error)
      setVerificationResult({
        valid: false,
        message: 'Failed to verify claim code. Please try again.'
      })
      return null
    } finally {
      setIsVerifying(false)
    }
  }

  // Process claim
  const processClaim = async (claimCode: string) => {
    setIsClaiming(true)
    
    try {
      const response = await fetch('/api/nfts/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          claimCode
          // Contract address will be retrieved from the NFT record
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        if (onSuccess) onSuccess(result)
        form.reset()
        setVerificationResult(null)
      } else {
        setVerificationResult({
          valid: false,
          message: result.message || 'Failed to claim NFT'
        })
      }
      
      return result
    } catch (error) {
      console.error('Error claiming NFT:', error)
      setVerificationResult({
        valid: false,
        message: 'Failed to claim NFT. Please try again.'
      })
    } finally {
      setIsClaiming(false)
    }
  }

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof claimFormSchema>) => {
    // First verify if not already verified or invalid
    if (!verificationResult || !verificationResult.valid) {
      const verification = await verifyClaimCode(values.claimCode)
      if (!verification?.valid) return
    }
    
    // Process claim if verification is successful
    await processClaim(values.claimCode)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Claim Your NFT</CardTitle>
        <CardDescription>
          Enter your special claim code to mint your exclusive NFT
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="claimCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SPECIAL-CODE-2024"
                      {...field}
                      value={field.value.toUpperCase()} // Always display uppercase
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())} // Convert to uppercase
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Claim codes are case-insensitive (e.g., "Code123" is the same as "CODE123")
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Verification Status */}
            {verificationResult && (
              <div className={`p-3 rounded-md ${verificationResult.valid ? 'bg-green-50' : 'bg-red-50'} flex items-center gap-2`}>
                {verificationResult.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className={verificationResult.valid ? 'text-green-700' : 'text-red-700'}>
                  {verificationResult.message}
                </span>
              </div>
            )}

            {/* NFT Details (if verified) */}
            {verificationResult?.valid && verificationResult.nft && (
              <div className="pt-4">
                <h3 className="text-sm font-semibold mb-1">You're about to claim:</h3>
                <div className="flex gap-4 items-center">
                  {verificationResult.nft.imageUrl && (
                    <img 
                      src={verificationResult.nft.imageUrl} 
                      alt={verificationResult.nft.title} 
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{verificationResult.nft.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {verificationResult.nft.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {!verificationResult?.valid ? (
                <Button 
                  type="button" 
                  className="w-full" 
                  onClick={() => verifyClaimCode(form.getValues('claimCode'))}
                  disabled={isVerifying || !form.formState.isValid}
                >
                  {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Code
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isClaiming || !verificationResult.valid}
                >
                  {isClaiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Claim NFT
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 