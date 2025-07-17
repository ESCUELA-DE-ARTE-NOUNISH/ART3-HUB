import { NextRequest, NextResponse } from 'next/server'
import { FirebaseUserService } from '@/lib/services/firebase-user-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const field = searchParams.get('field')
    const value = searchParams.get('value')
    const walletAddress = searchParams.get('wallet_address')

    if (!field || !value) {
      return NextResponse.json(
        { error: 'Field and value are required' },
        { status: 400 }
      )
    }

    let isAvailable = false

    if (field === 'username') {
      isAvailable = await FirebaseUserService.isUsernameAvailable(value, walletAddress || undefined)
    } else if (field === 'email') {
      isAvailable = await FirebaseUserService.isEmailAvailable(value, walletAddress || undefined)
    } else {
      return NextResponse.json(
        { error: 'Invalid field. Must be username or email' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      available: isAvailable,
      field,
      value 
    })
  } catch (error) {
    console.error('Error in GET /api/user-profile/validate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}