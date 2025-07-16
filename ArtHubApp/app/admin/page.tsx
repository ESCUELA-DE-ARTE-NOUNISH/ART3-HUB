"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { useAdminService } from "@/lib/services/admin-service"

export default function AdminPage() {
  const { address } = useAccount()
  const adminService = useAdminService()
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false)

  // Check if current user is admin
  useEffect(() => {
    setIsCurrentUserAdmin(adminService.isAdmin(address))
  }, [address, adminService])

  // Access control - redirect if not admin
  if (!isCurrentUserAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8 pt-20">
          <div className="max-w-2xl mx-auto">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <div className="font-semibold">Access Denied</div>
                <div className="mt-1">You need administrator privileges to access this page.</div>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Admin Panel
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Administrative tools and controls for Art3Hub platform management.
            </p>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🛡️</div>
              <p className="text-lg">
                Admin functionality coming soon...
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}