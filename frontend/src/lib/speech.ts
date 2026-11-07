'use client';

export type Accent = 'indian' | 'british' | 'american';

const ACCENT_LANG: Record<Accent, string> = {
  indian: 'en-IN',
  british: 'en-GB',
  american: 'en-US',
};

export const SPEECH_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone ki permission nahi mili. Browser settings mein mic allow karo.',
  'service-not-allowed': 'Microphone ki permission nahi mili. Browser settings mein mic allow karo.',
  'no-speech': 'Kuch sunai nahi diya — mic ke paas thoda zor se bolo.',
  'audio-capture': 'Koi microphone nahi mila. Mic connect karke dobara try karo.',
  network: 'Network problem — internet check karke dobara try karo.',
  unsupported: 'Yeh browser voice input support nahi karta. Chrome ya Edge use karo.',
};

export function speechErrorMessage(code: string): string {
  return SPEECH_ERROR_MESSAGES[code] ?? 'Voice input mein problem aayi. Dobara try karo.';
}

export class WebSpeechService {
  private recognition: SpeechRecognition | null = null;
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private rate = 0.9;
  private lang = 'en-IN';

  /** Apply the user's voice speed and accent preferences to everything spoken. */
  configure({ rate, accent }: { rate?: number; accent?: Accent }): void {
    if (typeof rate === 'number' && Number.isFinite(rate)) this.rate = Math.min(1.5, Math.max(0.5, rate));
    if (accent && ACCENT_LANG[accent]) this.lang = ACCENT_LANG[accent];
  }

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  startListening(
    onResult: (text: string) => void,
    onError?: (err: string) => void,
    lang = 'en-US'
  ): void {
    if (!this.isSupported()) {
      onError?.('unsupported');
      return;
    }

    this.recognition?.abort();
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    this.recognition = recognition;
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let gotResult = false;
    recognition.onresult = (event) => {
      gotResult = true;
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    recognition.onerror = (event) => {
      gotResult = true;
      onError?.(event.error);
    };

    // Browsers end recognition silently on timeout in some cases — surface it
    // as "no-speech" so callers never get stuck in a listening state.
    recognition.onend = () => {
      if (!gotResult) onError?.('no-speech');
      if (this.recognition === recognition) this.recognition = null;
    };

    try {
      recognition.start();
    } catch {
      onError?.('audio-capture');
    }
  }

  stopListening(): void {
    const rec = this.recognition;
    this.recognition = null;
    if (rec) {
      rec.onend = null;
      rec.onerror = null;
      rec.onresult = null;
      rec.abort();
    }
  }

  speak(text: string, onEnd?: () => void): void {
    if (!this.synth) {
      onEnd?.();
      return;
    }

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.lang;
    utterance.rate = this.rate;
    const voice = this.synth.getVoices().find((v) => v.lang === this.lang);
    if (voice) utterance.voice = voice;
    if (onEnd) {
      utterance.onend = onEnd;
      // A cancelled utterance means the caller moved on — don't continue its flow.
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') onEnd();
      };
    }
    this.synth.speak(utterance);
  }

  stopSpeaking(): void {
    this.synth?.cancel();
  }
}

export const speechService = new WebSpeechService();

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
