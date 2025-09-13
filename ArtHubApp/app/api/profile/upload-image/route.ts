import { NextRequest, NextResponse } from 'next/server'
import { IPFSService } from '@/lib/services/ipfs-service'

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const walletAddress = formData.get('walletAddress') as string

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Supported: JPG, PNG, GIF, WebP' }, { status: 400 })
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 20MB' }, { status: 400 })
    }

    // Upload to IPFS (reliable and working)
    console.log(`🔄 Uploading profile image for wallet: ${walletAddress}`)
    const ipfsResult = await IPFSService.uploadFile(file)

    console.log('✅ Profile image uploaded successfully:', ipfsResult.gatewayUrl)
    
    return NextResponse.json({
      success: true,
      url: ipfsResult.gatewayUrl,
      ipfsHash: ipfsResult.ipfsHash,
      fileName: file.name,
      storage: 'ipfs'
    })

  } catch (error) {
    console.error('Error uploading profile image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image. Please try again.' },
      { status: 500 }
    )
  }
}