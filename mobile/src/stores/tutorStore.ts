import { create } from 'zustand';
import type { TutorEngine } from '@/lib/api';

interface TutorState {
  engine: TutorEngine;
  claudeAvailable: boolean;
  setEngine: (engine: TutorEngine) => void;
  setClaudeAvailable: (available: boolean) => void;
}

// Not persisted across app launches (unlike the web version's localStorage
// persistence) to avoid adding a native AsyncStorage dependency for a
// low-stakes preference — resets to Gemini/free on each cold start.
export const useTutorStore = create<TutorState>((set) => ({
  engine: 'gemini',
  claudeAvailable: false,
  setEngine: (engine) => set({ engine }),
  setClaudeAvailable: (claudeAvailable) => set({ claudeAvailable }),
}));
