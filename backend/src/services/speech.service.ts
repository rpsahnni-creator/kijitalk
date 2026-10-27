import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
}

export interface TTSResult {
  audioBase64: string;
  format: string;
}

export async function transcribeAudio(audioBase64: string): Promise<TranscriptionResult> {
  try {
    const response = await fetch(`${env.SPEECH_SERVICE_URL}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioBase64 }),
    });

    if (!response.ok) {
      throw new Error(`Speech service error: ${response.status}`);
    }

    return (await response.json()) as TranscriptionResult;
  } catch (error) {
    logger.warn('Whisper transcription unavailable, returning empty', error);
    return { text: '', confidence: 0 };
  }
}

export async function synthesizeSpeech(text: string, voice = 'en-US-JennyNeural'): Promise<TTSResult> {
  try {
    const response = await fetch(`${env.SPEECH_SERVICE_URL}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      throw new Error(`TTS service error: ${response.status}`);
    }

    return (await response.json()) as TTSResult;
  } catch (error) {
    logger.warn('Edge TTS unavailable', error);
    return { audioBase64: '', format: 'mp3' };
  }
}
