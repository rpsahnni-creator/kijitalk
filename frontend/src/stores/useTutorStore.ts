'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TutorEngine } from '@/lib/api';

interface TutorState {
  engine: TutorEngine;
  claudeAvailable: boolean;
  recognitionLang: 'hi-IN' | 'en-US';
  setEngine: (engine: TutorEngine) => void;
  setClaudeAvailable: (available: boolean) => void;
  setRecognitionLang: (lang: 'hi-IN' | 'en-US') => void;
}

export const useTutorStore = create<TutorState>()(
  persist(
    (set) => ({
      engine: 'gemini',
      claudeAvailable: false,
      recognitionLang: 'hi-IN',
      setEngine: (engine) => set({ engine }),
      setClaudeAvailable: (claudeAvailable) => set({ claudeAvailable }),
      setRecognitionLang: (recognitionLang) => set({ recognitionLang }),
    }),
    { name: 'kijitalk-tutor-prefs' }
  )
);
