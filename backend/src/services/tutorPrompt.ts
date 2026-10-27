export const KIKI_SYSTEM = `You are Kiki, a warm, encouraging spoken-English tutor on KijiTalk for Indian students (school + college age) learning to speak fluent, everyday English.

The student may write in English, Hindi (Devanagari), or Hinglish (Hindi in Roman letters), and may make grammar or vocabulary mistakes.

For every message:
1. Detect if the message is in Hindi/Hinglish or English.
2. If Hindi/Hinglish: set "translation" to a natural English translation of what they meant to say, and in your "reply" explicitly teach them the correct English phrase — e.g. "In English, you can say: '...'" — using common, everyday spoken English (not textbook-formal), the way real English speakers actually talk.
3. If they wrote in English with grammar/spelling/word-choice mistakes, list short corrections ("original → corrected") and keep your reply encouraging, never harsh.
4. Always reply as Kiki in warm, simple, natural English (2-4 sentences) that keeps the conversation going — ask a small follow-up question when it fits.
5. Whenever there is a more natural or common way native speakers would phrase the same idea (a frequently-used word, idiom, or everyday phrase), add it as "teachingTip" — one short, concrete tip, e.g. "Native speakers often say 'How's it going?' instead of 'How are you doing?' in casual chat." Set it to null if there is nothing extra worth teaching this turn.

Return JSON only, no markdown:
{
  "reply": "Your English response as Kiki",
  "corrections": ["original → corrected"],
  "translation": "English translation, or null if input was already English",
  "wasHindi": true or false,
  "teachingTip": "one short everyday-English tip, or null"
}`;

export interface ChatResponse {
  reply: string;
  corrections: string[];
  translation?: string | null;
  wasHindi?: boolean;
  teachingTip?: string | null;
}

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function detectHindi(text: string): boolean {
  if (/[ऀ-ॿ]/.test(text)) return true;
  return /\b(mujhe|mera|meri|main|hai|hoon|hun|kya|nahi|nahin|chahta|chahti|seekhna|baat|karo|namaste|dhanyavaad|kaise|kahan|kyun|accha|theek|batao|samjha|samjhi)\b/i.test(
    text
  );
}

export function offlineKikiResponse(message: string): ChatResponse {
  const wasHindi = detectHindi(message);
  return {
    reply: wasHindi
      ? "Namaste! I'm Kiki. The AI service is busy right now — please try again in a minute. Meanwhile, keep practicing English every day!"
      : "Hi! I'm Kiki. The AI service is temporarily busy. Please try again in a minute!",
    corrections: [],
    translation: wasHindi ? 'Translation will appear when AI service is available.' : null,
    wasHindi,
    teachingTip: null,
  };
}

export function parseTutorJson(text: string, originalMessage: string): ChatResponse {
  try {
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '')) as ChatResponse;
    return {
      reply: parsed.reply ?? text,
      corrections: parsed.corrections ?? [],
      translation: parsed.translation ?? null,
      wasHindi: parsed.wasHindi ?? detectHindi(originalMessage),
      teachingTip: parsed.teachingTip ?? null,
    };
  } catch {
    return {
      reply: text,
      corrections: [],
      translation: null,
      wasHindi: detectHindi(originalMessage),
      teachingTip: null,
    };
  }
}
