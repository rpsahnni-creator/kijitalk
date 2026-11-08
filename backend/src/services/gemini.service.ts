import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { isProviderPaused, recordAiCall } from './aiMonitor.service';
import {
  ChatResponse,
  KIKI_SYSTEM,
  TutorMessage,
  offlineKikiResponse,
  parseTutorJson,
} from './tutorPrompt';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export { KIKI_SYSTEM, detectHindi } from './tutorPrompt';
export type { ChatResponse } from './tutorPrompt';

const MODELS = [
  env.GEMINI_MODEL,
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
].filter((m, i, arr) => arr.indexOf(m) === i);

function toGeminiHistory(history: TutorMessage[]) {
  return history.map((m) => ({
    role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
    parts: [{ text: m.content }] as [{ text: string }],
  }));
}

async function generateWithFallback(
  message: string,
  history: ReturnType<typeof toGeminiHistory>,
  systemInstruction: string
): Promise<string> {
  let lastError: unknown;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      lastError = error;
      const text = error instanceof Error ? error.message : String(error);
      if (/API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(text)) break; // no model will work
      logger.warn(`Gemini model ${modelName} failed, trying next...`, error);
    }
  }

  throw lastError;
}

/** One Gemini tutor reply. Throws when every Gemini model fails — the tutor service then falls back. */
export async function geminiReply(
  message: string,
  history: TutorMessage[] = [],
  systemPrompt?: string
): Promise<ChatResponse> {
  const text = await generateWithFallback(message, toGeminiHistory(history), systemPrompt ?? KIKI_SYSTEM);
  return parseTutorJson(text, message);
}

export async function chatWithGemini(
  message: string,
  history: TutorMessage[] = [],
  systemPrompt?: string
): Promise<ChatResponse> {
  try {
    return await geminiReply(message, history, systemPrompt);
  } catch (error) {
    logger.error('Gemini API error:', error);
    return offlineKikiResponse(message);
  }
}

/** Startup check so a bad GEMINI_API_KEY shows up in logs and /health right away. */
export async function checkGeminiKey(): Promise<{ ok: boolean; error?: unknown }> {
  try {
    await genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }).countTokens('ping');
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function analyzePronunciation(
  expected: string,
  spoken: string,
  userId?: string
): Promise<{ score: number; feedback: string; wordScores: Array<{ word: string; score: number }> }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Compare expected vs spoken English text for pronunciation assessment.
Expected: "${expected}"
Spoken (transcribed): "${spoken}"

Return JSON only:
{
  "score": 0-100,
  "feedback": "brief encouraging feedback",
  "wordScores": [{ "word": "...", "score": 0-100 }]
}`;

  const started = Date.now();
  try {
    if (isProviderPaused('gemini')) throw new Error('Gemini paused after repeated failures');
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    recordAiCall({ provider: 'gemini', feature: 'voice', ok: true, latencyMs: Date.now() - started, userId });
    return {
      score: Math.min(100, Math.max(0, parsed.score ?? 0)),
      feedback: parsed.feedback ?? 'Keep practicing!',
      wordScores: parsed.wordScores ?? [],
    };
  } catch (error) {
    logger.error('Pronunciation analysis error:', error);
    recordAiCall({ provider: 'gemini', feature: 'voice', ok: false, latencyMs: Date.now() - started, userId, error });
    // Local word-by-word scoring keeps voice practice working without AI.
    return calculateBasicPronunciationScore(expected, spoken);
  }
}

function calculateBasicPronunciationScore(
  expected: string,
  spoken: string
): { score: number; feedback: string; wordScores: Array<{ word: string; score: number }> } {
  const expectedWords = expected.toLowerCase().split(/\s+/);
  const spokenWords = spoken.toLowerCase().split(/\s+/);

  const wordScores = expectedWords.map((word, i) => {
    const spokenWord = spokenWords[i] ?? '';
    const similarity = word === spokenWord ? 100 : levenshteinSimilarity(word, spokenWord) * 100;
    return { word, score: Math.round(similarity) };
  });

  const score =
    wordScores.length > 0
      ? Math.round(wordScores.reduce((sum, w) => sum + w.score, 0) / wordScores.length)
      : 0;

  return {
    score,
    feedback: score >= 80 ? 'Great pronunciation!' : score >= 60 ? 'Good effort, keep practicing!' : 'Try speaking more slowly and clearly.',
    wordScores,
  };
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1;
    }
  }

  const maxLen = Math.max(a.length, b.length);
  return 1 - matrix[b.length][a.length] / maxLen;
}
