import { NextRequest, NextResponse } from 'next/server'
import { db, COLLECTIONS } from '@/lib/firebase'
import { getDocs, collection, orderBy, limit, query, where, type QueryDocumentSnapshot } from 'firebase/firestore'
import type { UserProfile } from '@/lib/firebase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const authSourceFilter = searchParams.get('authSource')
    
    // Query the user_profiles collection
    const profilesRef = collection(db, COLLECTIONS.USER_PROFILES)
    let q = query(profilesRef, orderBy('created_at', 'desc'))
    
    // Add auth source filter if provided
    if (authSourceFilter && ['privy', 'mini_app', 'farcaster'].includes(authSourceFilter)) {
      q = query(
        profilesRef, 
        where('auth_source', '==', authSourceFilter),
        orderBy('created_at', 'desc')
      )
    }
    
    const snapshot = await getDocs(q)
    const allUsers: any[] = snapshot.docs.map(doc => {
      // Get the data with correct typing
      const data = doc.data() as UserProfile
      // Return the document data with the document ID
      return {
        ...data,
        docId: doc.id // Use docId instead of id to avoid conflict
      }
    })
    
    const total = allUsers.length
    
    // Paginate results
    const users = allUsers
      .slice((page - 1) * pageSize, page * pageSize)
      .map(user => ({
        userId: user.docId, // Use the document ID as userId
        walletAddress: user.wallet_address,
        email: user.email || null,
        authSource: user.auth_source || 'unknown', // Include auth source
        createdAt: user.created_at,
        lastLogin: user.updated_at, // Use updated_at since user_profiles doesn't have last_login
        isProfileComplete: Boolean(user.profile_complete)
      }))
    
    // Get auth source statistics for filtering UI
    const authSourceStats = {
      total: snapshot.docs.length,
      privy: snapshot.docs.filter(doc => (doc.data() as UserProfile).auth_source === 'privy').length,
      mini_app: snapshot.docs.filter(doc => (doc.data() as UserProfile).auth_source === 'mini_app').length,
      farcaster: snapshot.docs.filter(doc => (doc.data() as UserProfile).auth_source === 'farcaster').length,
      unknown: snapshot.docs.filter(doc => !(doc.data() as UserProfile).auth_source).length
    }
    
    return NextResponse.json({ 
      users, 
      total, 
      page, 
      pageSize,
      authSourceStats
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    )
  }
} 