import * as Speech from 'expo-speech';
import type {
  ExpoSpeechRecognitionErrorCode,
  ExpoSpeechRecognitionModuleType,
} from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule.types';

/**
 * Text-to-speech comes from expo-speech (works everywhere).
 *
 * Speech-to-text comes from expo-speech-recognition, a native module. It is
 * present in EAS / dev-client builds and on web (Web Speech API), but NOT in
 * Expo Go — there `requireNativeModule` throws. We load it lazily inside a
 * try/catch so the app keeps working and screens show a typing fallback.
 */
type Recognizer = ExpoSpeechRecognitionModuleType;

let recognizer: Recognizer | null | undefined;

function getRecognizer(): Recognizer | null {
  if (recognizer !== undefined) return recognizer;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-speech-recognition') as { ExpoSpeechRecognitionModule: Recognizer };
    const r = mod.ExpoSpeechRecognitionModule;
    recognizer = r && typeof r.start === 'function' && r.isRecognitionAvailable() ? r : null;
  } catch {
    recognizer = null;
  }
  return recognizer;
}

export type SpeechErrorCode = ExpoSpeechRecognitionErrorCode | 'unavailable';

export function speechErrorMessage(code: SpeechErrorCode): string {
  switch (code) {
    case 'not-allowed':
      return 'Mic ki permission nahi mili. Settings mein KijiTalk ko microphone allow karo.';
    case 'no-speech':
    case 'speech-timeout':
      return 'Kuch sunai nahi diya. Phone paas rakhkar dobara bolo.';
    case 'network':
      return 'Internet slow hai — dobara try karo ya type kar do.';
    case 'language-not-supported':
    case 'service-not-allowed':
    case 'unavailable':
      return 'Is phone par voice typing available nahi hai. Neeche type kar do.';
    case 'busy':
      return 'Mic abhi busy hai. Ek second baad dobara try karo.';
    case 'aborted':
      return '';
    default:
      return 'Awaaz pakad nahi paye. Dobara bolo ya type kar do.';
  }
}

interface Session {
  remove: () => void;
}

class ExpoSpeechService {
  private session: Session | null = null;

  /** True when this build can do speech-to-text (EAS/dev build or web). */
  get canListen(): boolean {
    return getRecognizer() !== null;
  }

  speak(text: string, onEnd?: () => void): void {
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.9, onDone: onEnd });
  }

  stopSpeaking(): void {
    Speech.stop();
  }

  /**
   * Listen for one utterance. `onPartial` streams interim text, `onResult`
   * fires once with the final transcript, `onError` with a code (see
   * speechErrorMessage). Calling it again cancels the previous session.
   */
  async startListening(
    onResult: (text: string) => void,
    onError: (code: SpeechErrorCode) => void,
    onPartial?: (text: string) => void,
    lang = 'en-IN'
  ): Promise<void> {
    const r = getRecognizer();
    if (!r) return onError('unavailable');
    this.cleanup();
    Speech.stop();

    const perm = await r.requestPermissionsAsync().catch(() => null);
    if (!perm?.granted) return onError('not-allowed');

    let finished = false;
    let latest = '';
    const finish = (fn: () => void) => {
      if (finished) return;
      finished = true;
      this.cleanup();
      fn();
    };

    const subs = [
      r.addListener('result', (e) => {
        const text = e.results[0]?.transcript?.trim() ?? '';
        if (!text) return;
        latest = text;
        if (e.isFinal) finish(() => onResult(text));
        else onPartial?.(text);
      }),
      r.addListener('error', (e) => {
        // "no-speech" after we already heard something still counts as a result.
        if (latest && (e.error === 'no-speech' || e.error === 'speech-timeout')) finish(() => onResult(latest));
        else finish(() => onError(e.error));
      }),
      r.addListener('end', () => {
        finish(() => (latest ? onResult(latest) : onError('no-speech')));
      }),
    ];
    this.session = { remove: () => subs.forEach((s) => s.remove()) };

    try {
      r.start({ lang, interimResults: true, maxAlternatives: 1, continuous: false });
    } catch {
      finish(() => onError('unavailable'));
    }
  }

  /** Stop and keep what was heard so far (fires onResult). */
  stopListening(): void {
    try {
      getRecognizer()?.stop();
    } catch {
      this.cleanup();
    }
  }

  /** Cancel without a result. */
  cancelListening(): void {
    try {
      getRecognizer()?.abort();
    } catch {
      /* ignore */
    }
    this.cleanup();
  }

  private cleanup() {
    this.session?.remove();
    this.session = null;
  }
}

export const speechService = new ExpoSpeechService();
