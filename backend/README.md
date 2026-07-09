# CineSync Backend

Express + TypeScript service for CineSync. Implements the streaming engine:
accepts a media URL, inspects it with FFprobe, and either serves it directly
(for browser-native formats) or transcodes it to HLS on the fly with FFmpeg.

> Socket.IO is imported but no handlers are wired in this phase (watch-party
> and chat are out of scope). See `../PROJECT.md` for the roadmap.

## Requirements

- Node.js 18+ (or Bun)
- **FFmpeg** and **FFprobe** on `PATH` (or set `FFMPEG_PATH` / `FFPROBE_PATH`)

Verify they are available:

```bash
ffmpeg -version
ffprobe -version
```

## Structure

```
backend/
  src/
    routes/          Express routers (POST /stream, HLS playlist + segments)
    controllers/     Request handlers (streamController)
    middleware/      requestLogger, errorHandler, notFoundHandler
    services/        VideoService, MediaInspector, FFmpegService, CleanupService, Logger
    socket/          Socket.IO (placeholder for a future phase)
    utils/           URL validation + reachability helpers
    config/          Typed env config
    types/           Shared backend types
    index.ts         Server entry (HTTP + graceful shutdown)
  package.json
  tsconfig.json
  eslint.config.mjs
  .env.example
```

## Getting started

```bash
cd backend
cp .env.example .env
bun install
bun run dev      # tsx watch — restarts on file changes
```

The backend listens on `PORT` (default `4001`). The frontend reaches it
through the gateway using the `XTransformPort` query parameter.

## API

### `POST /stream`

Inspect a media URL and prepare it for browser playback.

**Request**

```json
{ "url": "https://example.com/video.mkv" }
```

**Validation**

- URL shape (must be `http`/`https`)
- Reachable (small range GET)
- Looks like video (Content-Type or file extension)

**Response** — `200 OK`

```json
{
  "id": "abc123",
  "sourceUrl": "https://example.com/video.mkv",
  "strategy": "direct" | "hls",
  "media": {
    "container": "MKV",
    "video": { "codecName": "h264", "width": 1920, "height": 1080 },
    "audio": { "codecName": "aac" },
    "resolution": "1080p",
    "durationSeconds": 1234.5,
    "bitRate": 4000000
  },
  "directUrl": "https://example.com/video.mp4",   // when strategy === "direct"
  "hlsPlaylistUrl": "/api/stream/abc123/playlist.m3u8", // when strategy === "hls"
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Errors** — structured JSON:

| Status | Code                  | Meaning                                  |
| ------ | --------------------- | ---------------------------------------- |
| 400    | `INVALID_URL`         | Bad URL shape                            |
| 502    | `UNREACHABLE_URL`     | URL could not be reached                 |
| 504    | `URL_TIMEOUT`         | URL probe timed out                      |
| 415    | `UNSUPPORTED_FORMAT`  | Not a video / unsupported container      |
| 422    | `UNSUPPORTED_FORMAT`  | FFprobe could not read the media         |
| 504    | `INSPECTION_TIMEOUT`  | FFprobe took too long                    |
| 500    | `FFPROBE_MISSING`     | FFprobe binary not found                 |
| 500    | `FFMPEG_FAILED`       | Transcoding failed                       |
| 504    | `FFMPEG_TIMEOUT`      | FFmpeg took too long to start            |

### `GET /stream/:id/playlist.m3u8`

Serves the HLS playlist for a transcode session.

### `GET /stream/:id/segments/:name`

Serves a single HLS segment (`.ts`) for a session.

### `GET /health`

Health check: `{ "ok": true, "service": "cinesync-backend" }`.

## How it decides direct vs. transcode

A source is **direct** when both container + primary codecs are browser-native:

- **MP4** with H.264/HEVC/AV1 video + AAC/MP3/AC3/EAC3/Opus audio
- **WebM** with VP8/VP9/AV1 video + Vorbis/Opus audio
- Any **HLS** (`.m3u8`) source — the browser or hls.js handles it

Everything else (MKV, AVI, MOV with incompatible codecs, FLV, WMV, TS, …) is
transcoded to **HLS** (H.264 + AAC) on the fly via FFmpeg.

## Cleanup

- Each transcode session writes to `HLS_OUTPUT_DIR/<sessionId>/`.
- Sessions are reaped after `HLS_SESSION_TTL_MS` of inactivity.
- On `SIGINT`/`SIGTERM`, the server stops all FFmpeg processes and removes
  every temp directory — **never leaving files behind**.

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `bun run dev`       | Start with hot reload (tsx watch)    |
| `bun run build`     | Compile TypeScript                   |
| `bun run start`     | Run the compiled output              |
| `bun run typecheck` | Type-check without emitting          |
| `bun run lint`      | Run ESLint                           |
