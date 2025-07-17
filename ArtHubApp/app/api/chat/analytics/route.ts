import { NextRequest, NextResponse } from 'next/server'
import { FirebaseChatMemoryService } from '@/lib/services/firebase-chat-memory-service'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    // Get user analytics and memory for intelligent chat
    const [userMemory, analytics] = await Promise.all([
      FirebaseChatMemoryService.getUserMemory(walletAddress),
      FirebaseChatMemoryService.getUserAnalytics(walletAddress)
    ])
    
    // Prepare intelligent chat profile response
    const profile = {
      experienceLevel: userMemory?.experience_level || 'beginner',
      totalSessions: analytics.totalSessions,
      successfulOutcomes: analytics.successfulOutcomes,
      preferredPath: analytics.preferredPath,
      lastInteraction: analytics.lastInteraction,
      artInterests: userMemory?.art_interests || [],
      completedTutorials: userMemory?.completed_tutorials || [],
      learningGoals: userMemory?.learning_goals || [],
      conversationContext: userMemory?.conversation_context || {},
      averageQuestionsAsked: analytics.averageQuestionsAsked,
      preferredBlockchain: userMemory?.preferred_blockchain || 'base',
      tutorialProgress: userMemory?.tutorial_progress || {}
    }
    
    return NextResponse.json(profile)
    
  } catch (error) {
    console.error('Error fetching chat analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat analytics' },
      { status: 500 }
    )
  }
}