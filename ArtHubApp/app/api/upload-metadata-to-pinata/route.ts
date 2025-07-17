import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Pinata API keys from environment variables
const PINATA_API_KEY = process.env.PINATA_API_KEY
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_API_KEY

export async function POST(req: NextRequest) {
  try {
    // Check if Pinata is configured
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      return NextResponse.json({ error: 'Pinata API is not configured' }, { status: 503 })
    }
    
    // Parse request body
    const body = await req.json()
    const { metadata, name } = body
    
    if (!metadata) {
      return NextResponse.json({ error: 'No metadata provided' }, { status: 400 })
    }
    
    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: metadata,
        pinataMetadata: {
          name: name || `ART3-HUB-metadata-${Date.now()}`
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY
        }
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