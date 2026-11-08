/** Lenient comparison of a typed answer with the expected sentence (mirrors the web lesson checker). */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordDistance(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

/** Exact match, the full expected phrase inside the answer, or one small slip in a 4+ word sentence. */
export function answerMatches(given: string, expected: string): boolean {
  const g = normalizeAnswer(given);
  const e = normalizeAnswer(expected);
  if (!g || !e) return false;
  if (g === e || ` ${g} `.includes(` ${e} `)) return true;
  const ew = e.split(' ');
  return ew.length >= 4 && wordDistance(g.split(' '), ew) <= 1;
}

/** 0–100 word-level similarity, used to score spoken placement answers. */
export function similarityScore(given: string, expected: string): number {
  const g = normalizeAnswer(given).split(' ').filter(Boolean);
  const e = normalizeAnswer(expected).split(' ').filter(Boolean);
  if (e.length === 0) return 0;
  return Math.max(0, Math.round((1 - wordDistance(g, e) / Math.max(e.length, g.length)) * 100));
}
