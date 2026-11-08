/**
 * Placement test: ~5 minutes. Multiple-choice items get harder as they go
 * (weight 1 → 3); speaking items are read aloud and scored on how closely the
 * transcript matches. Answers stay on the server.
 */
export interface McqItem {
  id: string;
  prompt: string;
  promptHindi?: string;
  options: string[];
  answer: number;
  weight: 1 | 2 | 3;
}

export interface SpeakingItem {
  id: string;
  sentence: string;
  weight: 1 | 2 | 3;
}

export const PLACEMENT_MCQ: McqItem[] = [
  { id: 'q1', prompt: 'My name ___ Riya.', promptHindi: 'Mera naam Riya hai.', options: ['am', 'is', 'are'], answer: 1, weight: 1 },
  { id: 'q2', prompt: 'Choose the opposite of "big".', options: ['tall', 'small', 'long'], answer: 1, weight: 1 },
  { id: 'q3', prompt: 'They ___ playing cricket now.', options: ['is', 'are', 'was'], answer: 1, weight: 1 },
  { id: 'q4', prompt: 'I ___ to school yesterday.', promptHindi: 'Main kal school gaya.', options: ['go', 'went', 'gone'], answer: 1, weight: 2 },
  { id: 'q5', prompt: 'Which sentence is correct?', options: ['She don\'t like tea.', 'She doesn\'t like tea.', 'She not like tea.'], answer: 1, weight: 2 },
  { id: 'q6', prompt: '"Could you help me, please?" is a ___ request.', options: ['rude', 'polite', 'angry'], answer: 1, weight: 2 },
  { id: 'q7', prompt: 'I have lived in Patna ___ 2019.', options: ['for', 'since', 'from'], answer: 1, weight: 2 },
  { id: 'q8', prompt: 'If it rains tomorrow, we ___ the match.', options: ['will cancel', 'cancelled', 'would cancelled'], answer: 0, weight: 3 },
  { id: 'q9', prompt: 'Choose the best meaning of "I\'m running late."', options: ['I am jogging slowly', 'I will arrive later than planned', 'I run every evening'], answer: 1, weight: 3 },
  { id: 'q10', prompt: 'The report ___ by the teacher before the meeting.', options: ['was checked', 'has check', 'checking'], answer: 0, weight: 3 },
];

export const PLACEMENT_SPEAKING: SpeakingItem[] = [
  { id: 's1', sentence: 'Good morning, how are you today?', weight: 1 },
  { id: 's2', sentence: 'I usually take the bus to school with my friends.', weight: 2 },
  { id: 's3', sentence: 'If I had more time, I would learn to play the guitar.', weight: 3 },
];

/** Level from the overall 0–100 score. */
export function levelForScore(score: number): 'beginner' | 'intermediate' | 'advanced' {
  if (score >= 75) return 'advanced';
  if (score >= 40) return 'intermediate';
  return 'beginner';
}
