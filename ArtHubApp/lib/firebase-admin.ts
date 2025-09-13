import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import { getFirestore } from 'firebase-admin/firestore'

// Firebase Admin configuration
let adminApp: any

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // Initialize with environment variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    
    if (!projectId) {
      throw new Error('Firebase project ID is not configured')
    }

    try {
      // Try to initialize with service account if available
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      
      if (privateKey && clientEmail) {
        // Use service account credentials
        const serviceAccount: ServiceAccount = {
          projectId: projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail: clientEmail,
        }

        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        })
        
        console.log('✅ Firebase Admin SDK initialized with service account')
      } else {
        // Fallback to default credentials (for local development)
        adminApp = initializeApp({
          projectId: projectId,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        })
        
        console.log('✅ Firebase Admin SDK initialized with default credentials')
      }
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error)
      throw error
    }
  } else {
    adminApp = getApps()[0]
  }
}

// Initialize on module load
initializeFirebaseAdmin()

// Export admin services
export const adminDb = getFirestore(adminApp)
export const adminStorage = getStorage(adminApp)

// Helper to get admin app
export const getAdminApp = () => {
  if (!adminApp) {
    initializeFirebaseAdmin()
  }
  return adminApp
}