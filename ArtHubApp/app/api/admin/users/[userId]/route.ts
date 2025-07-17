import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import type { UserProfile } from '@/lib/firebase'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    
    // Fetch user profile
    const profileRef = doc(db, COLLECTIONS.USER_PROFILES, userId)
    const profileSnap = await getDoc(profileRef)
    
    if (!profileSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const profile = profileSnap.data() as UserProfile
    
    // Optionally fetch session data if available (not required)
    let session = null
    try {
      // Try to find a session with this wallet address
      if (profile.wallet_address) {
        const sessionId = `session_${profile.wallet_address.toLowerCase()}`
        const sessionRef = doc(db, COLLECTIONS.USER_SESSIONS, sessionId)
        const sessionSnap = await getDoc(sessionRef)
        if (sessionSnap.exists()) {
          session = sessionSnap.data()
        }
      }
    } catch (error) {
      console.error('Error fetching user session:', error)
    }
    
    return NextResponse.json({
      profile: {
        ...profile,
        id: profileSnap.id // Ensure ID is included
      },
      session
    })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' }, 
      { status: 500 }
    )
  }
} 