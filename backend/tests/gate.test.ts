import { gateBlocks } from '../src/middleware/auth';

describe('gateBlocks (Terms + parental consent gate)', () => {
  it('lets active accounts through everywhere', () => {
    expect(gateBlocks('ok', '/api/chat/message')).toBe(false);
  });

  it('blocks learning features until setup or parent consent is done', () => {
    for (const gate of ['setup', 'parent_pending', 'parent_denied']) {
      expect(gateBlocks(gate, '/api/chat/message')).toBe(true);
      expect(gateBlocks(gate, '/api/progress/dashboard')).toBe(true);
      expect(gateBlocks(gate, '/api/lessons/daily?x=1')).toBe(true);
    }
  });

  it('still allows the profile and the data rights endpoints', () => {
    expect(gateBlocks('parent_pending', '/api/auth/me')).toBe(false);
    expect(gateBlocks('parent_pending', '/api/account/export')).toBe(false);
    expect(gateBlocks('parent_denied', '/api/account/export?download=1')).toBe(false);
    expect(gateBlocks('setup', '/api/auth/meow')).toBe(true);
  });
});
