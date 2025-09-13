"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, User, Camera, Link, Instagram, Twitter, Users, Mail } from "lucide-react"
import { ApiService } from "@/lib/services/api-service"
import { ProfileImageSelector, type ImageSource } from "@/components/profile-image-selector"
import type { UserProfile } from "@/lib/firebase"
import Image from "next/image"

interface ProfileEditFormProps {
  userProfile: UserProfile | null
  onSuccess: () => void
}

export function ProfileEditForm({ userProfile, onSuccess }: ProfileEditFormProps) {
  const [formData, setFormData] = useState({
    name: userProfile?.name || "",
    username: userProfile?.username || "",
    email: userProfile?.email || "",
    profile_picture: userProfile?.profile_picture || "",
    banner_image: userProfile?.banner_image || "",
    instagram_url: userProfile?.instagram_url || "",
    farcaster_url: userProfile?.farcaster_url || "",
    x_url: userProfile?.x_url || "",
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    // Basic validation
    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long")
      return false
    }
    
    if (formData.username.trim().length < 3) {
      setError("Username must be at least 3 characters long")
      return false
    }
    
    // Validate username format (alphanumeric + underscore)
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores")
      return false
    }
    
    // Validate email format
    if (formData.email.trim().length === 0) {
      setError("Email is required")
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    
    // Validate URLs if provided
    const urlFields = ['profile_picture', 'banner_image', 'instagram_url', 'farcaster_url', 'x_url']
    for (const field of urlFields) {
      const value = formData[field as keyof typeof formData]
      if (value && value.trim()) {
        try {
          new URL(value)
        } catch {
          setError(`Invalid URL format for ${field.replace('_', ' ')}`)
          return false
        }
      }
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) {
      return
    }
    
    if (!userProfile?.wallet_address) {
      setError("No wallet address found")
      return
    }
    
    setLoading(true)
    
    try {
      // Clean up the form data - remove empty strings
      const cleanedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key, 
          value.trim() || null
        ])
      )
      
      const success = await ApiService.updateUserProfile(userProfile.wallet_address, cleanedData)
      
      if (success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setError("Failed to update profile. Please try again.")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("An error occurred while updating your profile.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mb-4 text-green-500">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Updated!</h3>
        <p className="text-gray-500">Your profile has been successfully updated.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value.toLowerCase())}
              placeholder="Enter your username"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Only letters, numbers, and underscores allowed
            </p>
          </div>
          
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value.toLowerCase())}
              placeholder="Enter your email address"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be a valid email address
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileImageSelector
            currentImage={formData.profile_picture}
            onImageChange={(imageUrl, source) => handleInputChange("profile_picture", imageUrl)}
            walletAddress={userProfile?.wallet_address}
            isProfilePicture={true}
          />
        </CardContent>
      </Card>

      {/* Banner Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Banner Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileImageSelector
            currentImage={formData.banner_image}
            onImageChange={(imageUrl, source) => handleInputChange("banner_image", imageUrl)}
            walletAddress={userProfile?.wallet_address}
            isProfilePicture={false}
          />
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Social Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="x_url" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              X (Twitter) Profile URL
            </Label>
            <Input
              id="x_url"
              value={formData.x_url}
              onChange={(e) => handleInputChange("x_url", e.target.value)}
              placeholder="https://x.com/yourusername"
              type="url"
            />
          </div>
          
          <div>
            <Label htmlFor="instagram_url" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram Profile URL
            </Label>
            <Input
              id="instagram_url"
              value={formData.instagram_url}
              onChange={(e) => handleInputChange("instagram_url", e.target.value)}
              placeholder="https://instagram.com/yourusername"
              type="url"
            />
          </div>
          
          <div>
            <Label htmlFor="farcaster_url" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Farcaster Profile URL
            </Label>
            <Input
              id="farcaster_url"
              value={formData.farcaster_url}
              onChange={(e) => handleInputChange("farcaster_url", e.target.value)}
              placeholder="https://warpcast.com/yourusername"
              type="url"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button 
          type="submit" 
          disabled={loading}
          className="flex-1 bg-[#FF69B4] hover:bg-[#FF1493]"
        >
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  )
}