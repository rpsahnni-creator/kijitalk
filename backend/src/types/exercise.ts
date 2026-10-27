export type ExerciseType =
  | 'repeat'
  | 'fill-blank'
  | 'translate'
  | 'mcq'
  | 'match'
  | 'word-bank'
  | 'listen-type';

interface ExerciseBase {
  type: ExerciseType;
  prompt: string;
  promptHindi?: string;
  answer: string;
  explanation?: string;
}

export interface RepeatExercise extends ExerciseBase {
  type: 'repeat';
}

export interface FillBlankExercise extends ExerciseBase {
  type: 'fill-blank';
}

export interface TranslateExercise extends ExerciseBase {
  type: 'translate';
}

export interface McqExercise extends ExerciseBase {
  type: 'mcq';
  options: string[];
}

export interface MatchExercise extends ExerciseBase {
  type: 'match';
  pairs: Array<{ left: string; right: string }>;
}

export interface WordBankExercise extends ExerciseBase {
  type: 'word-bank';
  words: string[];
}

export interface ListenTypeExercise extends ExerciseBase {
  type: 'listen-type';
}

export type Exercise =
  | RepeatExercise
  | FillBlankExercise
  | TranslateExercise
  | McqExercise
  | MatchExercise
  | WordBankExercise
  | ListenTypeExercise;

export interface LessonContent {
  vocabulary: string[];
  phrases: string[];
  exercises: Exercise[];
}
