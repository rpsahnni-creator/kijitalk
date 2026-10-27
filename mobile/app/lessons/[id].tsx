import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { api, Lesson } from '@/lib/api';
import { speechService } from '@/lib/speech';
import { scoreAnswer, shuffle } from '@/lib/exercise';

const MAX_HEARTS = 5;

function normalizeEq(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuthStore();
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
    if (isCorrect) setTimeout(() => advance(true), 500);
  };

  const checkMcq = (option: string) => {
    if (selectedOption || !exercise) return;
    setSelectedOption(option);
    const isCorrect = normalizeEq(option, exercise.answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => advance(isCorrect), 700);
  };

  const pickWord = (word: string) => setWordBankPicked((prev) => [...prev, word]);
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
      if (updated.length === exercise.pairs.length) setTimeout(() => advance(true), 400);
    } else {
      setMatchLeft(null);
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 500);
      const nextHearts = Math.max(0, hearts - 1);
      setHearts(nextHearts);
      if (nextHearts <= 0) setTimeout(() => setStatus('out-of-hearts'), 500);
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

  if (!lesson) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Text className="text-slate-500">Loading...</Text>
      </View>
    );
  }

  if (status === 'out-of-hearts') {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-900">
        <Ionicons name="heart-dislike" size={64} color="#ef4444" />
        <Text className="mb-2 mt-4 text-2xl font-bold text-slate-900 dark:text-white">Hearts khatam ho gaye!</Text>
        <Text className="mb-6 text-center text-slate-500">Koi baat nahi — dobara try karo!</Text>
        <TouchableOpacity onPress={retryLesson} className="mb-3 w-full rounded-2xl bg-brand-600 py-4">
          <Text className="text-center font-semibold text-white">Dobara try karo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="w-full rounded-2xl border border-slate-200 py-4 dark:border-slate-600">
          <Text className="text-center font-semibold text-slate-700 dark:text-slate-200">Baad mein karunga</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'completed') {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-900">
        <Ionicons name="checkmark-circle" size={64} color="#10b981" />
        <Text className="mb-2 mt-4 text-2xl font-bold text-slate-900 dark:text-white">Shabash! Lesson Complete 🎉</Text>
        <Text className="mb-6 text-center text-slate-500">&quot;{lesson.title}&quot; — achha kaam kiya!</Text>
        <TouchableOpacity onPress={() => router.back()} className="w-full rounded-2xl bg-brand-600 py-4">
          <Text className="text-center font-semibold text-white">Dashboard par jao</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'intro') {
    return (
      <ScrollView className="flex-1 bg-slate-50 px-6 pt-4 dark:bg-slate-900">
        <Text className="text-xs text-brand-600">{lesson.category} · {lesson.level}</Text>
        <Text className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">{lesson.title}</Text>
        <Text className="mb-6 text-slate-500">{lesson.description}</Text>

        <Text className="mb-2 font-semibold text-slate-900 dark:text-white">Shabd (Vocabulary)</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {lesson.vocabulary.map((w) => (
            <TouchableOpacity key={w} onPress={() => speechService.speak(w)} className="flex-row items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 dark:bg-brand-900/30">
              <Text className="text-sm text-brand-700 dark:text-brand-300">{w}</Text>
              <Ionicons name="volume-medium" size={12} color="#4338ca" />
            </TouchableOpacity>
          ))}
        </View>

        <Text className="mb-2 font-semibold text-slate-900 dark:text-white">Important Lines</Text>
        {lesson.phrases.map((p) => (
          <TouchableOpacity key={p} onPress={() => speechService.speak(p)} className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-4 dark:bg-slate-800">
            <Text className="flex-1 text-slate-900 dark:text-white">{p}</Text>
            <Ionicons name="volume-medium" size={16} color="#4f46e5" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={() => setStatus('running')} className="my-6 rounded-2xl bg-brand-600 py-4">
          <Text className="text-center font-semibold text-white">Start Practice ({totalExercises} exercises)</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (!exercise) return null;

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-4 dark:bg-slate-900">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <View className="h-full rounded-full bg-brand-500" style={{ width: `${((exerciseIndex + 1) / totalExercises) * 100}%` }} />
        </View>
        <View className="ml-4 flex-row gap-0.5">
          {Array.from({ length: MAX_HEARTS }).map((_, i) => (
            <Ionicons key={i} name={i < hearts ? 'heart' : 'heart-outline'} size={18} color="#ef4444" />
          ))}
        </View>
      </View>

      <View className="rounded-3xl bg-white p-5 dark:bg-slate-800">
        <Text className="mb-1 text-sm text-slate-500">
          Exercise {exerciseIndex + 1} of {totalExercises} · {exercise.type}
        </Text>
        <Text className="mb-1 text-lg font-medium text-slate-900 dark:text-white">{exercise.prompt}</Text>
        {exercise.promptHindi && <Text className="mb-4 text-sm text-slate-500">{exercise.promptHindi}</Text>}

        {(exercise.type === 'fill-blank' || exercise.type === 'translate') && (
          <>
            <TextInput
              value={answer}
              onChangeText={(t) => { setAnswer(t); setFeedback(null); }}
              placeholder={exercise.type === 'translate' ? 'English mein likho...' : 'Your answer...'}
              className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-600 dark:text-white"
            />
            <TouchableOpacity onPress={checkTextAnswer} className="mt-4 rounded-2xl bg-brand-600 py-4">
              <Text className="text-center font-semibold text-white">Check</Text>
            </TouchableOpacity>
          </>
        )}

        {exercise.type === 'repeat' && (
          <>
            <TouchableOpacity onPress={() => speechService.speak(exercise.answer)} className="flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 dark:border-slate-600">
              <Ionicons name="volume-medium" size={18} color="#4f46e5" />
              <Text className="font-medium text-slate-700 dark:text-slate-200">Suno aur repeat karo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => advance(true)} className="mt-4 rounded-2xl bg-brand-600 py-4">
              <Text className="text-center font-semibold text-white">{exerciseIndex < totalExercises - 1 ? 'Next' : 'Complete Lesson'}</Text>
            </TouchableOpacity>
          </>
        )}

        {exercise.type === 'listen-type' && (
          <>
            <TouchableOpacity onPress={() => speechService.speak(exercise.answer)} className="mb-3 flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 dark:border-slate-600">
              <Ionicons name="volume-medium" size={18} color="#4f46e5" />
              <Text className="font-medium text-slate-700 dark:text-slate-200">Play Audio</Text>
            </TouchableOpacity>
            <TextInput
              value={answer}
              onChangeText={(t) => { setAnswer(t); setFeedback(null); }}
              placeholder="Jo suna wo type karo..."
              className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-600 dark:text-white"
            />
            <TouchableOpacity onPress={checkTextAnswer} className="mt-4 rounded-2xl bg-brand-600 py-4">
              <Text className="text-center font-semibold text-white">Check</Text>
            </TouchableOpacity>
          </>
        )}

        {exercise.type === 'mcq' && (
          <View className="gap-2">
            {(exercise.options ?? []).map((option) => {
              const isSelected = selectedOption === option;
              const isAnswer = normalizeEq(option, exercise.answer);
              const showState = selectedOption !== null;
              const borderColor = showState && isSelected && isAnswer
                ? 'border-emerald-500 bg-emerald-50'
                : showState && isSelected && !isAnswer
                ? 'border-red-500 bg-red-50'
                : showState && isAnswer
                ? 'border-emerald-500'
                : 'border-slate-200 dark:border-slate-600';
              return (
                <TouchableOpacity
                  key={option}
                  disabled={selectedOption !== null}
                  onPress={() => checkMcq(option)}
                  className={`rounded-xl border-2 px-4 py-3 ${borderColor}`}
                >
                  <Text className="text-slate-900 dark:text-white">{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {exercise.type === 'word-bank' && (
          <>
            <View className="mb-4 min-h-[48px] flex-row flex-wrap gap-2 rounded-xl border-2 border-dashed border-slate-300 p-3 dark:border-slate-600">
              {wordBankPicked.map((w, i) => (
                <View key={i} className="rounded-lg bg-brand-100 px-3 py-1.5 dark:bg-brand-900/40">
                  <Text className="text-sm text-brand-800 dark:text-brand-200">{w}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {shuffledWords.map((w, i) => (
                <TouchableOpacity key={i} onPress={() => pickWord(w)} className="rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-700">
                  <Text className="text-sm text-slate-900 dark:text-white">{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="mt-4 flex-row gap-2">
              <TouchableOpacity onPress={undoWord} className="flex-1 rounded-2xl border border-slate-200 py-3 dark:border-slate-600">
                <Text className="text-center font-medium text-slate-700 dark:text-slate-200">Undo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={checkWordBank} className="flex-1 rounded-2xl bg-brand-600 py-3">
                <Text className="text-center font-semibold text-white">Check</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {exercise.type === 'match' && (
          <View className="flex-row gap-3">
            <View className="flex-1 gap-2">
              {(exercise.pairs ?? []).map((pair) => {
                const matched = matchedPairs.includes(pair.left);
                const active = matchLeft === pair.left;
                return (
                  <TouchableOpacity
                    key={pair.left}
                    disabled={matched}
                    onPress={() => setMatchLeft(pair.left)}
                    className={`rounded-lg border-2 px-3 py-2 ${matched ? 'border-emerald-500 bg-emerald-50 opacity-60' : active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 dark:border-slate-600'}`}
                  >
                    <Text className="text-sm text-slate-900 dark:text-white">{pair.left}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="flex-1 gap-2">
              {shuffledRight.map((right) => {
                const isMatched = (exercise.pairs ?? []).some((p) => p.right === right && matchedPairs.includes(p.left));
                return (
                  <TouchableOpacity
                    key={right}
                    disabled={isMatched}
                    onPress={() => pickMatchRight(right)}
                    className={`rounded-lg border-2 px-3 py-2 ${isMatched ? 'border-emerald-500 bg-emerald-50 opacity-60' : 'border-slate-200 dark:border-slate-600'}`}
                  >
                    <Text className="text-sm text-slate-900 dark:text-white">{right}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {feedback === 'correct' && <Text className="mt-3 text-sm text-emerald-600">✓ Sahi jawab!</Text>}
        {feedback === 'wrong' && <Text className="mt-3 text-sm text-red-500">✗ Try again! Hint: {exercise.answer}</Text>}
      </View>
    </ScrollView>
  );
}
