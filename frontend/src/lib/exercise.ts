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

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  repeat: 'Listen & repeat',
  'fill-blank': 'Fill in the blank',
  translate: 'Translate',
  mcq: 'Choose the answer',
  match: 'Match the pairs',
  'word-bank': 'Build the sentence',
  'listen-type': 'Listen & type',
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

/**
 * Checks a typed answer. Accepts an exact match (ignoring case/punctuation),
 * an answer that contains the full expected phrase as whole words, or — for
 * longer sentences — one with a single small word-level slip. A partial
 * answer such as "you" for "How are you doing" is rejected.
 */
export function scoreAnswer(given: string, expected: string): boolean {
  const g = normalize(given);
  const e = normalize(expected);
  if (!g || !e) return false;
  if (g === e) return true;
  if (` ${g} `.includes(` ${e} `)) return true;

  const gWords = g.split(' ');
  const eWords = e.split(' ');
  if (eWords.length >= 4) {
    return editDistance(gWords, eWords) <= 1;
  }
  return false;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
