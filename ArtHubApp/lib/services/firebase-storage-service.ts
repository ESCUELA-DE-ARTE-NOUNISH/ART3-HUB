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

// Helper function to handle base64 image uploads
export async function handleBase64ImageUpload(
  base64Image: string, 
  userAddress: string
): Promise<StorageUploadResult> {
  console.log('🔄 Converting base64 to file...')
  
  // Extract MIME type and base64 data
  const [header, data] = base64Image.split(',')
  if (!header || !data) {
    throw new Error('Invalid base64 image format')
  }
  
  const mimeMatch = header.match(/data:([^;]+)/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
  
  // Get file extension from MIME type
  const extension = mimeType.split('/')[1] || 'png'
  
  console.log('📄 Image details:', { mimeType, extension })
  
  // Convert base64 to binary
  const binaryString = atob(data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  // Create file object
  const timestamp = Date.now()
  const fileName = `admin-upload-${timestamp}.${extension}`
  const file = new File([bytes], fileName, { type: mimeType })
  
  console.log('📁 Created file:', { 
    name: file.name, 
    size: file.size, 
    type: file.type 
  })
  
  // Upload to Firebase Storage
  const uploadPath = `admin-nft-images/${userAddress}`
  const result = await FirebaseStorageService.uploadFile(file, uploadPath)
  
  console.log('✅ Firebase upload successful:', {
    path: result.path,
    url: result.url,
    fileName: result.fileName
  })
  
  return result
} 