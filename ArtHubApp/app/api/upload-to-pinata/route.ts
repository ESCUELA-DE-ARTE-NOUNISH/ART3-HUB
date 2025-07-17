import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import FormData from 'form-data'

// Pinata API keys from environment variables
const PINATA_API_KEY = process.env.PINATA_API_KEY
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_API_KEY

export async function POST(req: NextRequest) {
  try {
    // Check if Pinata is configured
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      return NextResponse.json({ error: 'Pinata API is not configured' }, { status: 503 })
    }
    
    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string || `ART3-HUB-${Date.now()}`
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Create form data for Pinata
    const pinataFormData = new FormData()
    pinataFormData.append('file', buffer, {
      filename: file.name,
      contentType: file.type,
    })
    
    // Add metadata
    pinataFormData.append('pinataMetadata', JSON.stringify({
      name: name
    }))
    
    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      pinataFormData,
      {
        headers: {
          ...pinataFormData.getHeaders(),
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    )
    
    return NextResponse.json({
      success: true,
      IpfsHash: response.data.IpfsHash,
      PinSize: response.data.PinSize,
      Timestamp: response.data.Timestamp
    })
  } catch (error) {
    console.error('Error uploading to Pinata:', error)
    return NextResponse.json(
      { error: 'Failed to upload to Pinata' },
      { status: 500 }
    )
  }
}