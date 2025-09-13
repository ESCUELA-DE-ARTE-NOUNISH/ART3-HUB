import { adminStorage } from '@/lib/firebase-admin'

export interface AdminStorageUploadResult {
  path: string
  url: string
  fileName: string
}

export class FirebaseAdminStorageService {
  // Upload a file to Firebase Storage using Admin SDK
  static async uploadFile(
    file: File,
    path: string = 'profile-images'
  ): Promise<AdminStorageUploadResult> {
    try {
      // Create a unique filename
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const fullPath = `${path}/${fileName}`
      
      // Get storage bucket
      const bucket = adminStorage.bucket()
      const fileRef = bucket.file(fullPath)
      
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Upload the file
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
      })
      
      // Try to make the file public (may fail with uniform bucket access)
      try {
        await fileRef.makePublic()
        console.log('✅ File made public successfully')
      } catch (publicError) {
        console.log('⚠️ Could not make file public (uniform bucket access enabled):', publicError.message)
      }
      
      // Get the public URL using the correct Firebase Storage format
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fullPath)}?alt=media`
      
      console.log(`✅ File uploaded to Firebase Storage: ${publicUrl}`)
      
      return {
        path: fullPath,
        url: publicUrl,
        fileName
      }
    } catch (error) {
      console.error('Error uploading file to Firebase Storage:', error)
      throw new Error('Failed to upload file to Firebase Storage')
    }
  }
  
  // Delete a file from storage
  static async deleteFile(path: string): Promise<boolean> {
    try {
      const bucket = adminStorage.bucket()
      const fileRef = bucket.file(path)
      await fileRef.delete()
      console.log(`✅ File deleted from Firebase Storage: ${path}`)
      return true
    } catch (error) {
      console.error('Error deleting file from Firebase Storage:', error)
      return false
    }
  }
  
  // Get file metadata
  static async getFileMetadata(path: string) {
    try {
      const bucket = adminStorage.bucket()
      const fileRef = bucket.file(path)
      const [metadata] = await fileRef.getMetadata()
      return metadata
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw new Error('Failed to get file metadata')
    }
  }
}