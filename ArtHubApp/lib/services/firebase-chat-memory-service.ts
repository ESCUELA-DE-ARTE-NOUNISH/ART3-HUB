import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  addDoc 
} from 'firebase/firestore'
import { 
  db, 
  type UserMemory, 
  type ConversationSession, 
  type ConversationMessage, 
  type AssessmentResponse,
  isFirebaseConfigured, 
  COLLECTIONS, 
  generateId, 
  getCurrentTimestamp 
} from '@/lib/firebase'

// Firebase Chat Memory Management
export class FirebaseChatMemoryService {
  
  /**
   * Get user memory by wallet address
   */
  static async getUserMemory(walletAddress: string): Promise<UserMemory | null> {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping user memory fetch')
      return null
    }

    try {
      const memoryRef = doc(db, COLLECTIONS.USER_MEMORY, walletAddress.toLowerCase())
      const memoryDoc = await getDoc(memoryRef)

      if (!memoryDoc.exists()) {
        return null
      }

      return memoryDoc.data() as UserMemory
    } catch (error) {
      console.error('Error fetching user memory:', error)
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
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping user memory update')
      return null
    }

    try {
      const memoryRef = doc(db, COLLECTIONS.USER_MEMORY, walletAddress.toLowerCase())
      const existingMemory = await getDoc(memoryRef)

      const timestamp = getCurrentTimestamp()
      
      if (existingMemory.exists()) {
        // Update existing memory
        const updateData = {
          ...updates,
          wallet_address: walletAddress.toLowerCase(),
          last_interaction: timestamp,
          updated_at: timestamp
        }
        
        await updateDoc(memoryRef, updateData)
        
        // Return updated memory
        const currentData = existingMemory.data() as UserMemory
        return { ...currentData, ...updateData }
      } else {
        // Create new memory
        const newMemory: UserMemory = {
          id: walletAddress.toLowerCase(),
          wallet_address: walletAddress.toLowerCase(),
          experience_level: 'beginner',
          art_interests: [],
          preferred_blockchain: 'base',
          completed_tutorials: [],
          tutorial_progress: {},
          learning_goals: [],
          last_interaction: timestamp,
          total_sessions: 0,
          successful_outcomes: 0,
          conversation_context: {},
          created_at: timestamp,
          updated_at: timestamp,
          ...updates
        }

        await setDoc(memoryRef, newMemory)
        return newMemory
      }
    } catch (error) {
      console.error('Error updating user memory:', error)
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
          last_outcome_timestamp: getCurrentTimestamp()
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
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping conversation session')
      return null
    }

    try {
      // For now, create a new session each time to avoid index requirements
      // This can be optimized later by creating the necessary Firestore indexes
      
      // Create new session
      const sessionId = generateId()
      const timestamp = getCurrentTimestamp()
      
      const newSession: ConversationSession = {
        id: sessionId,
        wallet_address: walletAddress.toLowerCase(),
        locale,
        conversation_stage: 'initial',
        user_level: 'beginner',
        questions_asked: 0,
        session_start: timestamp,
        created_at: timestamp,
        updated_at: timestamp
      }

      const sessionRef = doc(db, COLLECTIONS.CONVERSATION_SESSIONS, sessionId)
      await setDoc(sessionRef, newSession)

      console.log('✅ Created new conversation session:', sessionId)
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
      const sessionRef = doc(db, COLLECTIONS.CONVERSATION_SESSIONS, sessionId)
      const updateData = {
        ...updates,
        updated_at: getCurrentTimestamp()
      }
      
      await updateDoc(sessionRef, updateData)
      
      // Return updated session
      const sessionDoc = await getDoc(sessionRef)
      return sessionDoc.exists() ? sessionDoc.data() as ConversationSession : null
    } catch (error) {
      console.error('Error updating conversation session:', error)
      return null
    }
  }

  /**
   * End conversation session
   */
  static async endConversationSession(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, COLLECTIONS.CONVERSATION_SESSIONS, sessionId)
      await updateDoc(sessionRef, {
        conversation_stage: 'completed',
        session_end: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp()
      })
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
      const messageId = generateId()
      const timestamp = getCurrentTimestamp()
      
      const newMessage: ConversationMessage = {
        id: messageId,
        session_id: sessionId,
        role,
        content,
        message_order: messageOrder,
        created_at: timestamp
      }

      const messageRef = doc(db, COLLECTIONS.CONVERSATION_MESSAGES, messageId)
      await setDoc(messageRef, newMessage)

      return newMessage
    } catch (error) {
      console.error('Error saving conversation message:', error)
      return null
    }
  }

  /**
   * Get conversation messages
   */
  static async getConversationMessages(sessionId: string): Promise<ConversationMessage[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CONVERSATION_MESSAGES),
        where('session_id', '==', sessionId),
        orderBy('message_order', 'asc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as ConversationMessage)
    } catch (error) {
      console.error('Error fetching conversation messages:', error)
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
      const responseId = generateId()
      const timestamp = getCurrentTimestamp()
      
      const newResponse: AssessmentResponse = {
        id: responseId,
        session_id: sessionId,
        question_type: questionType,
        question_text: questionText,
        user_response: userResponse,
        assessment_score: assessmentScore,
        created_at: timestamp
      }

      const responseRef = doc(db, COLLECTIONS.ASSESSMENT_RESPONSES, responseId)
      await setDoc(responseRef, newResponse)

      return newResponse
    } catch (error) {
      console.error('Error saving assessment response:', error)
      return null
    }
  }

  /**
   * Get assessment responses for a session
   */
  static async getAssessmentResponses(sessionId: string): Promise<AssessmentResponse[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ASSESSMENT_RESPONSES),
        where('session_id', '==', sessionId),
        orderBy('created_at', 'asc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as AssessmentResponse)
    } catch (error) {
      console.error('Error fetching assessment responses:', error)
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
      
      const q = query(
        collection(db, COLLECTIONS.CONVERSATION_SESSIONS),
        where('wallet_address', '==', walletAddress.toLowerCase())
      )
      
      const querySnapshot = await getDocs(q)
      const sessions = querySnapshot.docs.map(doc => doc.data() as ConversationSession)
      
      const totalSessions = sessions.length
      const averageQuestionsAsked = totalSessions > 0 
        ? sessions.reduce((sum, session) => sum + session.questions_asked, 0) / totalSessions 
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