import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'

// Database types (migrated from Supabase)
export interface UserProfile {
  id: string
  wallet_address: string
  profile_complete: boolean
  name?: string
  username?: string
  email?: string
  profile_picture?: string
  banner_image?: string
  instagram_url?: string
  farcaster_url?: string
  x_url?: string
  created_at: string
  updated_at: string
}

export interface NFT {
  id: string
  wallet_address: string
  name: string
  description?: string
  image_ipfs_hash: string
  metadata_ipfs_hash?: string
  transaction_hash?: string
  network: string
  royalty_percentage: number
  contract_address?: string
  token_id?: number
  created_at: string
  updated_at: string
}

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

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Initialize Firestore
export const db = getFirestore(app)

// Connect to Firestore emulator in development
if (process.env.NODE_ENV === 'development' && !process.env.FIREBASE_EMULATOR_HUB) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
  } catch (error) {
    console.log('Firestore emulator already connected or not available')
  }
}

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    firebaseConfig.apiKey !== 'your-api-key-here'
  )
}

// Export the final configuration for debugging
export const getFirebaseConfig = () => ({
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  isConfigured: isFirebaseConfigured()
})

// Collection names
export const COLLECTIONS = {
  USER_PROFILES: 'user_profiles',
  NFTS: 'nfts',
  USER_MEMORY: 'user_memory',
  CONVERSATION_SESSIONS: 'conversation_sessions',
  CONVERSATION_MESSAGES: 'conversation_messages',
  ASSESSMENT_RESPONSES: 'assessment_responses'
} as const

// Helper function to generate document ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Helper function to get current timestamp
export const getCurrentTimestamp = () => {
  return new Date().toISOString()
}