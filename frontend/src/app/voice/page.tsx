'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Volume2, RotateCcw } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuthStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import { speechService } from '@/lib/speech';

const PRACTICE_PHRASES = [
  'The weather is beautiful today.',
  'I would like to order a coffee, please.',
  'Could you tell me where the nearest station is?',
  'I have been learning English for six months.',
  'Practice makes perfect when learning a new language.',
];

export default function VoicePage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [wordScores, setWordScores] = useState<Array<{ word: string; score: number }>>([]);
  const [loading, setLoading] = useState(false);

  const phrase = PRACTICE_PHRASES[phraseIndex];

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  const startListening = () => {
    setTranscript('');
    setScore(null);
    setListening(true);
    speechService.startListening(
      (text) => {
        setTranscript(text);
        setListening(false);
        analyzePronunciation(text);
      },
      () => setListening(false)
    );
  };

  const analyzePronunciation = async (spoken: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await api.post<{
        score: number;
        feedback: string;
        wordScores: Array<{ word: string; score: number }>;
      }>('/api/voice/pronunciation', { expected: phrase, spoken }, token);
      setScore(result.score);
      setFeedback(result.feedback);
      setWordScores(result.wordScores);
    } catch {
      setFeedback('Could not analyze pronunciation. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextPhrase = () => {
    setPhraseIndex((i) => (i + 1) % PRACTICE_PHRASES.length);
    setTranscript('');
    setScore(null);
    setFeedback('');
    setWordScores([]);
  };

  if (!initialized || !user) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-6">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Voice Practice</h1>
          <p className="text-slate-500">Speak the phrase and get pronunciation feedback</p>
        </header>

        <div className="card mb-6 text-center">
          <p className="mb-2 text-sm text-slate-500">Read aloud:</p>
          <p className="text-xl font-semibold leading-relaxed">{phrase}</p>
          <button
            onClick={() => speechService.speak(phrase)}
            className="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline"
          >
            <Volume2 size={16} /> Listen to pronunciation
          </button>
        </div>

        <div className="mb-6 flex justify-center">
          <button
            onClick={listening ? () => { speechService.stopListening(); setListening(false); } : startListening}
            className={`flex h-24 w-24 items-center justify-center rounded-full transition ${
              listening
                ? 'animate-pulse bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'gradient-hero text-white shadow-lg shadow-brand-600/30 hover:scale-105'
            }`}
          >
            {listening ? <MicOff size={36} /> : <Mic size={36} />}
          </button>
        </div>

        <p className="mb-6 text-center text-sm text-slate-500">
          {listening ? 'Listening... speak now' : 'Tap the microphone to start'}
        </p>

        {transcript && (
          <div className="card mb-4">
            <p className="text-sm text-slate-500">You said:</p>
            <p className="font-medium">{transcript}</p>
          </div>
        )}

        {loading && <p className="text-center text-slate-500">Analyzing pronunciation...</p>}

        {score !== null && (
          <div className="card text-center">
            <div className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold ${
              score >= 80 ? 'bg-brand-100 text-brand-700' : score >= 60 ? 'bg-accent-100 text-accent-700' : 'bg-red-100 text-red-700'
            }`}>
              {score}%
            </div>
            <p className="mb-4 font-medium">{feedback}</p>
            {wordScores.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {wordScores.map(({ word, score: ws }) => (
                  <span
                    key={word}
                    className={`rounded-full px-3 py-1 text-sm ${
                      ws >= 80 ? 'bg-brand-100 text-brand-700' : ws >= 60 ? 'bg-accent-100 text-accent-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {word} {ws}%
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <button onClick={nextPhrase} className="btn-secondary mt-6 w-full">
          <RotateCcw size={18} /> Next Phrase
        </button>
      </div>
    </AppShell>
  );
}
