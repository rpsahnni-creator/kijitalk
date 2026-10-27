import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../utils/logger';
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
      logger.warn(`Gemini model ${modelName} failed, trying next...`, error);
    }
  }

  throw lastError;
}

export async function chatWithGemini(
  message: string,
  history: TutorMessage[] = [],
  systemPrompt?: string
): Promise<ChatResponse> {
  try {
    const text = await generateWithFallback(message, toGeminiHistory(history), systemPrompt ?? KIKI_SYSTEM);
    return parseTutorJson(text, message);
  } catch (error) {
    logger.error('Gemini API error:', error);
    return offlineKikiResponse(message);
  }
}

export async function analyzePronunciation(
  expected: string,
  spoken: string
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

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    return {
      score: Math.min(100, Math.max(0, parsed.score ?? 0)),
      feedback: parsed.feedback ?? 'Keep practicing!',
      wordScores: parsed.wordScores ?? [],
    };
  } catch (error) {
    logger.error('Pronunciation analysis error:', error);
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
