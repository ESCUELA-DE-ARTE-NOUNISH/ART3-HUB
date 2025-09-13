# Firebase Storage Setup Guide

## Overview

The ART3-HUB profile image system uses Firebase Storage as the primary storage solution with automatic IPFS fallback. This ensures reliable image uploads even when Firebase credentials are not properly configured.

## Architecture

### Storage Priority System
1. **Primary**: Firebase Storage (Admin SDK with service account)
2. **Fallback**: IPFS via Pinata (existing system)
3. **UI**: Always shows "Uploading to Firebase Storage..." for consistency

### Files Involved
- `lib/firebase-admin.ts` - Firebase Admin SDK configuration
- `lib/services/firebase-admin-storage-service.ts` - Firebase Storage operations
- `app/api/profile/upload-image/route.ts` - Upload API with fallback logic
- `components/profile-image-selector.tsx` - Frontend upload interface
- `storage.rules` - Firebase Storage security rules

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Firebase Project Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=art3-hub-78ef8
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=art3-hub-78ef8.appspot.com

# Firebase Admin SDK Service Account
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@art3-hub-78ef8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## Getting Firebase Service Account Credentials

### Step 1: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/project/art3-hub-78ef8)
2. Click on Project Settings (gear icon)
3. Go to "Service accounts" tab
4. Click "Generate new private key"
5. Download the JSON file

### Step 2: Extract Credentials
From the downloaded JSON file, extract:
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (keep the \n characters)

### Step 3: Set Environment Variables
Add the credentials to your `.env.local` file (never commit these!)

## Firebase Storage Rules

Current rules in `storage.rules`:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Profile images - public read, authenticated write
    match /profile-images/{walletAddress}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // NFT images - public read, authenticated write
    match /nft-images/{path=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Admin NFT images
    match /admin-nft-images/{path=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Deployment Commands

```bash
# Deploy storage rules
firebase deploy --only storage

# Check current project
firebase projects:list

# Switch projects if needed
firebase use art3-hub-78ef8
```

## How the Fallback System Works

### Upload Flow
1. User selects image in ProfileImageSelector
2. Image sent to `/api/profile/upload-image`
3. API tries Firebase Storage first
4. If Firebase fails → automatically falls back to IPFS
5. Returns success with `storage` field indicating which was used

### Error Handling
- **Firebase Success**: Returns Firebase Storage URL with `storage: 'firebase'`
- **Firebase Fail**: Logs error, tries IPFS, returns IPFS URL with `storage: 'ipfs'`
- **Both Fail**: Returns 500 error with friendly message

## Current Status

✅ **Storage Rules**: Deployed to Firebase
✅ **Fallback System**: Working (IPFS backup)
✅ **UI**: Shows Firebase Storage branding
❌ **Service Account**: Needs configuration for production

## Testing

Use the included test script:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3002 node test-firebase-storage.js
```

This will:
- Check environment variables
- Test the upload API
- Show which storage system was used
- Verify the fallback mechanism

## Security Notes

1. **Never commit** service account credentials
2. **Always use** environment variables for sensitive data
3. **Storage rules** are deployed and active
4. **Authentication** required for uploads (except public read)

## Troubleshooting

### Issue: 403 Forbidden Error
**Solution**: Add service account credentials to environment variables

### Issue: Upload shows IPFS instead of Firebase
**Solution**: This is normal when credentials are missing - fallback is working

### Issue: Build errors with Admin SDK
**Solution**: Admin SDK is server-side only, never import in client components

## Next Steps

1. Configure service account credentials in production environment
2. Test Firebase Storage uploads with proper credentials
3. Monitor storage usage and costs
4. Consider implementing image optimization/resizing