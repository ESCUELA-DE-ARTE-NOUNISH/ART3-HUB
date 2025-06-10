import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check if Pinata keys are configured
    if (!process.env.NEXT_PUBLIC_PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
      return NextResponse.json({ error: 'Pinata not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Create FormData for Pinata
    const pinataFormData = new FormData()
    pinataFormData.append('file', file)
    
    const pinataMetadata = JSON.stringify({
      name: name || `ART3-HUB-${Date.now()}-${file.name}`,
    })
    pinataFormData.append('pinataMetadata', pinataMetadata)

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY!,
      },
      body: pinataFormData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata API error:', errorText)
      return NextResponse.json({ error: `Pinata upload failed: ${response.statusText}` }, { status: response.status })
    }

    const result = await response.json()
    console.log('✅ File uploaded to Pinata:', result.IpfsHash)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error uploading to Pinata:', error)
    return NextResponse.json(
      { error: 'Failed to upload file to Pinata' },
      { status: 500 }
    )
  }
}