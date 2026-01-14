# Trading Video Background

## Current Video Source
This directory contains or references the trading background video for the landing page.

## Recommended Public Domain Video Sources

### Option 1: Pexels (Recommended)
- URL: https://www.pexels.com/video/candlestick-chart-on-a-screen-3130284/
- **Direct MP4 (1080p - Recommended):** https://videos.pexels.com/video-files/3130284/3130284-hd_1920_1080_25fps.mp4
- Direct MP4 (UHD 2K): https://videos.pexels.com/video-files/3130284/3130284-uhd_2560_1440_25fps.mp4
- License: Free to use (Pexels License)
- Description: Trading chart with candlesticks
- **Note:** Use 1080p version for better performance. UHD versions may be too large for web use.

### Option 2: Pixabay
- Search: "stock market" or "trading chart"
- URL: https://pixabay.com/videos/search/stock%20market/
- License: Free to use (Pixabay License)

### Option 3: Coverr
- URL: https://coverr.co/
- Search for: "trading", "finance", "data"
- License: Free to use

## How to Replace the Video

1. Download your preferred video from one of the sources above
2. Save it as `trading-bg.mp4` in this directory
3. Alternatively, update the video URL in `src/app/page.tsx` to point to a hosted video

## Video Requirements
- Format: MP4 (H.264 codec recommended)
- Quality: 1080p or higher
- Aspect Ratio: 16:9
- File Size: Keep under 10MB for optimal loading
- Content: Trading charts, candlesticks, market graphs, or financial data visualizations

## Notes
- The video is set to autoplay, loop, and muted for best UX
- An overlay is applied to ensure text readability
- The video is positioned behind all content (z-index: -1)
