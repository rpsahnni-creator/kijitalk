"""
KijiTalk Speech Service
Local Whisper STT + Edge TTS (free, no API key needed)
"""
import base64
import io
import os
import tempfile
from contextlib import asynccontextmanager

import edge_tts
import uvicorn
import whisper
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
whisper_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global whisper_model
    print(f"Loading Whisper model: {WHISPER_MODEL}...")
    whisper_model = whisper.load_model(WHISPER_MODEL)
    print("Whisper model loaded.")
    yield


app = FastAPI(title="KijiTalk Speech Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscribeRequest(BaseModel):
    audio: str  # base64 encoded audio


class SynthesizeRequest(BaseModel):
    text: str
    voice: str = "en-IN-NeerjaNeural"


@app.get("/health")
async def health():
    return {"status": "ok", "service": "kijitalk-speech"}


@app.post("/transcribe")
async def transcribe(req: TranscribeRequest):
    if not whisper_model:
        raise HTTPException(503, "Whisper model not loaded")

    try:
        audio_bytes = base64.b64decode(req.audio)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_bytes)
            temp_path = f.name

        result = whisper_model.transcribe(temp_path, language="en")
        os.unlink(temp_path)

        return {
            "text": result["text"].strip(),
            "confidence": 0.9,
        }
    except Exception as e:
        raise HTTPException(500, f"Transcription failed: {str(e)}")


@app.post("/synthesize")
async def synthesize(req: SynthesizeRequest):
    try:
        communicate = edge_tts.Communicate(req.text, req.voice)
        audio_buffer = io.BytesIO()

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        audio_base64 = base64.b64encode(audio_buffer.getvalue()).decode()
        return {"audioBase64": audio_base64, "format": "mp3"}
    except Exception as e:
        raise HTTPException(500, f"Synthesis failed: {str(e)}")


if __name__ == "__main__":
    port = int(os.getenv("SPEECH_PORT", "5001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
