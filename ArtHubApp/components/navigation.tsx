"use client"

import Link from "next/link"
import { Home, Search, Grid3X3, User } from "lucide-react"
import { usePathname } from "next/navigation"

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="flex justify-around py-2">
        <Link href="/" className="flex flex-col items-center px-2 py-1">
          <Home className={`h-5 w-5 ${isActive("/") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span className={`text-xs mt-1 ${isActive("/") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}>Home</span>
        </Link>
        <Link href="/explore" className="flex flex-col items-center px-2 py-1">
          <Search className={`h-5 w-5 ${isActive("/explore") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span className={`text-xs mt-1 ${isActive("/explore") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}>
            Explore
          </span>
        </Link>
        <Link href="/my-collection" className="flex flex-col items-center px-2 py-1">
          <Grid3X3 className={`h-5 w-5 ${isActive("/my-collection") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span
            className={`text-xs mt-1 ${isActive("/my-collection") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}
          >
            Collection
          </span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center px-2 py-1">
          <User className={`h-5 w-5 ${isActive("/profile") ? "text-[#FF69B4]" : "text-gray-500"}`} />
          <span className={`text-xs mt-1 ${isActive("/profile") ? "text-[#FF69B4] font-medium" : "text-gray-500"}`}>
            Profile
          </span>
        </Link>
      </div>
    </div>
  )
}
