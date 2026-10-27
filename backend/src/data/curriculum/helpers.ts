import type { Exercise } from '../../types/exercise';

export interface LessonSeed {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  durationMinutes: number;
  order: number;
  tags: string[];
  gradeBand?: string;
  content: { vocabulary: string[]; phrases: string[]; exercises: Exercise[] };
}

// Simple seeded shuffle (deterministic enough for build-time content; not security sensitive).
let seedCounter = 1;
function rand(): number {
  seedCounter = (seedCounter * 1103515245 + 12345) & 0x7fffffff;
  return seedCounter / 0x7fffffff;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function chunk<T>(arr: T[], parts: number): T[][] {
  const result: T[][] = Array.from({ length: parts }, () => []);
  arr.forEach((item, i) => result[i % parts].push(item));
  return result;
}

export function pickRandom<T>(arr: T[], n: number, exclude: T[] = []): T[] {
  const pool = arr.filter((x) => !exclude.includes(x));
  return shuffle(pool).slice(0, n);
}

export function repeatEx(answer: string, promptHindi?: string): Exercise {
  return { type: 'repeat', prompt: `Say: ${answer}`, answer, promptHindi };
}

export function listenTypeEx(answer: string): Exercise {
  return { type: 'listen-type', prompt: `Listen and type what you hear.`, answer };
}

export function fillBlankEx(sentence: string, answer: string, promptHindi?: string): Exercise {
  const re = new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const prompt = sentence.replace(re, '___');
  return { type: 'fill-blank', prompt, answer, promptHindi };
}

export function translateEx(hi: string, en: string): Exercise {
  return { type: 'translate', prompt: `Hindi: ${hi}`, answer: en };
}

export function mcqEx(prompt: string, answer: string, distractors: string[], promptHindi?: string): Exercise {
  const options = shuffle([answer, ...distractors.slice(0, 3)]);
  return { type: 'mcq', prompt, options, answer, promptHindi };
}

export function wordBankEx(sentence: string): Exercise {
  const clean = sentence.replace(/[.?!]+$/, '');
  const words = clean.split(' ');
  return { type: 'word-bank', prompt: 'Build the sentence:', words: shuffle(words), answer: clean };
}

export function matchEx(
  pairs: Array<{ left: string; right: string }>,
  prompt = 'Match the pairs:'
): Exercise {
  return { type: 'match', prompt, pairs, answer: pairs.map((p) => `${p.left}-${p.right}`).join(',') };
}

export const DISTRACTOR_WORDS = [
  'table',
  'river',
  'window',
  'happy',
  'quickly',
  'yesterday',
  'because',
  'garden',
  'music',
  'bottle',
  'purple',
  'mountain',
  'silent',
  'wooden',
  'journey',
  'kitchen',
  'orange',
  'bicycle',
  'thunder',
  'pillow',
  'market',
  'cousin',
  'ladder',
  'pocket',
  'engine',
  'blanket',
  'forest',
  'cabinet',
  'whistle',
  'anchor',
];
