import { scheduleReview, MASTERED_BOX } from '../src/services/review.service';
import { answerMatches, similarityScore } from '../src/utils/answerMatch';
import { scorePlacement } from '../src/routes/placement.routes';
import { PLACEMENT_MCQ, PLACEMENT_SPEAKING } from '../src/data/placementTest';

const DAY = 24 * 60 * 60 * 1000;

describe('spaced repetition', () => {
  const now = new Date('2026-11-08T00:00:00Z');
  it('moves a correct card up a box and further out', () => {
    expect(scheduleReview(0, true, now)).toEqual({ box: 1, nextReviewAt: new Date(now.getTime() + DAY) });
    expect(scheduleReview(2, true, now).nextReviewAt).toEqual(new Date(now.getTime() + 7 * DAY));
  });
  it('sends a missed card back to the start, due tomorrow', () => {
    expect(scheduleReview(4, false, now)).toEqual({ box: 0, nextReviewAt: new Date(now.getTime() + DAY) });
  });
  it('caps at mastered', () => {
    expect(scheduleReview(MASTERED_BOX, true, now).box).toBe(MASTERED_BOX);
  });
});

describe('answer matching', () => {
  it('ignores case and punctuation, rejects partial answers', () => {
    expect(answerMatches('i went to school.', 'I went to school')).toBe(true);
    expect(answerMatches('school', 'I went to school')).toBe(false);
  });
  it('scores spoken similarity', () => {
    expect(similarityScore('good morning how are you today', 'Good morning, how are you today?')).toBe(100);
    expect(similarityScore('good morning', 'Good morning, how are you today?')).toBeLessThan(50);
  });
});

describe('placement scoring', () => {
  const allRight = Object.fromEntries(PLACEMENT_MCQ.map((q) => [q.id, q.answer]));
  const perfectSpeech = Object.fromEntries(PLACEMENT_SPEAKING.map((q) => [q.id, q.sentence]));
  it('perfect answers place the learner as advanced', () => {
    expect(scorePlacement(allRight, perfectSpeech)).toMatchObject({ score: 100, level: 'advanced', correct: 10 });
  });
  it('no answers place as beginner; speaking is optional', () => {
    expect(scorePlacement({}, {})).toMatchObject({ score: 0, level: 'beginner' });
    expect(scorePlacement(allRight, {}).score).toBe(100);
  });
  it('only easy questions right lands at beginner/intermediate border', () => {
    const easy = Object.fromEntries(PLACEMENT_MCQ.filter((q) => q.weight === 1).map((q) => [q.id, q.answer]));
    expect(scorePlacement(easy, {}).level).toBe('beginner');
  });
});
