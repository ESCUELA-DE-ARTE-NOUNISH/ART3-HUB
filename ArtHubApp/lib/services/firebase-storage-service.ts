import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export interface StorageUploadResult {
  path: string
  url: string
  fileName: string
}

export class FirebaseStorageService {
  // Upload a file to Firebase Storage
  static async uploadFile(
    file: File,
    path: string = 'nft-images'
  ): Promise<StorageUploadResult> {
    try {
      // Create a unique filename
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const fullPath = `${path}/${fileName}`
      
      // Create storage reference
      const storageReference = ref(storage, fullPath)
      
      // Upload the file
      const snapshot = await uploadBytes(storageReference, file)
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(snapshot.ref)
      
      return {
        path: fullPath,
        url: downloadUrl,
        fileName
      }
    } catch (error) {
      console.error('Error uploading file to Firebase Storage:', error)
      throw new Error('Failed to upload file')
    }
  }
  
  // Get download URL for a file
  static async getFileUrl(path: string): Promise<string> {
    try {
      const storageReference = ref(storage, path)
      return await getDownloadURL(storageReference)
    } catch (error) {
      console.error('Error getting file URL:', error)
      throw new Error('Failed to get file URL')
    }
  }
  
  // Delete a file from storage
  static async deleteFile(path: string): Promise<boolean> {
    try {
      const storageReference = ref(storage, path)
      await deleteObject(storageReference)
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }
} 