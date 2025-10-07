# Splash Screen Media Optimization

## Current Implementation ✅
The splash screen now uses a GIF (`/public/assets/eanounish.gif`) instead of video for better browser compatibility and no autoplay restrictions.

## Previous Issue (Resolved)
The splash screen video (`/public/assets/eanounish.mov`) used the .mov format, which had limited browser support and autoplay issues.

## GIF Advantages ✅
- **No autoplay restrictions** - GIFs start immediately
- **Universal browser support** - Works on all browsers
- **No user interaction required** - Plays automatically
- **Simpler implementation** - No complex video controls needed
- **Mobile friendly** - Works perfectly on iOS/Android

## Alternative: Convert Video to GIF
If you need to convert video to GIF format:

```bash
# Using FFmpeg to convert video to GIF
ffmpeg -i eanounish.mov -vf "fps=15,scale=720:1280:flags=lanczos,palettegen" palette.png
ffmpeg -i eanounish.mov -i palette.png -vf "fps=15,scale=720:1280:flags=lanczos,paletteuse" eanounish.gif

# For smaller file size (lower quality)
ffmpeg -i eanounish.mov -vf "fps=10,scale=480:854:flags=lanczos,palettegen" palette.png
ffmpeg -i eanounish.mov -i palette.png -vf "fps=10,scale=480:854:flags=lanczos,paletteuse" eanounish.gif
```

## Video Alternative (If Needed)

### 1. Convert Video to MP4 (Alternative)
Convert the .mov file to MP4 for better browser compatibility:

```bash
# Using FFmpeg (install from https://ffmpeg.org/)
ffmpeg -i /public/assets/eanounish.mov -c:v libx264 -c:a aac -movflags +faststart /public/assets/eanounish.mp4

# For web optimization with smaller file size
ffmpeg -i /public/assets/eanounish.mov -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart /public/assets/eanounish.mp4
```

### 2. Create Multiple Formats
For maximum compatibility, create multiple video formats:

```bash
# MP4 (H.264) - Best compatibility
ffmpeg -i eanounish.mov -c:v libx264 -c:a aac -movflags +faststart eanounish.mp4

# WebM (VP9) - Good for modern browsers
ffmpeg -i eanounish.mov -c:v libvpx-vp9 -c:a libopus eanounish.webm

# For mobile optimization (smaller file)
ffmpeg -i eanounish.mov -c:v libx264 -crf 28 -preset medium -vf "scale=720:1280" -c:a aac -b:a 96k eanounish-mobile.mp4
```

### 3. Update Splash Screen Component
Once you have the MP4 file, update the video sources in `splash-screen.tsx`:

```tsx
<source src="/assets/eanounish.mp4" type="video/mp4" />
<source src="/assets/eanounish.webm" type="video/webm" />
<source src="/assets/eanounish.mov" type="video/quicktime" />
```

## Video Specifications for Web
- **Format**: MP4 (H.264 + AAC)
- **Resolution**: 720x1280 (9:16 aspect ratio)
- **Frame Rate**: 30fps
- **Bitrate**: 1-2 Mbps for video, 128kbps for audio
- **Duration**: ~10 seconds
- **File Size**: Target under 5MB for fast loading

## Autoplay Requirements
Modern browsers require videos to be:
- **Muted** ✅ (already implemented)
- **Short duration** ✅ (10 seconds)
- **User-initiated** ✅ (play button fallback implemented)

## Alternative: Static Image Fallback
If video conversion isn't possible, you can use a static image:

1. Export a frame from the video as PNG/JPG
2. Show the static image for 3-4 seconds
3. Transition to logo

This ensures the splash screen always works regardless of browser support.