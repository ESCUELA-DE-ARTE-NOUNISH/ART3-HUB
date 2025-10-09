# Gallery IPFS Rate Limit Fix

## Problem

The gallery page was hitting Pinata's public IPFS gateway rate limits (429 Too Many Requests), causing images to fail to load.

**Root Causes:**
1. Aggressive preloading (6 images at once)
2. Using public Pinata gateway without authentication
3. No request throttling or caching

## Solution Implemented

### 1. Reduced Preloading
**Changed from:** Preloading current + 5 adjacent images
**Changed to:** Preloading current + 1 next image only

**File:** `app/[locale]/gallery/page.tsx`
- Reduced from 6 concurrent requests to 2
- Added 100ms stagger between requests to avoid burst traffic

### 2. Gateway Fallback Strategy
**Primary:** Pinata dedicated gateway with JWT token (if available)
**Fallback:** ipfs.io public gateway (more permissive rate limits)

**Code:**
```typescript
const getImageUrl = (ipfsHash: string) => {
  // Use Pinata dedicated gateway with JWT if available
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_GATEWAY_TOKEN
  if (pinataJWT) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}?pinataGatewayToken=${pinataJWT}`
  }

  // Fallback to ipfs.io gateway
  return `https://ipfs.io/ipfs/${ipfsHash}`
}
```

### 3. Environment Variable Added

**New Variable:** `NEXT_PUBLIC_PINATA_GATEWAY_TOKEN`

**How to Get Token:**
1. Go to https://app.pinata.cloud/gateway
2. Create or select a gateway
3. Generate a gateway token
4. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_PINATA_GATEWAY_TOKEN=your_token_here
   ```

**Note:** This is optional. Without it, the app uses ipfs.io gateway as fallback.

## Testing

1. **Without Gateway Token:**
   - Images load via `ipfs.io/ipfs/[hash]`
   - Slower but more reliable than public Pinata gateway

2. **With Gateway Token:**
   - Images load via `gateway.pinata.cloud/ipfs/[hash]?pinataGatewayToken=[token]`
   - Faster and no rate limits (dedicated gateway)

## Performance Improvements

- **Request Reduction:** 67% fewer IPFS requests (6 → 2 images preloaded)
- **Rate Limit Avoidance:** Staggered requests + authenticated gateway
- **User Experience:** Immediate current image + next image ready

## Files Modified

1. `app/[locale]/gallery/page.tsx`
   - Updated `getImageUrl()` function
   - Reduced `preloadAdjacentImages()` scope
   - Added request staggering

2. `.env`
   - Added `NEXT_PUBLIC_PINATA_GATEWAY_TOKEN` documentation

3. `.env.local.example`
   - Created example file for gateway token

## Alternative Solutions (Not Implemented)

1. **Next.js Image Optimization API** - Requires server-side IPFS fetching
2. **Client-side caching with Service Workers** - More complex implementation
3. **Self-hosted IPFS node** - Requires infrastructure

## Monitoring

If rate limit errors continue:
1. Check browser console for `429` errors
2. Verify gateway token is valid (if using Pinata)
3. Consider increasing stagger delay from 100ms to 200ms
4. Reduce preload count to 1 image only

---

**Last Updated:** January 2025
**Related Issue:** Pinata IPFS Gateway Rate Limiting (429 errors)
