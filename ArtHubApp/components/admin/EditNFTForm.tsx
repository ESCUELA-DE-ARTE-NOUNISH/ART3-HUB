'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon, Loader2, Upload, X } from 'lucide-react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import type { ClaimableNFT } from '@/types/nft-claim'

// Form schema
const editFormSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(100, { message: 'Title cannot be longer than 100 characters' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters long' })
    .max(500, { message: 'Description cannot be longer than 500 characters' }),
  claimCode: z
    .string()
    .min(4, { message: 'Claim code must be at least 4 characters long' })
    .max(20, { message: 'Claim code cannot be longer than 20 characters' })
    .regex(/^[a-zA-Z0-9-]+$/, { message: 'Claim code can only contain letters, numbers, and hyphens' }),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date().optional(),
  status: z.enum(['draft', 'published', 'unpublished'], {
    required_error: 'Status is required',
  }),
  maxClaims: z.coerce.number().int().min(0).optional(),
  network: z.string().optional(),
  image: z.any().optional(), // For file uploads
})

type FormValues = z.infer<typeof editFormSchema>

interface EditNFTFormProps {
  nftId: string
}

export function EditNFTForm({ nftId }: EditNFTFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [nft, setNft] = useState<ClaimableNFT | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(editFormSchema),
    // Default values will be populated after fetching NFT data
    defaultValues: {
      title: '',
      description: '',
      claimCode: '',
      startDate: new Date(),
      status: 'draft',
      network: 'base',
    },
  })

  // Fetch NFT data
  useEffect(() => {
    async function fetchNFT() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/nfts/${nftId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch NFT: ${response.status}`)
        }
        
        const data = await response.json()
        setNft(data.nft)
        
        // Set image preview if available
        if (data.nft?.imageUrl) {
          setImagePreview(data.nft.imageUrl)
        }
        
        // Set form values
        if (data.nft) {
          const nftData = data.nft
          form.reset({
            title: nftData.title,
            description: nftData.description,
            claimCode: nftData.claimCode,
            startDate: nftData.startDate ? parseISO(nftData.startDate) : new Date(),
            endDate: nftData.endDate ? parseISO(nftData.endDate) : undefined,
            status: nftData.status as any,
            maxClaims: nftData.maxClaims || 0,
            network: nftData.network || 'base',
          })
        }
      } catch (error) {
        console.error('Error fetching NFT:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch NFT details. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (nftId) {
      fetchNFT()
    }
  }, [nftId, form])

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, GIF, or WebP image.',
        variant: 'destructive',
      })
      return
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      })
      return
    }
    
    // Set image file and preview
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Clear image selection
  const clearImageSelection = () => {
    setImageFile(null)
    setImagePreview(nft?.imageUrl || null)
  }

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsSaving(true)
    
    try {
      // Handle image upload if there's a new image
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('nftId', nftId)
        
        // Upload image
        const uploadResponse = await fetch('/api/admin/nfts/upload-image', {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image')
        }
        
        const uploadResult = await uploadResponse.json()
        
        // Add image URL to values
        values.image = uploadResult.imageUrl
      }
      
      // Update NFT
      const response = await fetch(`/api/admin/nfts/${nftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update NFT: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Handle contract redeployment feedback
      if (result.contractRedeployment) {
        toast({
          title: 'NFT Updated & Contract Redeployed',
          description: `NFT updated successfully. Contract redeployed due to: ${result.contractRedeployment.reason}. New contract: ${result.contractRedeployment.newContractAddress}`,
        })
      } else {
        toast({
          title: 'NFT Updated',
          description: 'The NFT was updated successfully.',
        })
      }
      
      // Navigate back to NFT details page
      router.push(`/admin/nfts/${nftId}`)
    } catch (error) {
      console.error('Error updating NFT:', error)
      toast({
        title: 'Error',
        description: 'Failed to update NFT. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!nft) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        NFT not found. <Button variant="link" onClick={() => router.push('/admin/nfts')}>Return to NFT list</Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mb-12">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome NFT" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your NFT..."
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Claim Code */}
        <FormField
          control={form.control}
          name="claimCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Claim Code</FormLabel>
              <FormControl>
                <Input placeholder="SPECIAL-CODE-2024" {...field} />
              </FormControl>
              <FormDescription>
                Users will use this code to claim the NFT. Codes are case-insensitive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload */}
        <div className="space-y-4">
          <FormLabel>NFT Image</FormLabel>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="relative w-full max-w-xs mx-auto">
              <img 
                src={imagePreview} 
                alt="NFT Preview" 
                className="w-full h-auto rounded-lg object-cover shadow-md"
              />
              {imageFile && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={clearImageSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          
          {/* Image Upload Input */}
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF or WEBP (MAX. 5MB)
                </p>
              </div>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <FormDescription>
            Upload a new image for your NFT or keep the existing one
          </FormDescription>
        </div>

        {/* Start Date */}
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Date (Optional) */}
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>No end date (ongoing)</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    disabled={(date) => 
                      date < form.getValues("startDate") 
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Leave empty for an ongoing claim period
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="unpublished">Unpublished</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                ⚠️ Changing title, description, image, network, or republishing will trigger contract redeployment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Max Claims (Optional) */}
        <FormField
          control={form.control}
          name="maxClaims"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Claims (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="0 = Unlimited" 
                  {...field} 
                  value={field.value === undefined ? '' : field.value} 
                />
              </FormControl>
              <FormDescription>
                Maximum number of claims allowed (leave empty or set to 0 for unlimited)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Network */}
        <FormField
          control={form.control}
          name="network"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Network</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'base'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blockchain network" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="baseSepolia">Base Sepolia (Testnet)</SelectItem>
                  <SelectItem value="zora">Zora</SelectItem>
                  <SelectItem value="zoraTestnet">Zora Testnet</SelectItem>
                  <SelectItem value="celo">Celo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Preview */}
        {nft.imageUrl && (
          <div className="flex flex-col items-center p-4 border border-dashed rounded-lg bg-muted/50">
            <div className="text-sm font-medium mb-2">Current Image</div>
            <img 
              src={nft.imageUrl} 
              alt={nft.title} 
              className="max-w-xs max-h-64 object-contain rounded-md" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              To change the image, please create a new NFT
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.push(`/admin/nfts/${nftId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 