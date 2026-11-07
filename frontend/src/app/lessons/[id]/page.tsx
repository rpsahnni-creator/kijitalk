'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Heart,
  HeartCrack,
  Trophy,
  Undo2,
  Volume2,
  X,
  XCircle,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorState } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, Lesson } from '@/lib/api';
import { speechService } from '@/lib/speech';
import { EXERCISE_LABELS, normalize, scoreAnswer, shuffle } from '@/lib/exercise';

const MAX_HEARTS = 5;

type Status = 'intro' | 'running' | 'out-of-hearts' | 'saving' | 'completed';

export default function LessonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [status, setStatus] = useState<Status>('intro');
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [pickedIdx, setPickedIdx] = useState<number[]>([]);
  const [matchLeft, setMatchLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeOnCurrent, setMistakeOnCurrent] = useState(false);
  const [locked, setLocked] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  const loadLesson = useCallback(() => {
    if (!id) return;
    setLoadError(false);
    api
      .get<{ lesson: Lesson }>(`/api/lessons/${id}`)
      .then((d) => setLesson(d.lesson))
      .catch(() => setLoadError(true));
  }, [id]);

  useEffect(loadLesson, [loadLesson]);

  useEffect(() => () => speechService.stopSpeaking(), []);

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
    setPickedIdx([]);
    setMatchLeft(null);
    setMatchedPairs([]);
    setFeedback(null);
    setMistakeOnCurrent(false);
    setLocked(false);
  };

  const completeLesson = async (score: number, finalHearts: number, finalCorrect: number) => {
    setFinalScore(score);
    setStatus('saving');
    setSaveFailed(false);
    try {
      if (token && id) {
        await api.post(
          `/api/lessons/${id}/complete`,
          {
            score,
            minutesSpent: lesson?.durationMinutes ?? 10,
            heartsRemaining: finalHearts,
            correctCount: finalCorrect,
            totalExercises,
          },
          token
        );
      }
    } catch {
      setSaveFailed(true);
    }
    setStatus('completed');
  };

  /** Costs one heart for the first mistake on an exercise. Returns false when hearts run out. */
  const registerMistake = (): boolean => {
    setFeedback('wrong');
    if (mistakeOnCurrent) return true;
    setMistakeOnCurrent(true);
    const next = hearts - 1;
    setHearts(next);
    if (next <= 0) {
      setLocked(true);
      setTimeout(() => setStatus('out-of-hearts'), 700);
      return false;
    }
    return true;
  };

  /** Moves on once the current exercise is solved. First-try answers count towards the score. */
  const advance = (firstTry: boolean, heartsNow = hearts) => {
    const nextCorrect = firstTry ? correctCount + 1 : correctCount;
    setCorrectCount(nextCorrect);

    if (exerciseIndex < totalExercises - 1) {
      setExerciseIndex((i) => i + 1);
      resetExerciseState();
    } else {
      const score = totalExercises ? Math.round((nextCorrect / totalExercises) * 100) : 100;
      void completeLesson(score, heartsNow, nextCorrect);
    }
  };

  const solved = (delay = 600) => {
    setFeedback('correct');
    setLocked(true);
    const firstTry = !mistakeOnCurrent;
    const heartsNow = hearts;
    setTimeout(() => advance(firstTry, heartsNow), delay);
  };

  const checkTextAnswer = () => {
    if (!exercise || locked || !answer.trim()) return;
    if (scoreAnswer(answer, exercise.answer)) solved();
    else registerMistake();
  };

  const checkMcq = (option: string) => {
    if (!exercise || selectedOption || locked) return;
    setSelectedOption(option);
    setLocked(true);
    if (normalize(option) === normalize(exercise.answer)) {
      setFeedback('correct');
      setTimeout(() => advance(true), 800);
    } else {
      const alive = registerMistake();
      if (alive) {
        const heartsNow = hearts - 1;
        setTimeout(() => advance(false, heartsNow), 1400);
      }
    }
  };

  const pickWord = (idx: number) => {
    if (locked || pickedIdx.includes(idx)) return;
    setPickedIdx((prev) => [...prev, idx]);
    setFeedback(null);
  };

  const unpickAt = (position: number) => {
    if (locked) return;
    setPickedIdx((prev) => prev.filter((_, i) => i !== position));
    setFeedback(null);
  };

  const checkWordBank = () => {
    if (!exercise || locked || pickedIdx.length === 0) return;
    const built = pickedIdx.map((i) => shuffledWords[i]).join(' ');
    if (normalize(built) === normalize(exercise.answer)) solved();
    else registerMistake();
  };

  const pickMatchRight = (right: string) => {
    if (!exercise?.pairs || matchLeft === null || locked) return;
    const pair = exercise.pairs.find((p) => p.left === matchLeft);
    if (pair?.right === right) {
      const updated = [...matchedPairs, matchLeft];
      setMatchedPairs(updated);
      setMatchLeft(null);
      setFeedback(null);
      if (updated.length === exercise.pairs.length) solved(500);
    } else {
      setMatchLeft(null);
      registerMistake();
    }
  };

  const retryLesson = () => {
    setExerciseIndex(0);
    setHearts(MAX_HEARTS);
    setCorrectCount(0);
    resetExerciseState();
    setStatus('running');
  };

  if (loadError) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <ErrorState message="Yeh lesson load nahi ho paya." onRetry={loadLesson} />
        </div>
      </AppShell>
    );
  }

  if (!initialized || !user || !lesson) return <LoadingScreen label="Lesson aa raha hai..." />;

  if (status === 'out-of-hearts') {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
            <HeartCrack className="text-red-500" size={40} />
          </div>
          <h1 className="mb-2 font-display text-2xl font-bold">Hearts khatam ho gaye!</h1>
          <p className="mb-8 text-slate-500">Koi baat nahi — practice se hi perfect hoga. Dobara try karo!</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button type="button" onClick={retryLesson} className="btn-primary">Dobara try karo</button>
            <button type="button" onClick={() => router.push('/lessons')} className="btn-secondary">Baad mein karunga</button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (status === 'saving' || status === 'completed') {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/30">
            <Trophy className="text-accent-600" size={40} />
          </div>
          <h1 className="mb-2 font-display text-2xl font-bold">Shabash! Lesson complete 🎉</h1>
          <p className="mb-6 text-slate-500">&quot;{lesson.title}&quot; — achha kaam kiya!</p>
          <div className="mb-8 grid w-full grid-cols-3 gap-3">
            <div className="card p-4">
              <p className="text-2xl font-bold text-brand-600 dark:text-brand-300">{finalScore}%</p>
              <p className="text-xs text-slate-500">Score</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold">{correctCount}/{totalExercises}</p>
              <p className="text-xs text-slate-500">First try</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold text-red-500">{hearts}</p>
              <p className="text-xs text-slate-500">Hearts left</p>
            </div>
          </div>
          {status === 'saving' && <p className="mb-4 text-sm text-slate-400">Progress save ho raha hai…</p>}
          {saveFailed && (
            <p className="mb-4 rounded-xl bg-accent-50 px-4 py-2 text-sm text-accent-800 dark:bg-accent-900/20 dark:text-accent-200">
              Progress save nahi ho paya — internet check karo.{' '}
              <button type="button" className="font-semibold underline" onClick={() => void completeLesson(finalScore, hearts, correctCount)}>
                Retry
              </button>
            </p>
          )}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button type="button" disabled={status === 'saving'} onClick={() => router.push('/dashboard')} className="btn-primary">
              Dashboard par jao
            </button>
            <button type="button" onClick={() => router.push('/lessons')} className="btn-secondary">
              Agla lesson
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (status === 'intro') {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-10">
          <Link href="/lessons" className="btn-ghost -ml-3 mb-4">
            <ArrowLeft size={16} /> Lessons
          </Link>
          <div className="card mb-6 overflow-hidden p-0">
            <div className="gradient-hero px-6 py-7 text-white">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="chip bg-white/15 text-white">{lesson.category}</span>
                <span className="chip bg-white/15 capitalize text-white">{lesson.level}</span>
                <span className="chip bg-white/15 text-white">
                  <Clock size={12} /> {lesson.durationMinutes} min
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
              <p className="mt-2 text-brand-100">{lesson.description}</p>
            </div>
          </div>

          {lesson.vocabulary.length > 0 && (
            <div className="card mb-6">
              <h2 className="section-title">Shabd · Vocabulary</h2>
              <div className="flex flex-wrap gap-2">
                {lesson.vocabulary.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => speechService.speak(word)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:border-brand-300 dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-200"
                  >
                    {word} <Volume2 size={13} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {lesson.phrases.length > 0 && (
            <div className="card mb-6">
              <h2 className="section-title">Important lines</h2>
              <ul className="space-y-2">
                {lesson.phrases.map((phrase) => (
                  <li key={phrase} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                    <span className="text-sm">{phrase}</span>
                    <button
                      type="button"
                      onClick={() => speechService.speak(phrase)}
                      className="btn-ghost h-8 w-8 shrink-0 p-0 text-brand-600"
                      aria-label={`Listen: ${phrase}`}
                    >
                      <Volume2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button type="button" onClick={() => setStatus('running')} className="btn-primary w-full py-3.5 text-base">
            Start practice · {totalExercises} exercises
          </button>
        </div>
      </AppShell>
    );
  }

  if (!exercise) return null;

  const progress = (exerciseIndex / totalExercises) * 100;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/lessons" className="btn-ghost h-9 w-9 shrink-0 p-0" aria-label="Exit lesson">
            <X size={20} />
          </Link>
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
            role="progressbar"
            aria-valuenow={exerciseIndex}
            aria-valuemax={totalExercises}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-1 text-red-500" aria-label={`${hearts} hearts left`}>
            <Heart size={20} fill="currentColor" />
            <span className="text-sm font-bold">{hearts}</span>
          </div>
        </div>

        <div key={exerciseIndex} className="card mb-6 animate-fade-up">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {EXERCISE_LABELS[exercise.type] ?? exercise.type} · {exerciseIndex + 1}/{totalExercises}
          </p>
          <p className="mb-1 text-lg font-semibold">{exercise.prompt}</p>
          {exercise.promptHindi && <p className="mb-5 text-sm text-slate-500">{exercise.promptHindi}</p>}
          {!exercise.promptHindi && <div className="mb-4" />}

          {(exercise.type === 'fill-blank' || exercise.type === 'translate' || exercise.type === 'listen-type') && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                checkTextAnswer();
              }}
            >
              {exercise.type === 'listen-type' && (
                <button type="button" onClick={() => speechService.speak(exercise.answer)} className="btn-secondary mb-3">
                  <Volume2 size={16} /> Play audio
                </button>
              )}
              <input
                value={answer}
                autoFocus
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (feedback === 'wrong') setFeedback(null);
                }}
                disabled={locked}
                className={`input-field ${feedback === 'wrong' ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : ''} ${feedback === 'correct' ? 'border-success-500' : ''}`}
                placeholder={
                  exercise.type === 'translate'
                    ? 'English mein likho...'
                    : exercise.type === 'listen-type'
                    ? 'Jo suna wo type karo...'
                    : 'Your answer...'
                }
              />
              <button type="submit" disabled={locked || !answer.trim()} className="btn-primary mt-4 w-full">
                Check
              </button>
            </form>
          )}

          {exercise.type === 'repeat' && (
            <>
              <div className="mb-4 rounded-xl bg-slate-50 px-4 py-4 text-center text-lg font-medium dark:bg-slate-800/60">
                {exercise.answer}
              </div>
              <button type="button" onClick={() => speechService.speak(exercise.answer)} className="btn-secondary w-full">
                <Volume2 size={16} /> Suno aur repeat karo
              </button>
              <button type="button" disabled={locked} onClick={() => solved(0)} className="btn-primary mt-3 w-full">
                {exerciseIndex < totalExercises - 1 ? 'Maine bol diya · Next' : 'Complete lesson'}
              </button>
            </>
          )}

          {exercise.type === 'mcq' && (
            <div className="grid gap-2">
              {(exercise.options ?? []).map((option) => {
                const isSelected = selectedOption === option;
                const isAnswer = normalize(option) === normalize(exercise.answer);
                const showState = selectedOption !== null;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={showState}
                    onClick={() => checkMcq(option)}
                    className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                      showState && isAnswer
                        ? 'border-success-500 bg-success-50 text-success-800 dark:bg-success-900/30 dark:text-success-200'
                        : showState && isSelected
                        ? 'border-red-400 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                        : 'border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:bg-brand-950/30'
                    }`}
                  >
                    {option}
                    {showState && isAnswer && <CheckCircle2 size={18} className="text-success-600" />}
                    {showState && isSelected && !isAnswer && <XCircle size={18} className="text-red-500" />}
                  </button>
                );
              })}
            </div>
          )}

          {exercise.type === 'word-bank' && (
            <>
              <div
                className={`mb-4 flex min-h-[56px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-3 transition ${
                  feedback === 'wrong'
                    ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                    : feedback === 'correct'
                    ? 'border-success-400 bg-success-50/50 dark:bg-success-950/20'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                {pickedIdx.length === 0 && <span className="text-sm text-slate-400">Neeche se words chuno…</span>}
                {pickedIdx.map((wordIdx, pos) => (
                  <button
                    key={`${wordIdx}-${pos}`}
                    type="button"
                    onClick={() => unpickAt(pos)}
                    className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800 shadow-sm dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-200"
                  >
                    {shuffledWords[wordIdx]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {shuffledWords.map((w, i) => {
                  const used = pickedIdx.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={used || locked}
                      onClick={() => pickWord(i)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition ${
                        used
                          ? 'border-transparent bg-slate-100 text-transparent shadow-none dark:bg-slate-800'
                          : 'border-slate-200 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => unpickAt(pickedIdx.length - 1)}
                  disabled={pickedIdx.length === 0 || locked}
                  className="btn-secondary flex-1"
                >
                  <Undo2 size={16} /> Undo
                </button>
                <button type="button" onClick={checkWordBank} disabled={pickedIdx.length === 0 || locked} className="btn-primary flex-1">
                  Check
                </button>
              </div>
            </>
          )}

          {exercise.type === 'match' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                {(exercise.pairs ?? []).map((pair) => {
                  const done = matchedPairs.includes(pair.left);
                  return (
                    <button
                      key={pair.left}
                      type="button"
                      disabled={done || locked}
                      onClick={() => setMatchLeft(pair.left)}
                      className={`w-full rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition ${
                        done
                          ? 'border-success-400 bg-success-50 text-success-800 opacity-60 dark:bg-success-900/30 dark:text-success-200'
                          : matchLeft === pair.left
                          ? 'border-brand-500 bg-brand-50 shadow-glow dark:bg-brand-950/50'
                          : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'
                      }`}
                    >
                      {pair.left}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                {shuffledRight.map((right) => {
                  const isMatched = (exercise.pairs ?? []).some((p) => p.right === right && matchedPairs.includes(p.left));
                  return (
                    <button
                      key={right}
                      type="button"
                      disabled={isMatched || locked}
                      onClick={() => pickMatchRight(right)}
                      className={`w-full rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition ${
                        isMatched
                          ? 'border-success-400 bg-success-50 text-success-800 opacity-60 dark:bg-success-900/30 dark:text-success-200'
                          : matchLeft
                          ? 'border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {right}
                    </button>
                  );
                })}
              </div>
              {matchLeft === null && matchedPairs.length === 0 && (
                <p className="col-span-2 text-xs text-slate-400">Pehle left side se ek chuno, phir uska jodi right side se.</p>
              )}
            </div>
          )}

          <div aria-live="polite">
            {feedback === 'correct' && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-700 dark:bg-success-900/30 dark:text-success-200">
                <CheckCircle2 size={16} /> Sahi jawab! Shabash 👏
              </p>
            )}
            {feedback === 'wrong' && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                <span>
                  Galat hai — dobara try karo.
                  {exercise.type !== 'match' && (
                    <>
                      {' '}Sahi jawab: <strong className="font-semibold">{exercise.answer}</strong>
                    </>
                  )}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
