import { createClient } from '@supabase/supabase-js'

// Database types
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

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
    }
  }
}

// Supabase configuration (server-side only)
const databaseUrl = process.env.DATABASE_URL
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Extract Supabase URL from DATABASE_URL but always use explicit service key
let finalUrl = supabaseUrl
let finalKey = supabaseServiceKey

if (databaseUrl && databaseUrl.includes('supabase.co')) {
  try {
    const url = new URL(databaseUrl)
    // Extract project ID from hostname 
    let projectId = ''
    
    if (url.hostname.includes('pooler.supabase.com')) {
      // Handle pooler URLs - extract project ID from username
      const username = url.username
      if (username && username.includes('.')) {
        projectId = username.split('.')[1]
      }
    } else {
      // Handle direct URLs like postgres.projectid.supabase.co
      const hostParts = url.hostname.split('.')
      projectId = hostParts.includes('postgres') ? hostParts[1] : hostParts[0]
    }
    
    if (projectId) {
      finalUrl = `https://${projectId}.supabase.co`
      // Only use extracted URL, keep explicit service key from env
      console.log(`Extracted Supabase URL: ${finalUrl} from DATABASE_URL`)
      console.log(`Using SUPABASE_SERVICE_ROLE_KEY from environment`)
    }
  } catch (error) {
    console.warn('Failed to parse DATABASE_URL, using individual env vars', error)
  }
}

// Validate service key format (should be a JWT starting with eyJ)
if (finalKey && !finalKey.startsWith('eyJ')) {
  console.warn('Service role key does not appear to be a valid JWT token. Please check SUPABASE_SERVICE_ROLE_KEY.')
  finalKey = undefined
}

// Create Supabase client with service role key for server-side operations
export const supabase = finalUrl && finalKey 
  ? createClient<Database>(finalUrl, finalKey)
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder-key')

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(finalUrl && finalKey && 
           finalUrl !== 'https://placeholder.supabase.co' && 
           finalKey !== 'placeholder-key')
}

// Export the final configuration for debugging
export const getSupabaseConfig = () => ({
  url: finalUrl,
  keyConfigured: !!finalKey,
  isConfigured: isSupabaseConfigured()
})

// Types are already exported above