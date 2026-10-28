'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, Heart, HeartCrack, Volume2, XCircle } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuthStore } from '@/stores/useStore';
import { api, Lesson } from '@/lib/api';
import { speechService } from '@/lib/speech';
import { scoreAnswer, shuffle } from '@/lib/exercise';

const MAX_HEARTS = 5;

export default function LessonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [status, setStatus] = useState<'intro' | 'running' | 'out-of-hearts' | 'completed'>('intro');
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [wordBankPicked, setWordBankPicked] = useState<string[]>([]);
  const [matchLeft, setMatchLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempted, setAttempted] = useState(0);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    if (!id) return;
    api.get<{ lesson: Lesson }>(`/api/lessons/${id}`).then((d) => setLesson(d.lesson)).catch(console.error);
  }, [id]);

  const exercise = lesson?.exercises[exerciseIndex];
  const totalExercises = lesson?.exercises.length ?? 0;

  const shuffledWords = useMemo(
    () => (exercise?.type === 'word-bank' ? shuffle(exercise.words ?? []) : []),
    [exercise]
  );
  const shuffledRight = useMemo(
    () => (exercise?.type === 'match' ? shuffle((exercise.pairs ?? []).map((p) => p.right)) : []),
    [exercise]
  );

  const resetExerciseState = () => {
    setAnswer('');
    setSelectedOption(null);
    setWordBankPicked([]);
    setMatchLeft(null);
    setMatchedPairs([]);
    setFeedback(null);
  };

  const completeLesson = async (finalScore: number, finalHearts: number, finalCorrect: number) => {
    if (!token || !id) return;
    await api.post(
      `/api/lessons/${id}/complete`,
      {
        score: finalScore,
        minutesSpent: lesson?.durationMinutes ?? 10,
        heartsRemaining: finalHearts,
        correctCount: finalCorrect,
        totalExercises,
      },
      token
    );
    setStatus('completed');
  };

  const advance = (wasCorrect: boolean) => {
    const nextAttempted = attempted + 1;
    const nextCorrect = wasCorrect ? correctCount + 1 : correctCount;
    setAttempted(nextAttempted);
    setCorrectCount(nextCorrect);

    let nextHearts = hearts;
    if (!wasCorrect) {
      nextHearts = hearts - 1;
      setHearts(nextHearts);
    }

    if (nextHearts <= 0) {
      setStatus('out-of-hearts');
      return;
    }

    if (exerciseIndex < totalExercises - 1) {
      setExerciseIndex((i) => i + 1);
      resetExerciseState();
    } else {
      const finalScore = Math.round((nextCorrect / nextAttempted) * 100);
      completeLesson(finalScore, nextHearts, nextCorrect);
    }
  };

  const checkTextAnswer = () => {
    if (!exercise) return;
    const isCorrect = scoreAnswer(answer, exercise.answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setTimeout(() => advance(true), 500);
    }
  };

  const checkMcq = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const isCorrect = normalizeEq(option, exercise!.answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => advance(isCorrect), 700);
  };

  const pickWord = (word: string, idx: number) => {
    setWordBankPicked((prev) => [...prev, word]);
  };

  const undoWord = () => setWordBankPicked((prev) => prev.slice(0, -1));

  const checkWordBank = () => {
    if (!exercise) return;
    const built = wordBankPicked.join(' ');
    const isCorrect = normalizeEq(built, exercise.answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setTimeout(() => advance(true), 500);
  };

  const pickMatchRight = (right: string) => {
    if (!exercise?.pairs || matchLeft === null) return;
    const pair = exercise.pairs.find((p) => p.left === matchLeft);
    const isCorrect = pair?.right === right;
    if (isCorrect) {
      const updated = [...matchedPairs, matchLeft];
      setMatchedPairs(updated);
      setMatchLeft(null);
      if (updated.length === exercise.pairs.length) {
        setTimeout(() => advance(true), 400);
      }
    } else {
      setMatchLeft(null);
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 500);
      setHearts((h) => Math.max(0, h - 1));
      if (hearts - 1 <= 0) setTimeout(() => setStatus('out-of-hearts'), 500);
    }
  };

  const retryLesson = () => {
    setExerciseIndex(0);
    setHearts(MAX_HEARTS);
    setCorrectCount(0);
    setAttempted(0);
    resetExerciseState();
    setStatus('running');
  };

  if (!initialized || !user || !lesson) return <LoadingScreen />;

  if (status === 'out-of-hearts') {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg p-6 text-center">
          <HeartCrack className="mx-auto mb-4 text-red-500" size={64} />
          <h1 className="mb-2 text-2xl font-bold">Hearts khatam ho gaye!</h1>
          <p className="mb-6 text-slate-500">Koi baat nahi — practice se hi perfect hoga. Dobara try karo!</p>
          <div className="flex justify-center gap-3">
            <button onClick={retryLesson} className="btn-primary">Dobara try karo</button>
            <button onClick={() => router.push('/lessons')} className="btn-secondary">Baad mein karunga</button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (status === 'completed') {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg p-6 text-center">
          <CheckCircle className="mx-auto mb-4 text-success-500" size={64} />
          <h1 className="mb-2 text-2xl font-bold">Shabash! Lesson Complete 🎉</h1>
          <p className="mb-6 text-slate-500">&quot;{lesson.title}&quot; — achha kaam kiya!</p>
          <button onClick={() => router.push('/dashboard')} className="btn-primary">
            Dashboard par jao
          </button>
        </div>
      </AppShell>
    );
  }

  if (status === 'intro') {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl p-6">
          <header className="mb-6">
            <p className="text-sm text-brand-600">{lesson.category} · {lesson.level}</p>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-slate-500">{lesson.description}</p>
          </header>

          <div className="card mb-6">
            <h2 className="mb-3 font-semibold">Shabd (Vocabulary)</h2>
            <div className="flex flex-wrap gap-2">
              {lesson.vocabulary.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => speechService.speak(word)}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                >
                  {word} <Volume2 size={12} />
                </button>
              ))}
            </div>
          </div>

          <div className="card mb-6">
            <h2 className="mb-3 font-semibold">Important Lines</h2>
            <ul className="space-y-2">
              {lesson.phrases.map((phrase) => (
                <li key={phrase} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700">
                  <span>{phrase}</span>
                  <button type="button" onClick={() => speechService.speak(phrase)} className="text-brand-600">
                    <Volume2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button type="button" onClick={() => setStatus('running')} className="btn-primary w-full">
            Start Practice ({totalExercises} exercises)
          </button>
        </div>
      </AppShell>
    );
  }

  if (!exercise) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${((exerciseIndex + 1) / totalExercises) * 100}%` }}
            />
          </div>
          <div className="ml-4 flex items-center gap-1 text-red-500">
            {Array.from({ length: MAX_HEARTS }).map((_, i) => (
              <Heart key={i} size={18} fill={i < hearts ? 'currentColor' : 'none'} />
            ))}
          </div>
        </div>

        <div className="card mb-6">
          <p className="mb-1 text-sm text-slate-500">
            Exercise {exerciseIndex + 1} of {totalExercises} · {exercise.type}
          </p>
          <p className="mb-1 text-lg font-medium">{exercise.prompt}</p>
          {exercise.promptHindi && <p className="mb-4 text-sm text-slate-500">{exercise.promptHindi}</p>}

          {(exercise.type === 'fill-blank' || exercise.type === 'translate') && (
            <>
              <input
                value={answer}
                onChange={(e) => { setAnswer(e.target.value); setFeedback(null); }}
                className="input-field"
                placeholder={exercise.type === 'translate' ? 'English mein likho...' : 'Your answer...'}
              />
              <button type="button" onClick={checkTextAnswer} className="btn-primary mt-4 w-full">
                Check
              </button>
            </>
          )}

          {exercise.type === 'repeat' && (
            <>
              <button type="button" onClick={() => speechService.speak(exercise.answer)} className="btn-secondary">
                <Volume2 size={16} /> Suno aur repeat karo
              </button>
              <button type="button" onClick={() => advance(true)} className="btn-primary mt-4 w-full">
                {exerciseIndex < totalExercises - 1 ? 'Next' : 'Complete Lesson'}
              </button>
            </>
          )}

          {exercise.type === 'listen-type' && (
            <>
              <button type="button" onClick={() => speechService.speak(exercise.answer)} className="btn-secondary mb-3">
                <Volume2 size={16} /> Play Audio
              </button>
              <input
                value={answer}
                onChange={(e) => { setAnswer(e.target.value); setFeedback(null); }}
                className="input-field"
                placeholder="Jo suna wo type karo..."
              />
              <button type="button" onClick={checkTextAnswer} className="btn-primary mt-4 w-full">
                Check
              </button>
            </>
          )}

          {exercise.type === 'mcq' && (
            <div className="grid gap-2">
              {(exercise.options ?? []).map((option) => {
                const isSelected = selectedOption === option;
                const isAnswer = normalizeEq(option, exercise.answer);
                const showState = selectedOption !== null;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={selectedOption !== null}
                    onClick={() => checkMcq(option)}
                    className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                      showState && isSelected && isAnswer
                        ? 'border-success-500 bg-success-50 dark:bg-success-900/30'
                        : showState && isSelected && !isAnswer
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                        : showState && isAnswer
                        ? 'border-success-500'
                        : 'border-slate-200 hover:border-brand-400 dark:border-slate-600'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {exercise.type === 'word-bank' && (
            <>
              <div className="mb-4 flex min-h-[48px] flex-wrap gap-2 rounded-xl border-2 border-dashed border-slate-300 p-3 dark:border-slate-600">
                {wordBankPicked.map((w, i) => (
                  <span key={i} className="rounded-lg bg-brand-100 px-3 py-1.5 text-sm text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
                    {w}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {shuffledWords.map((w, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickWord(w, i)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    {w}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={undoWord} className="btn-secondary flex-1">Undo</button>
                <button type="button" onClick={checkWordBank} className="btn-primary flex-1">Check</button>
              </div>
            </>
          )}

          {exercise.type === 'match' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                {(exercise.pairs ?? []).map((pair) => (
                  <button
                    key={pair.left}
                    type="button"
                    disabled={matchedPairs.includes(pair.left)}
                    onClick={() => setMatchLeft(pair.left)}
                    className={`w-full rounded-lg border-2 px-3 py-2 text-left text-sm ${
                      matchedPairs.includes(pair.left)
                        ? 'border-success-500 bg-success-50 opacity-60 dark:bg-success-900/30'
                        : matchLeft === pair.left
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {pair.left}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {shuffledRight.map((right) => {
                  const isMatched = (exercise.pairs ?? []).some((p) => p.right === right && matchedPairs.includes(p.left));
                  return (
                    <button
                      key={right}
                      type="button"
                      disabled={isMatched}
                      onClick={() => pickMatchRight(right)}
                      className={`w-full rounded-lg border-2 px-3 py-2 text-left text-sm ${
                        isMatched
                          ? 'border-success-500 bg-success-50 opacity-60 dark:bg-success-900/30'
                          : 'border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {right}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {feedback === 'correct' && (
            <p className="mt-3 flex items-center gap-1 text-sm text-success-600">
              <CheckCircle size={14} /> Sahi jawab!
            </p>
          )}
          {feedback === 'wrong' && (
            <p className="mt-3 flex items-center gap-1 text-sm text-red-500">
              <XCircle size={14} /> Try again! Hint: {exercise.answer}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function normalizeEq(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
