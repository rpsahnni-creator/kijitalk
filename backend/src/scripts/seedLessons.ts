import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { INDIA_LESSONS } from '../data/indiaLessons';
import { GRAMMAR_LESSONS } from '../data/curriculum/grammar';
import { VOCABULARY_LESSONS } from '../data/curriculum/vocabulary';
import { PRONUNCIATION_LESSONS } from '../data/curriculum/pronunciation';
import { CONVERSATION_LESSONS } from '../data/curriculum/conversation';
import { IDIOM_LESSONS } from '../data/curriculum/idioms';
import type { LessonContent } from '../types/exercise';

const SEED_LESSONS: Array<{
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  durationMinutes: number;
  order: number;
  tags: string[];
  content: LessonContent;
}> = [
  {
    title: 'Greetings & Introductions',
    description: 'Learn essential greetings and how to introduce yourself.',
    level: 'beginner',
    category: 'Basics',
    durationMinutes: 10,
    order: 1,
    tags: ['basics'],
    content: {
      vocabulary: ['hello', 'goodbye', 'nice to meet you', 'how are you'],
      phrases: ['Hi, my name is...', 'Nice to meet you!', 'How are you doing?'],
      exercises: [
        { type: 'repeat', prompt: 'Say: Hello, my name is Alex.', answer: 'Hello, my name is Alex.' },
        { type: 'fill-blank', prompt: 'Nice to ___ you.', answer: 'meet' },
        {
          type: 'mcq',
          prompt: 'Which greeting is used when you leave?',
          options: ['Hello', 'Goodbye', 'Nice to meet you', 'How are you'],
          answer: 'Goodbye',
        },
        {
          type: 'word-bank',
          prompt: 'Build the sentence:',
          words: ['How', 'are', 'you', 'doing'],
          answer: 'How are you doing',
        },
      ],
    },
  },
  {
    title: 'Ordering Food',
    description: 'Practice ordering at restaurants and cafes.',
    level: 'beginner',
    category: 'Daily Life',
    durationMinutes: 12,
    order: 2,
    tags: ['daily'],
    content: {
      vocabulary: ['menu', 'order', 'bill', 'delicious', 'appetizer'],
      phrases: ['I would like to order...', 'Can I have the check, please?'],
      exercises: [
        { type: 'repeat', prompt: 'I would like a coffee, please.', answer: 'I would like a coffee, please.' },
        {
          type: 'mcq',
          prompt: 'What do you ask for when you want to pay?',
          options: ['the menu', 'the bill', 'an appetizer', 'a discount'],
          answer: 'the bill',
        },
        {
          type: 'word-bank',
          prompt: 'Build the sentence:',
          words: ['Can', 'I', 'have', 'the', 'check', 'please'],
          answer: 'Can I have the check please',
        },
      ],
    },
  },
  {
    title: 'Past Tense Verbs',
    description: 'Master regular and irregular past tense verbs.',
    level: 'intermediate',
    category: 'Grammar',
    durationMinutes: 15,
    order: 3,
    tags: ['grammar'],
    content: {
      vocabulary: ['went', 'ate', 'drank', 'saw', 'bought'],
      phrases: ['I went to the store yesterday.', 'She ate lunch at noon.'],
      exercises: [
        { type: 'fill-blank', prompt: 'I ___ to the park yesterday. (go)', answer: 'went' },
        {
          type: 'match',
          prompt: 'Match the verb to its past tense:',
          pairs: [
            { left: 'go', right: 'went' },
            { left: 'eat', right: 'ate' },
            { left: 'see', right: 'saw' },
            { left: 'buy', right: 'bought' },
          ],
          answer: 'go-went,eat-ate,see-saw,buy-bought',
        },
        {
          type: 'mcq',
          prompt: 'Past tense of "drink"?',
          options: ['drinked', 'drank', 'drunk', 'drinks'],
          answer: 'drank',
        },
      ],
    },
  },
  {
    title: 'Job Interview Skills',
    description: 'Professional vocabulary for job interviews.',
    level: 'advanced',
    category: 'Professional',
    durationMinutes: 20,
    order: 4,
    tags: ['career'],
    content: {
      vocabulary: ['qualifications', 'experience', 'strengths', 'teamwork'],
      phrases: ['I have five years of experience in...', 'My greatest strength is...'],
      exercises: [
        { type: 'translate', prompt: 'Describe your work experience.', answer: 'I have worked as a developer for three years.' },
        {
          type: 'mcq',
          prompt: 'Which phrase best answers "Tell me about yourself" in an interview?',
          options: [
            'I like sleeping a lot.',
            'I have five years of experience in software development.',
            'I do not know.',
            'Why do you ask?',
          ],
          answer: 'I have five years of experience in software development.',
        },
      ],
    },
  },
  {
    title: 'Travel Essentials',
    description: 'Navigate airports, hotels, and transportation.',
    level: 'intermediate',
    category: 'Travel',
    durationMinutes: 15,
    order: 5,
    tags: ['travel'],
    content: {
      vocabulary: ['boarding pass', 'departure', 'luggage', 'reservation'],
      phrases: ['Where is gate 12?', 'I have a reservation under Smith.'],
      exercises: [
        { type: 'repeat', prompt: 'Could you tell me where the taxi stand is?', answer: 'Could you tell me where the taxi stand is?' },
        {
          type: 'word-bank',
          prompt: 'Build the sentence:',
          words: ['I', 'have', 'a', 'reservation', 'under', 'Smith'],
          answer: 'I have a reservation under Smith',
        },
      ],
    },
  },
  {
    title: 'Small Talk Mastery',
    description: 'Make casual conversation with confidence.',
    level: 'intermediate',
    category: 'Conversation',
    durationMinutes: 12,
    order: 6,
    tags: ['conversation'],
    content: {
      vocabulary: ['weather', 'weekend', 'hobby', 'recently'],
      phrases: ['How was your weekend?', 'What do you like to do in your free time?'],
      exercises: [
        { type: 'repeat', prompt: "The weather is beautiful today, isn't it?", answer: "The weather is beautiful today, isn't it?" },
        {
          type: 'mcq',
          prompt: 'Best way to start small talk with a stranger?',
          options: ['Give me your phone number.', 'How was your weekend?', 'Why are you here?', 'Nothing.'],
          answer: 'How was your weekend?',
        },
      ],
    },
  },
  {
    title: 'Pronunciation: TH Sounds',
    description: 'Practice the challenging TH sounds in English.',
    level: 'beginner',
    category: 'Pronunciation',
    durationMinutes: 10,
    order: 7,
    tags: ['pronunciation'],
    content: {
      vocabulary: ['think', 'three', 'through', 'weather', 'breathe'],
      phrases: ['I think therefore I am.', 'Three trees in the garden.'],
      exercises: [
        { type: 'repeat', prompt: 'Say: I think this is the third time.', answer: 'I think this is the third time.' },
        { type: 'listen-type', prompt: 'Listen and type: "Three trees in the garden."', answer: 'Three trees in the garden.' },
      ],
    },
  },
];

const ALL_LESSONS = [
  ...SEED_LESSONS,
  ...INDIA_LESSONS,
  ...GRAMMAR_LESSONS,
  ...VOCABULARY_LESSONS,
  ...PRONUNCIATION_LESSONS,
  ...CONVERSATION_LESSONS,
  ...IDIOM_LESSONS,
];

export async function seedLessons(): Promise<void> {
  try {
    let upserted = 0;
    const seen = new Set<string>();
    for (const lesson of ALL_LESSONS) {
      if (seen.has(lesson.title)) {
        logger.warn(`⚠️ Duplicate lesson title detected, skipping: "${lesson.title}"`);
        continue;
      }
      seen.add(lesson.title);
      const { content, ...rest } = lesson;
      const data = {
        ...rest,
        vocabulary: content.vocabulary,
        phrases: content.phrases,
        exercises: content.exercises as object[],
      };
      await prisma.lesson.upsert({
        where: { title: lesson.title },
        create: data,
        update: data,
      });
      upserted++;
    }
    logger.info(`✅ Upserted ${upserted} lessons (base + India-focused)`);
  } catch (error) {
    logger.warn('⚠️ Could not seed lessons (will retry next start)', error);
  }
}

if (require.main === module) {
  seedLessons()
    .then(() => prisma.$disconnect())
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}
