"""
SubtitleAI — Local transcription backend
Powered by FastAPI + faster-whisper (CTranslate2 Whisper)

Start with:
    uvicorn main:app --host 0.0.0.0 --port 8000
"""

import os
import subprocess
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

# ---------------------------------------------------------------------------
# Configuration — override via environment variables
# ---------------------------------------------------------------------------
MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")   # tiny | base | small | medium | large-v3
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")        # cpu | cuda
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE", "int8")  # int8 | float16 | float32

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".mp3", ".wav", ".m4a"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}

# ---------------------------------------------------------------------------
# App lifecycle — load model once at startup
# ---------------------------------------------------------------------------
model: WhisperModel | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    print(f"[SubtitleAI] Loading Whisper model '{MODEL_SIZE}' on {DEVICE} ({COMPUTE_TYPE})…")
    model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    print("[SubtitleAI] Model ready.")
    yield
    model = None


app = FastAPI(title="SubtitleAI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _extract_audio(input_path: str, output_path: str) -> None:
    """Use ffmpeg to extract/convert audio to 16-kHz mono WAV."""
    result = subprocess.run(
        [
            "ffmpeg",
            "-y",               # overwrite output
            "-i", input_path,
            "-vn",              # drop video
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            output_path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Audio extraction failed — ffmpeg error: {result.stderr[-500:]}")


def _needs_extraction(suffix: str) -> bool:
    return suffix.lower() in VIDEO_EXTENSIONS


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_SIZE}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet. Please retry.")

    suffix = Path(file.filename or "upload").suffix.lower() or ".tmp"
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Write upload to a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_in:
        tmp_in.write(await file.read())
        tmp_in_path = tmp_in.name

    audio_path = tmp_in_path
    tmp_audio_path: str | None = None

    try:
        # Extract audio from video formats so faster-whisper gets clean audio
        if _needs_extraction(suffix):
            tmp_audio_path = tmp_in_path + ".wav"
            try:
                _extract_audio(tmp_in_path, tmp_audio_path)
                audio_path = tmp_audio_path
            except (RuntimeError, FileNotFoundError) as exc:
                # ffmpeg not available — pass the original file and let
                # faster-whisper try to decode it directly
                print(f"[SubtitleAI] Audio extraction skipped: {exc}")
                audio_path = tmp_in_path

        # Transcribe
        segments_iter, info = model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True,       # skip silence
            vad_parameters={"min_silence_duration_ms": 500},
        )

        segments = []
        for i, seg in enumerate(segments_iter):
            segments.append(
                {
                    "id": i,
                    "start": round(seg.start, 3),
                    "end": round(seg.end, 3),
                    "text": seg.text.strip(),
                }
            )

        return {"segments": segments, "language": info.language}

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    finally:
        # Clean up temp files
        for path in filter(None, [tmp_in_path, tmp_audio_path]):
            try:
                os.unlink(path)
            except OSError:
                pass
