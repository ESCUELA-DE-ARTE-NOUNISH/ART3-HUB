# Pinata IPFS Setup Guide

This guide will help you set up Pinata for storing NFT images and metadata on IPFS.

## What is Pinata?

Pinata is a pinning service that allows you to host files on the IPFS (InterPlanetary File System) network. It's commonly used for storing NFT assets and metadata.

## Why use Pinata with ART3-HUB?

ART3-HUB uses Pinata to:
1. Store NFT images permanently on IPFS
2. Create and store NFT metadata JSON files
3. Ensure your NFT assets are decentralized and not dependent on a single server

## Setup Instructions

### 1. Create a Pinata Account

1. Go to [Pinata's website](https://www.pinata.cloud/) and sign up for an account
2. Verify your email address

### 2. Get API Keys

1. Log in to your Pinata account
2. Navigate to the "API Keys" section
3. Click "New Key"
4. Give your key a name (e.g., "ART3-HUB")
5. Select the following permissions:
   - pinFileToIPFS
   - pinJSONToIPFS
6. Click "Create Key"
7. Save your API Key and API Secret (you'll need these for the next step)

### 3. Configure ART3-HUB

#### Option 1: Using the Setup Script (Recommended)

1. Run the setup script using npm:
```
cd ArtHubApp
npm run setup:pinata
```

2. Follow the prompts to enter your Pinata API Key and API Secret

#### Option 2: Manual Configuration

1. Open the `.env` file in the ArtHubApp directory
2. Add the following environment variables:

```
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

3. Replace `your_pinata_api_key` and `your_pinata_secret_api_key` with the values from step 2

### 4. Restart Your Development Server

1. Stop your current development server (if running)
2. Start it again with `npm run dev`

## Testing Your Setup

1. Go to the admin dashboard
2. Create a new claimable NFT
3. Upload an image
4. Set the status to "Published"
5. Save the NFT
6. View the NFT details - you should see an IPFS hash and link to the metadata

## Troubleshooting

If you encounter issues with Pinata uploads:

1. Check your API keys in `.env.local`
2. Make sure your Pinata account is active
3. Check the browser console and server logs for error messages
4. Verify your API key has the correct permissions

## Development Without Pinata

If you don't want to use Pinata during development:

1. The system will fall back to a mock IPFS implementation
2. Images and metadata will be stored in localStorage (for demo purposes only)
3. This is not suitable for production use

## Production Considerations

For production deployments:

1. Use environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Consider using a dedicated Pinata plan for higher limits
3. Set up a custom IPFS gateway for better performance 