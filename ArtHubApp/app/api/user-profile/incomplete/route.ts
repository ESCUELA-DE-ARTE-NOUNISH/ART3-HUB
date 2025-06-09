import { NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user-service'

export async function GET() {
  try {
    const profiles = await UserService.getUsersWithIncompleteProfiles()
    
    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Error in GET /api/user-profile/incomplete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}