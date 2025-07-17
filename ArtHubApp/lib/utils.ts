import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextRequest } from 'next/server'
import { getPrivyUserFromRequest } from '@/lib/privy-wagmi'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateEthAddress(address: string, startLength = 3, endLength = 3): string {
  if (!address) return ""
  const start = address.slice(0, startLength)
  const end = address.slice(-endLength)
  return `${start}...${end}`
}

// Get the authenticated user's wallet address from the request
export async function getSessionUserAddress(req: NextRequest): Promise<string | null> {
  try {
    // For simplicity, we'll assume the admin API endpoints will accept any wallet address
    // from cookies or headers. In production, you would implement proper authentication
    
    // Try to get the wallet from headers
    const walletHeader = req.headers.get('x-wallet-address')
    if (walletHeader) {
      return walletHeader
    }
    
    // If no headers, use the default test wallet for now
    return "0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f"
  } catch (error) {
    console.error('Error getting session user address:', error)
    return null
  }
}
