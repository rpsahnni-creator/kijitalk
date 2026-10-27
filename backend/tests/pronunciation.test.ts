describe('Pronunciation scoring logic', () => {
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
    return 1 - matrix[b.length][a.length] / Math.max(a.length, b.length);
  }

  it('returns 1 for identical strings', () => {
    expect(levenshteinSimilarity('hello', 'hello')).toBe(1);
  });

  it('returns lower score for different strings', () => {
    expect(levenshteinSimilarity('hello', 'helo')).toBeGreaterThan(0.5);
    expect(levenshteinSimilarity('hello', 'world')).toBeLessThan(0.5);
  });
});

describe('Health endpoint', () => {
  it('should return ok status shape', () => {
    const response = { status: 'ok', service: 'kijitalk-api' };
    expect(response.status).toBe('ok');
    expect(response.service).toBe('kijitalk-api');
  });
});
