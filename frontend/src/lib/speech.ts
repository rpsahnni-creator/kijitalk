'use client';

export class WebSpeechService {
  private recognition: SpeechRecognition | null = null;
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

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
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = lang;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    this.recognition.onerror = (event) => {
      onError?.(event.error);
    };

    this.recognition.start();
  }

  stopListening(): void {
    this.recognition?.stop();
  }

  speak(text: string, onEnd?: () => void): void {
    if (!this.synth) return;

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    if (onEnd) utterance.onend = onEnd;
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
