Here’s a detailed README.md for your project, covering its purpose, use case, and usage instructions:

---

# video-hls-converter

## Overview

**video-hls-converter** is a Node.js/TypeScript library for converting video files into HTTP Live Streaming (HLS) format with multiple quality levels. It leverages `fluent-ffmpeg` to automate the process of generating HLS segments and playlists, making it easy to prepare videos for adaptive streaming.

---

## Purpose

- **Automate HLS Conversion:** Simplifies the process of converting a single video file into multiple HLS streams (different resolutions/bitrates).
- **Multi-Quality Output:** Supports a wide range of output qualities, from 120p to 4K, for adaptive streaming.
- **Customizable:** Allows you to specify custom resolutions, bitrates, and output folders.
- **Progress Reporting:** Provides real-time progress updates for each quality level.

---

## Use Cases

- **Video Platforms:** Prepare videos for streaming on web or mobile platforms using adaptive bitrate streaming.
- **Media Servers:** Automate video ingestion pipelines for media servers.
- **Developers:** Integrate into Node.js applications to offer video upload and streaming features.

---

## How It Works

1. **Input:** Provide a video file and specify the desired output folder.
2. **Conversion:** The library uses FFmpeg (via `fluent-ffmpeg`) to transcode the video into multiple HLS streams.
3. **Output:** Generates `.m3u8` playlists and `.ts` segment files for each quality, plus a master playlist.
4. **Cleanup (Optional):** Can delete the original video after conversion.

---

## Installation

```bash
pnpm install video-hls-converter
# or
npm install video-hls-converter
```

> **Note:** You must have [FFmpeg](https://ffmpeg.org/download.html) installed and available in your system’s PATH.

---

## Usage

### Basic Example

```typescript
import { VideoConverter } from 'video-hls-converter';

const videoConverter = new VideoConverter('video', 'output');
videoConverter.hlsConvert(
    'input.mp4',
    (progress) => {
        console.log(`Progress: ${progress.percent}% for quality: ${progress.quality}`);
    }
)
.then(() => {
    console.log('Video conversion successful');
})
.catch((error) => {
    console.error('Error during video conversion:', error.message);
});
```

### Constructor Options

```typescript
new VideoConverter(
    inputFolder: string,         // Folder containing input video
    outputPath: string = "output", // Output folder for HLS files
    inputVideoCleanUp: false | string = false // If true or a string, deletes input after conversion
)
```

### Custom Qualities

You can specify custom quality settings:

```typescript
const customQualities = [
  { resolution: "640x360", bitrate: "800k", maxrate: "856k", bufsize: "1200k", file: "360p.m3u8", name: "360", segments: "360p_%03d.ts" },
  // ...add more
];

videoConverter.hlsConvert(
  'input.mp4', // file name
  undefined,
  ['360'], // Only convert to 360p
  undefined,
  customQualities
);
```

---

## API Reference

### `hlsConvert(inputFileName, progressCallback?, resolutionArray?, video_id?, qualityArray?)`

- **inputFileName:** Name of the video file in the input folder.
- **progressCallback:** Optional function to receive progress updates.
- **resolutionArray:** Array of quality names to generate (e.g., `['360', '720']`).
- **video_id:** Optional unique identifier for output folder.
- **qualityArray:** Optional array of custom quality objects.

---

## Output Structure

- `output/{video_id}/`
  - `master.m3u8` (master playlist)
  - `360p.m3u8`, `720p.m3u8`, ... (variant playlists)
  - `360p_001.ts`, ... (segment files)

---

## Requirements

- Node.js 18+
- FFmpeg installed and in PATH

---

## License

MIT
