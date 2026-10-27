import * as Speech from 'expo-speech';

// Expo's managed workflow only ships TTS (expo-speech). There is no built-in
// speech-to-text here — a real STT path (e.g. @react-native-voice/voice or
// expo-speech-recognition) needs a custom dev client / EAS build, which this
// environment can't produce or test. Screens that need "listening" fall back
// to typed text input instead of silently faking voice recognition.
class ExpoSpeechService {
  speak(text: string, onEnd?: () => void): void {
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.9, onDone: onEnd });
  }

  stopSpeaking(): void {
    Speech.stop();
  }
}

export const speechService = new ExpoSpeechService();
