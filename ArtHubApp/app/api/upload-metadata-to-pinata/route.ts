import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check if Pinata keys are configured
    if (!process.env.NEXT_PUBLIC_PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
      return NextResponse.json({ error: 'Pinata not configured' }, { status: 500 })
    }

    const { metadata, name } = await request.json()

    if (!metadata) {
      return NextResponse.json({ error: 'No metadata provided' }, { status: 400 })
    }

    // Upload metadata to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY!,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: name || `ART3-HUB-metadata-${Date.now()}`,
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata metadata API error:', errorText)
      return NextResponse.json({ error: `Pinata metadata upload failed: ${response.statusText}` }, { status: response.status })
    }

    const result = await response.json()
    console.log('✅ Metadata uploaded to Pinata:', result.IpfsHash)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error)
    return NextResponse.json(
      { error: 'Failed to upload metadata to Pinata' },
      { status: 500 }
    )
  }
}