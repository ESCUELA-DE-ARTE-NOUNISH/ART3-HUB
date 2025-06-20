import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Types
export interface UserMemory {
  id: string
  user_id?: string
  wallet_address: string
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  art_interests: string[]
  preferred_blockchain: 'base' | 'celo' | 'zora'
  completed_tutorials: string[]
  tutorial_progress: Record<string, any>
  learning_goals: string[]
  last_interaction: string
  total_sessions: number
  successful_outcomes: number
  preferred_outcome_path?: 'tutorial' | 'opportunities' | 'create'
  conversation_context: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ConversationSession {
  id: string
  user_id?: string
  wallet_address: string
  session_start: string
  session_end?: string
  locale: string
  user_level: 'beginner' | 'intermediate' | 'advanced'
  conversation_stage: 'initial' | 'assessing' | 'recommending' | 'completed'
  outcome_path?: 'tutorial' | 'opportunities' | 'create'
  questions_asked: number
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  message_order: number
  created_at: string
}

export interface AssessmentResponse {
  id: string
  session_id: string
  question_type: string
  question_text: string
  user_response: string
  assessment_score: number
  created_at: string
}

// User Memory Management
export class ChatMemoryService {
  
  /**
   * Get user memory by wallet address
   */
  static async getUserMemory(walletAddress: string): Promise<UserMemory | null> {
    try {
      const { data, error } = await supabase
        .from('user_memory')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user memory:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserMemory:', error)
      return null
    }
  }

  /**
   * Create or update user memory
   */
  static async createOrUpdateUserMemory(
    walletAddress: string, 
    updates: Partial<Omit<UserMemory, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<UserMemory | null> {
    try {
      const { data, error } = await supabase
        .from('user_memory')
        .upsert({
          wallet_address: walletAddress.toLowerCase(),
          last_interaction: new Date().toISOString(),
          ...updates
        }, {
          onConflict: 'wallet_address'
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating user memory:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createOrUpdateUserMemory:', error)
      return null
    }
  }

  /**
   * Update user memory after successful conversation outcome
   */
  static async updateUserMemoryAfterOutcome(
    walletAddress: string,
    outcomePath: 'tutorial' | 'opportunities' | 'create',
    newContext: Record<string, any> = {}
  ): Promise<void> {
    try {
      const existingMemory = await this.getUserMemory(walletAddress)
      
      await this.createOrUpdateUserMemory(walletAddress, {
        total_sessions: (existingMemory?.total_sessions || 0) + 1,
        successful_outcomes: (existingMemory?.successful_outcomes || 0) + 1,
        preferred_outcome_path: outcomePath,
        conversation_context: {
          ...(existingMemory?.conversation_context || {}),
          ...newContext,
          last_outcome: outcomePath,
          last_outcome_timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Error updating user memory after outcome:', error)
    }
  }

  /**
   * Add completed tutorial to user memory
   */
  static async addCompletedTutorial(walletAddress: string, tutorialId: string): Promise<void> {
    try {
      const existingMemory = await this.getUserMemory(walletAddress)
      const completedTutorials = existingMemory?.completed_tutorials || []
      
      if (!completedTutorials.includes(tutorialId)) {
        await this.createOrUpdateUserMemory(walletAddress, {
          completed_tutorials: [...completedTutorials, tutorialId]
        })
      }
    } catch (error) {
      console.error('Error adding completed tutorial:', error)
    }
  }

  /**
   * Update tutorial progress
   */
  static async updateTutorialProgress(
    walletAddress: string, 
    tutorialId: string, 
    progress: Record<string, any>
  ): Promise<void> {
    try {
      const existingMemory = await this.getUserMemory(walletAddress)
      const tutorialProgress = existingMemory?.tutorial_progress || {}
      
      await this.createOrUpdateUserMemory(walletAddress, {
        tutorial_progress: {
          ...tutorialProgress,
          [tutorialId]: progress
        }
      })
    } catch (error) {
      console.error('Error updating tutorial progress:', error)
    }
  }

  // Conversation Session Management

  /**
   * Get or create a conversation session
   */
  static async getOrCreateConversationSession(
    walletAddress: string, 
    locale: string = 'en'
  ): Promise<ConversationSession | null> {
    try {
      // First try to get an active session (not completed)
      const { data: existingSession } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .in('conversation_stage', ['initial', 'assessing', 'recommending'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingSession) {
        return existingSession
      }

      // Create new session
      const { data: newSession, error } = await supabase
        .from('conversation_sessions')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          locale,
          conversation_stage: 'initial',
          user_level: 'beginner',
          questions_asked: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation session:', error)
        return null
      }

      return newSession
    } catch (error) {
      console.error('Error in getOrCreateConversationSession:', error)
      return null
    }
  }

  /**
   * Update conversation session
   */
  static async updateConversationSession(
    sessionId: string,
    updates: Partial<Omit<ConversationSession, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ConversationSession | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error updating conversation session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateConversationSession:', error)
      return null
    }
  }

  /**
   * End conversation session
   */
  static async endConversationSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('conversation_sessions')
        .update({
          conversation_stage: 'completed',
          session_end: new Date().toISOString()
        })
        .eq('id', sessionId)
    } catch (error) {
      console.error('Error ending conversation session:', error)
    }
  }

  // Message Management

  /**
   * Save conversation message
   */
  static async saveConversationMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    messageOrder: number
  ): Promise<ConversationMessage | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          message_order: messageOrder
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving conversation message:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in saveConversationMessage:', error)
      return null
    }
  }

  /**
   * Get conversation messages
   */
  static async getConversationMessages(sessionId: string): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('message_order', { ascending: true })

      if (error) {
        console.error('Error fetching conversation messages:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getConversationMessages:', error)
      return []
    }
  }

  // Assessment Management

  /**
   * Save assessment response
   */
  static async saveAssessmentResponse(
    sessionId: string,
    questionType: string,
    questionText: string,
    userResponse: string,
    assessmentScore: number
  ): Promise<AssessmentResponse | null> {
    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .insert({
          session_id: sessionId,
          question_type: questionType,
          question_text: questionText,
          user_response: userResponse,
          assessment_score: assessmentScore
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving assessment response:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in saveAssessmentResponse:', error)
      return null
    }
  }

  /**
   * Get assessment responses for a session
   */
  static async getAssessmentResponses(sessionId: string): Promise<AssessmentResponse[]> {
    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching assessment responses:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAssessmentResponses:', error)
      return []
    }
  }

  // Analytics and Insights

  /**
   * Get user conversation analytics
   */
  static async getUserAnalytics(walletAddress: string): Promise<{
    totalSessions: number
    successfulOutcomes: number
    preferredPath?: string
    averageQuestionsAsked: number
    lastInteraction?: string
  }> {
    try {
      const userMemory = await this.getUserMemory(walletAddress)
      
      const { data: sessions } = await supabase
        .from('conversation_sessions')
        .select('questions_asked, outcome_path')
        .eq('wallet_address', walletAddress.toLowerCase())

      const totalSessions = sessions?.length || 0
      const averageQuestionsAsked = totalSessions > 0 
        ? (sessions?.reduce((sum, session) => sum + session.questions_asked, 0) || 0) / totalSessions 
        : 0

      return {
        totalSessions: userMemory?.total_sessions || 0,
        successfulOutcomes: userMemory?.successful_outcomes || 0,
        preferredPath: userMemory?.preferred_outcome_path,
        averageQuestionsAsked,
        lastInteraction: userMemory?.last_interaction
      }
    } catch (error) {
      console.error('Error getting user analytics:', error)
      return {
        totalSessions: 0,
        successfulOutcomes: 0,
        averageQuestionsAsked: 0
      }
    }
  }

  /**
   * Get conversation history summary for context
   */
  static async getConversationContext(walletAddress: string): Promise<string> {
    try {
      const userMemory = await this.getUserMemory(walletAddress)
      const analytics = await this.getUserAnalytics(walletAddress)
      
      if (!userMemory) {
        return "New user - no previous conversation history."
      }

      const context = [
        `Previous sessions: ${analytics.totalSessions}`,
        `Experience level: ${userMemory.experience_level}`,
        `Interests: ${userMemory.art_interests.join(', ') || 'None specified'}`,
        `Preferred outcome: ${userMemory.preferred_outcome_path || 'None yet'}`,
        `Success rate: ${analytics.totalSessions > 0 ? Math.round((analytics.successfulOutcomes / analytics.totalSessions) * 100) : 0}%`
      ]

      if (userMemory.learning_goals.length > 0) {
        context.push(`Goals: ${userMemory.learning_goals.join(', ')}`)
      }

      if (userMemory.completed_tutorials.length > 0) {
        context.push(`Completed tutorials: ${userMemory.completed_tutorials.length}`)
      }

      return context.join(' | ')
    } catch (error) {
      console.error('Error getting conversation context:', error)
      return "Unable to retrieve conversation context."
    }
  }
}