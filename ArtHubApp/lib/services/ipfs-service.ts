// IPFS upload service using Pinata or similar provider
export interface IPFSUploadResult {
  ipfsHash: string
  ipfsUrl: string
  gatewayUrl: string
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  royalty?: {
    recipient: string
    percentage: number
  }
}

// Using a free IPFS gateway for now - in production you'd want to use Pinata or similar
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'

export class IPFSService {
  // Upload file to IPFS
  static async uploadFile(file: File): Promise<IPFSUploadResult> {
    // Check if Pinata is configured (only public key is available on client side)
    if (process.env.NEXT_PUBLIC_PINATA_API_KEY) {
      console.log('🔗 Using Pinata for file upload')
      return await this.uploadToPinata(file)
    }
    
    // Fallback to mock implementation for development
    console.log('🏠 Using mock IPFS for file upload')
    return await this.uploadMock(file)
  }
  
  // Upload to Pinata via our API endpoint (to keep secret key secure)
  private static async uploadToPinata(file: File): Promise<IPFSUploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', `ART3-HUB-${Date.now()}-${file.name}`)
    
    const response = await fetch('/api/upload-to-pinata', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata upload failed:', errorText)
      throw new Error(`Pinata upload failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'
    
    return {
      ipfsHash: result.IpfsHash,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${gateway}/ipfs/${result.IpfsHash}`
    }
  }
  
  // Mock implementation for development
  private static async uploadMock(file: File): Promise<IPFSUploadResult> {
    // Convert file to base64 for mock storage
    const base64 = await this.fileToBase64(file)
    
    // Generate a mock IPFS hash
    const mockHash = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    // Store in localStorage for demo purposes
    localStorage.setItem(`ipfs_${mockHash}`, base64)
    
    return {
      ipfsHash: mockHash,
      ipfsUrl: `ipfs://${mockHash}`,
      gatewayUrl: `${IPFS_GATEWAY}${mockHash}`
    }
  }

  // Upload metadata to IPFS
  static async uploadMetadata(metadata: NFTMetadata): Promise<IPFSUploadResult> {
    // Check if Pinata is configured
    if (process.env.NEXT_PUBLIC_PINATA_API_KEY) {
      console.log('🔗 Using Pinata for metadata upload')
      return await this.uploadMetadataToPinata(metadata)
    }
    
    // Fallback to mock implementation
    console.log('🏠 Using mock IPFS for metadata upload')
    return await this.uploadMetadataMock(metadata)
  }
  
  // Upload metadata to Pinata via our API endpoint
  private static async uploadMetadataToPinata(metadata: NFTMetadata): Promise<IPFSUploadResult> {
    const response = await fetch('/api/upload-metadata-to-pinata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata,
        name: `ART3-HUB-metadata-${Date.now()}`
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata metadata upload failed:', errorText)
      throw new Error(`Pinata metadata upload failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'
    
    return {
      ipfsHash: result.IpfsHash,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${gateway}/ipfs/${result.IpfsHash}`
    }
  }
  
  // Mock metadata upload
  private static async uploadMetadataMock(metadata: NFTMetadata): Promise<IPFSUploadResult> {
    // Convert metadata to JSON
    const metadataJson = JSON.stringify(metadata, null, 2)
    
    // Generate a mock IPFS hash for metadata
    const mockHash = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    // Store in localStorage for demo purposes
    localStorage.setItem(`ipfs_${mockHash}`, metadataJson)
    
    return {
      ipfsHash: mockHash,
      ipfsUrl: `ipfs://${mockHash}`,
      gatewayUrl: `${IPFS_GATEWAY}${mockHash}`
    }
  }

  // Helper function to convert file to base64
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Get file from IPFS hash (mock implementation)
  static getFileFromHash(hash: string): string | null {
    return localStorage.getItem(`ipfs_${hash}`)
  }
}

// Production IPFS upload using Pinata (commented out for reference)
/*
export class PinataIPFSService {
  private static readonly PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
  private static readonly PINATA_SECRET_KEY = process.env.PINATA_SECRET_API_KEY
  private static readonly PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY

  static async uploadFile(file: File): Promise<IPFSUploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': this.PINATA_API_KEY!,
        'pinata_secret_api_key': this.PINATA_SECRET_KEY!,
      },
      body: formData
    })

    const result = await response.json()
    
    return {
      ipfsHash: result.IpfsHash,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${this.PINATA_GATEWAY}/ipfs/${result.IpfsHash}`
    }
  }

  static async uploadMetadata(metadata: NFTMetadata): Promise<IPFSUploadResult> {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': this.PINATA_API_KEY!,
        'pinata_secret_api_key': this.PINATA_SECRET_KEY!,
      },
      body: JSON.stringify(metadata)
    })

    const result = await response.json()
    
    return {
      ipfsHash: result.IpfsHash,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `${this.PINATA_GATEWAY}/ipfs/${result.IpfsHash}`
    }
  }
}
*/