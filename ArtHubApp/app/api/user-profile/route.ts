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
    console.log('Firebase config check:', getFirebaseConfig())
    
    const body = await request.json()
    const { wallet_address, profile_complete, ...profileData } = body

    console.log('API: Updating user profile for:', wallet_address, profileData)

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    let result = false
    let errorMessage = ''

    try {
      // If only updating profile_complete status
      if (typeof profile_complete === 'boolean' && Object.keys(profileData).length === 0) {
        result = await FirebaseUserService.updateProfileCompletion(wallet_address, profile_complete)
        console.log('Profile completion update result:', result)
      } else {
        // First validate the data before attempting update
        if (profileData.username || profileData.email) {
          console.log('Validating profile data...')
          const validation = await FirebaseUserService.validateProfileData(
            { username: profileData.username, email: profileData.email },
            wallet_address
          )
          
          console.log('Validation result:', validation)
          
          if (!validation.isValid) {
            return NextResponse.json(
              { error: validation.error || 'Validation failed' },
              { status: 400 }
            )
          }
        }

        // Updating full profile data
        console.log('Updating full profile data...')
        const updatedProfile = await FirebaseUserService.updateUserProfile(wallet_address, profileData)
        console.log('Update profile result:', updatedProfile)
        result = !!updatedProfile
      }
    } catch (serviceError) {
      console.error('Service error during profile update:', serviceError)
      errorMessage = serviceError instanceof Error ? serviceError.message : 'Service error'
      result = false
    }
    
    if (!result) {
      console.error('Profile update failed:', errorMessage)
      return NextResponse.json(
        { error: errorMessage || 'Failed to update profile' },
        { status: 500 }
      )
    }

    console.log('Profile update successful')
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