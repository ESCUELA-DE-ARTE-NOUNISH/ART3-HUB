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
    const profileStatusFilter = searchParams.get('profileStatus')
    const searchQuery = searchParams.get('search')?.toLowerCase().trim()
    
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
    let allUsers = snapshot.docs.map(doc => {
      const data = doc.data() as UserProfile
      return {
        userId: doc.id,
        walletAddress: data.wallet_address,
        email: data.email || null,
        username: data.username || null,
        authSource: data.auth_source || 'unknown',
        createdAt: data.created_at,
        lastLogin: data.updated_at,
        isProfileComplete: Boolean(data.profile_complete)
      }
    })

    // Apply search filter
    if (searchQuery) {
      allUsers = allUsers.filter(user => {
        const walletMatch = user.walletAddress.toLowerCase().includes(searchQuery)
        const emailMatch = user.email?.toLowerCase().includes(searchQuery) || false
        const usernameMatch = user.username?.toLowerCase().includes(searchQuery) || false
        
        return walletMatch || emailMatch || usernameMatch
      })
    }
    
    // Apply profile status filter (client-side)
    if (profileStatusFilter === 'connected') {
      allUsers = allUsers.filter(user => user.isProfileComplete)
    } else if (profileStatusFilter === 'incomplete') {
      allUsers = allUsers.filter(user => !user.isProfileComplete)
    }
    
    const total = allUsers.length
    
    // Paginate results
    const users = allUsers.slice((page - 1) * pageSize, page * pageSize)
    
    // Get auth source statistics for filtering UI
    const authSourceStats = {
      total: snapshot.docs.length,
      privy: snapshot.docs.filter(doc => (doc.data() as UserProfile).auth_source === 'privy').length,
      mini_app: snapshot.docs.filter(doc => (doc.data() as UserProfile).auth_source === 'mini_app').length,
      farcaster: snapshot.docs.filter(doc => (doc.data() as UserProfile).auth_source === 'farcaster').length,
      unknown: snapshot.docs.filter(doc => !(doc.data() as UserProfile).auth_source).length,
      connected: snapshot.docs.filter(doc => Boolean((doc.data() as UserProfile).profile_complete)).length,
      incomplete: snapshot.docs.filter(doc => !Boolean((doc.data() as UserProfile).profile_complete)).length
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