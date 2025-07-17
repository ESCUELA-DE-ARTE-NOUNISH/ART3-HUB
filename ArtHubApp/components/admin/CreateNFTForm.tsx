'use client'

import { useState } from 'react'
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
import { Calendar as CalendarIcon, Upload, Loader2 } from 'lucide-react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import type { CreateClaimableNFTInput } from '@/types/nft-claim'

// Form schema
const formSchema = z.object({
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
})

type FormValues = z.infer<typeof formSchema>

export function CreateNFTForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      claimCode: '',
      startDate: new Date(),
      status: 'draft',
      network: 'base',
    },
  })

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image file size must be less than 5MB.',
        variant: 'destructive',
      })
      return
    }

    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    if (!imageFile) {
      toast({
        title: 'Image required',
        description: 'Please upload an image for the NFT.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // First, upload the image
      const formData = new FormData()
      formData.append('file', imageFile)
      
      const uploadResponse = await fetch('/api/upload-to-pinata', {
        method: 'POST',
        body: formData,
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }
      
      const uploadData = await uploadResponse.json()
      const imageHash = uploadData.ipfsHash

      // Then, create the NFT with the image hash
      const nftData: CreateClaimableNFTInput = {
        ...values,
        image: imageHash,
      }

      const createResponse = await fetch('/api/admin/nfts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nftData),
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create NFT')
      }

      const { nft } = await createResponse.json()

      toast({
        title: 'NFT Created',
        description: `Successfully created NFT: ${nft.title}`,
      })

      router.push('/admin/nfts')
    } catch (error) {
      console.error('Error creating NFT:', error)
      toast({
        title: 'Failed to create NFT',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mb-12">
        {/* Image Upload */}
        <div className="space-y-2">
          <FormLabel>NFT Image</FormLabel>
          <div className="flex flex-col items-center p-4 border border-dashed rounded-lg bg-muted/50">
            {previewUrl ? (
              <div className="relative w-full max-w-xs mb-4">
                <img 
                  src={previewUrl} 
                  alt="NFT preview" 
                  className="rounded-lg object-cover aspect-square w-full"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null)
                    setPreviewUrl(null)
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Drop an image or click to upload</p>
                <p className="text-xs text-muted-foreground mb-4">PNG, JPG or WebP (Max 5MB)</p>
              </div>
            )}
            
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={cn(previewUrl ? "hidden" : "block")}
            />
          </div>
        </div>

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
                Users will use this code to claim the NFT
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                      date < form.getValues("startDate") || 
                      date < new Date(new Date().setHours(0, 0, 0, 0))
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <Select onValueChange={field.onChange} defaultValue={field.value || 'base'}>
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

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create NFT'
          )}
        </Button>
      </form>
    </Form>
  )
} 