export type ExerciseType =
  | 'repeat'
  | 'fill-blank'
  | 'translate'
  | 'mcq'
  | 'match'
  | 'word-bank'
  | 'listen-type';

export interface Exercise {
  type: ExerciseType;
  prompt: string;
  promptHindi?: string;
  answer: string;
  options?: string[];
  pairs?: Array<{ left: string; right: string }>;
  words?: string[];
}

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

export function scoreAnswer(given: string, expected: string): boolean {
  const g = normalize(given);
  const e = normalize(expected);
  if (!g) return false;
  if (g === e) return true;
  return g.includes(e) || e.includes(g);
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
