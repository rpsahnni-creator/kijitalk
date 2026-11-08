import { isStreakAtRisk, istDay } from '../src/jobs/streakReminders';

describe('streak reminders', () => {
  const now = new Date('2026-11-08T14:00:00Z'); // 7:30 pm IST

  it('uses India dates', () => {
    expect(istDay(new Date('2026-11-07T19:00:00Z'))).toBe('2026-11-08'); // 00:30 IST next day
  });

  it('flags learners who practised yesterday but not today', () => {
    expect(isStreakAtRisk(new Date('2026-11-07T10:00:00Z'), 5, now)).toBe(true);
  });

  it('skips today, older activity and empty streaks', () => {
    expect(isStreakAtRisk(new Date('2026-11-08T05:00:00Z'), 5, now)).toBe(false);
    expect(isStreakAtRisk(new Date('2026-11-05T10:00:00Z'), 5, now)).toBe(false);
    expect(isStreakAtRisk(new Date('2026-11-07T10:00:00Z'), 0, now)).toBe(false);
  });
});
