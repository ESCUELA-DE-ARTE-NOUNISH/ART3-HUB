import { NextRequest, NextResponse } from 'next/server'
import { FirebaseUserService } from '@/lib/services/firebase-user-service'
import { getFirebaseConfig } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    console.log('Firebase config:', getFirebaseConfig())
    
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    console.log('Fetching profile for wallet:', walletAddress)
    const profile = await FirebaseUserService.getUserProfile(walletAddress)
    console.log('Profile result:', profile)
    
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in GET /api/user-profile:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        firebaseConfig: getFirebaseConfig()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Firebase config:', getFirebaseConfig())
    
    const body = await request.json()
    const { wallet_address } = body

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    console.log('Creating profile for wallet:', wallet_address)
    const profile = await FirebaseUserService.upsertUserProfile(wallet_address)
    console.log('Profile created:', profile)
    
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in POST /api/user-profile:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        firebaseConfig: getFirebaseConfig()
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_address, profile_complete, ...profileData } = body

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    let success = false

    // If only updating profile_complete status
    if (typeof profile_complete === 'boolean' && Object.keys(profileData).length === 0) {
      success = await FirebaseUserService.updateProfileCompletion(wallet_address, profile_complete)
    } else {
      // Updating full profile data
      const updatedProfile = await FirebaseUserService.updateUserProfile(wallet_address, profileData)
      success = !!updatedProfile
    }
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/user-profile:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        firebaseConfig: getFirebaseConfig()
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const success = await FirebaseUserService.deleteUserProfile(walletAddress)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/user-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}