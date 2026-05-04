# SubtitleAI

A fully self-contained, local AI transcription web app.  
Upload any video or audio file → get accurate, synchronized subtitles → export as SRT or VTT.

**No external API keys required.** Everything runs on your machine using [faster-whisper](https://github.com/SYSTRAN/faster-whisper).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS |
| Icons | Lucide React |
| Backend | Python · FastAPI · faster-whisper (CTranslate2 Whisper) |
| Audio extraction | ffmpeg |

---

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.9
- **ffmpeg** — required for extracting audio from video files (MP4, MOV, WEBM)

Install ffmpeg:
```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg

# Windows (winget)
winget install ffmpeg
```

---

## Setup

### 1. Clone & install frontend deps

```bash
git clone https://github.com/RaghavAtRuntime/subtitles.git
cd subtitles
npm install
```

### 2. Set up the Python backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start both services

**Terminal 1 — Python backend:**

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Next.js frontend:**

```bash
# from repo root
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Configuration

| Environment variable | Default | Description |
|---------------------|---------|-------------|
| `WHISPER_MODEL` | `base` | Model size: `tiny` · `base` · `small` · `medium` · `large-v3` |
| `WHISPER_DEVICE` | `cpu` | `cpu` or `cuda` (NVIDIA GPU) |
| `WHISPER_COMPUTE` | `int8` | Quantisation: `int8` · `float16` · `float32` |
| `BACKEND_URL` | `http://localhost:8000` | URL the Next.js app uses to reach the Python server |

Set backend variables in your shell before starting uvicorn:
```bash
WHISPER_MODEL=small uvicorn main:app --port 8000
```

Set `BACKEND_URL` in a `.env.local` file at the repo root if you host the backend elsewhere:
```
BACKEND_URL=http://my-server:8000
```

---

## Features

- **Drag & drop** file upload with visual feedback
- Supports **MP4, MOV, WEBM** (video) and **MP3, WAV, M4A** (audio)
- Real-time **synchronized transcript** — active segment highlights as the media plays
- **Click any segment** to jump to that point in the player
- **Auto-scroll** keeps the active segment centred in the transcript panel
- **Caption overlay** on the video player
- **Export SRT / VTT** subtitles with one click
- Dark-mode UI — no external fonts or CDN dependencies

---

## Architecture

```
Browser (Next.js)
   │  POST /api/transcribe  (multipart file)
   ▼
Next.js Route Handler  ── proxy ──►  FastAPI  (localhost:8000)
                                         │
                                     faster-whisper
                                         │
                                     returns segments JSON
   ◄──────────────────────────────────────
   { segments: [{ id, start, end, text }], language }
```

The Next.js API route acts as a thin proxy, forwarding the uploaded file to the Python backend and returning the JSON response.  
This keeps CORS simple and allows the backend URL to be changed via environment variable.
