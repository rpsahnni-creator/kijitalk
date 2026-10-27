import type { LessonContent } from '../types/exercise';

export const INDIA_LESSONS: Array<{
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  durationMinutes: number;
  order: number;
  tags: string[];
  gradeBand: string;
  content: LessonContent;
}> = [
  {
    title: 'School Mein Introduction',
    description: 'Class mein apna parichay dena — naam, class, hobby.',
    level: 'beginner',
    category: 'School',
    durationMinutes: 10,
    order: 101,
    tags: ['india', 'school', 'class-6-8'],
    gradeBand: '6-8',
    content: {
      vocabulary: ['class', 'section', 'subject', 'hobby', 'favorite'],
      phrases: [
        'My name is Rahul and I am in Class 8.',
        'My favorite subject is Science.',
        'I like playing cricket in my free time.',
      ],
      exercises: [
        { type: 'repeat', prompt: 'Bolo: My name is ___ and I study in Class 8.', answer: 'My name is Rahul and I study in Class 8.' },
        { type: 'translate', prompt: 'Hindi: Mera naam Priya hai aur main Class 7 mein padhti hoon.', answer: 'My name is Priya and I study in Class 7.' },
        { type: 'fill-blank', prompt: 'My favorite ___ is Mathematics.', answer: 'subject' },
        {
          type: 'mcq',
          prompt: 'Which word means "vishay" (जैसे Science, Maths)?',
          options: ['hobby', 'subject', 'section', 'favorite'],
          answer: 'subject',
        },
        {
          type: 'word-bank',
          prompt: 'Sahi order mein sentence banao:',
          words: ['I', 'am', 'in', 'Class', '8'],
          answer: 'I am in Class 8',
        },
      ],
    },
  },
  {
    title: 'Teacher Se Doubt Poochna',
    description: 'Class mein politely sawal poochna aur samajhna.',
    level: 'beginner',
    category: 'School',
    durationMinutes: 12,
    order: 102,
    tags: ['india', 'school', 'class-6-10'],
    gradeBand: '6-10',
    content: {
      vocabulary: ['doubt', 'explain', 'understand', 'chapter', 'homework'],
      phrases: [
        'Excuse me, sir. May I ask a question?',
        'Could you please explain this again?',
        'I did not understand this part.',
      ],
      exercises: [
        { type: 'repeat', prompt: "Excuse me, ma'am. I have a doubt.", answer: "Excuse me, ma'am. I have a doubt." },
        { type: 'translate', prompt: 'Hindi: Kya aap yeh topic dobara samjha sakte hain?', answer: 'Could you please explain this topic again?' },
        {
          type: 'mcq',
          prompt: 'Polite tarike se sawal poochne ke liye sabse accha starter kya hai?',
          options: ['Hey you!', 'Excuse me, sir.', 'Listen now.', 'What?'],
          answer: 'Excuse me, sir.',
        },
        {
          type: 'match',
          prompt: 'Words ko unke meaning se match karo:',
          pairs: [
            { left: 'doubt', right: 'sandeh / confusion' },
            { left: 'chapter', right: 'adhyay' },
            { left: 'homework', right: 'ghar ka kaam' },
          ],
          answer: 'doubt-sandeh,chapter-adhyay,homework-ghar ka kaam',
        },
      ],
    },
  },
  {
    title: 'Tiffin & Lunch Ki Baat',
    description: 'Doston ke saath lunch time par English conversation.',
    level: 'beginner',
    category: 'Daily Life',
    durationMinutes: 10,
    order: 103,
    tags: ['india', 'daily', 'class-6-8'],
    gradeBand: '6-8',
    content: {
      vocabulary: ['tiffin', 'share', 'delicious', 'hungry', 'favorite food'],
      phrases: [
        'What did you bring for lunch today?',
        'This tastes really good!',
        'Would you like to share?',
      ],
      exercises: [
        { type: 'fill-blank', prompt: 'What did you ___ for lunch today?', answer: 'bring' },
        { type: 'repeat', prompt: 'Your tiffin smells delicious!', answer: 'Your tiffin smells delicious!' },
        {
          type: 'mcq',
          prompt: '"Bahut swadisht" ke liye English word?',
          options: ['hungry', 'delicious', 'share', 'tiffin'],
          answer: 'delicious',
        },
        {
          type: 'word-bank',
          prompt: 'Sentence banao:',
          words: ['Would', 'you', 'like', 'to', 'share'],
          answer: 'Would you like to share',
        },
      ],
    },
  },
  {
    title: 'Railway Station & Travel',
    description: 'Train, platform, ticket — safar ke liye zaroori English.',
    level: 'intermediate',
    category: 'Travel',
    durationMinutes: 15,
    order: 104,
    tags: ['india', 'travel'],
    gradeBand: '9-12',
    content: {
      vocabulary: ['platform', 'reservation', 'compartment', 'delay', 'ticket counter'],
      phrases: [
        'Which platform is the train on?',
        'Is this seat reserved?',
        'The train is running late by 30 minutes.',
      ],
      exercises: [
        { type: 'translate', prompt: 'Hindi: Train kis platform par aayegi?', answer: 'Which platform will the train arrive on?' },
        { type: 'fill-blank', prompt: 'I need to check my ___ status.', answer: 'reservation' },
        {
          type: 'mcq',
          prompt: 'Agar train late hai, toh hum kehte hain the train is...',
          options: ['delayed', 'cancelled', 'reserved', 'crowded'],
          answer: 'delayed',
        },
        {
          type: 'listen-type',
          prompt: 'Suno aur type karo: "Excuse me, which platform is the train on?"',
          answer: 'Excuse me, which platform is the train on?',
        },
      ],
    },
  },
  {
    title: 'Bazaar Mein Shopping',
    description: 'Market mein daam poochna, bargaining aur payment.',
    level: 'beginner',
    category: 'Daily Life',
    durationMinutes: 12,
    order: 105,
    tags: ['india', 'daily'],
    gradeBand: '6-12',
    content: {
      vocabulary: ['price', 'discount', 'cheap', 'expensive', 'change'],
      phrases: [
        'How much does this cost?',
        'Can you give a better price?',
        'Do you accept UPI payment?',
      ],
      exercises: [
        { type: 'repeat', prompt: 'How much for these two items?', answer: 'How much for these two items?' },
        { type: 'translate', prompt: 'Hindi: Kya aap thoda kam kar denge?', answer: 'Can you reduce the price a little?' },
        {
          type: 'mcq',
          prompt: '"Mehenga" ke liye sahi word?',
          options: ['cheap', 'expensive', 'discount', 'change'],
          answer: 'expensive',
        },
        {
          type: 'word-bank',
          prompt: 'Sentence banao:',
          words: ['Can', 'you', 'give', 'a', 'better', 'price'],
          answer: 'Can you give a better price',
        },
      ],
    },
  },
  {
    title: 'School Assembly Speech',
    description: 'Stage par bolne ke liye simple English lines.',
    level: 'intermediate',
    category: 'School',
    durationMinutes: 15,
    order: 106,
    tags: ['india', 'school', 'class-9-12'],
    gradeBand: '9-12',
    content: {
      vocabulary: ['respect', 'principal', 'announcement', 'proud', 'opportunity'],
      phrases: [
        'Good morning, respected principal, teachers, and friends.',
        'Today I would like to talk about...',
        'Thank you for giving me this opportunity.',
      ],
      exercises: [
        { type: 'repeat', prompt: 'Good morning everyone. Today I am going to speak about discipline.', answer: 'Good morning everyone. Today I am going to speak about discipline.' },
        { type: 'fill-blank', prompt: 'Thank you for giving me this ___.', answer: 'opportunity' },
        {
          type: 'mcq',
          prompt: 'Speech shuru karne ke liye sabse formal greeting?',
          options: ['Hey guys!', 'Good morning, respected principal, teachers, and friends.', "What's up?", 'Listen up!'],
          answer: 'Good morning, respected principal, teachers, and friends.',
        },
      ],
    },
  },
  {
    title: 'Exam Instructions Samajhna',
    description: 'Question paper aur exam hall ke instructions padhna.',
    level: 'intermediate',
    category: 'Exams',
    durationMinutes: 12,
    order: 107,
    tags: ['india', 'exams', 'class-10-12'],
    gradeBand: '10-12',
    content: {
      vocabulary: ['attempt', 'compulsory', 'optional', 'time limit', 'rough work'],
      phrases: [
        'Read all questions carefully before answering.',
        'Attempt all compulsory questions.',
        'You have three hours to complete the paper.',
      ],
      exercises: [
        { type: 'translate', prompt: 'Hindi: Pehle saare sawal dhyan se padho.', answer: 'First, read all questions carefully.' },
        { type: 'fill-blank', prompt: 'You have ___ hours to complete the exam.', answer: 'three' },
        {
          type: 'mcq',
          prompt: '"Zaroori / jo karna hi hai" ke liye word?',
          options: ['optional', 'compulsory', 'rough', 'limit'],
          answer: 'compulsory',
        },
      ],
    },
  },
  {
    title: 'Cricket & Sports Talk',
    description: 'Doston ke saath sports par baat karna.',
    level: 'beginner',
    category: 'Conversation',
    durationMinutes: 10,
    order: 108,
    tags: ['india', 'hobbies'],
    gradeBand: '6-12',
    content: {
      vocabulary: ['match', 'team', 'score', 'captain', 'practice'],
      phrases: [
        'Did you watch the match yesterday?',
        'India played really well!',
        'Let us play cricket after school.',
      ],
      exercises: [
        { type: 'repeat', prompt: 'Who is your favorite cricket player?', answer: 'Who is your favorite cricket player?' },
        { type: 'fill-blank', prompt: 'Let us ___ football in the evening.', answer: 'play' },
        {
          type: 'word-bank',
          prompt: 'Sentence banao:',
          words: ['Did', 'you', 'watch', 'the', 'match', 'yesterday'],
          answer: 'Did you watch the match yesterday',
        },
      ],
    },
  },
  {
    title: 'Student Interview Basics',
    description: 'School admission ya scholarship interview ke liye.',
    level: 'intermediate',
    category: 'Career',
    durationMinutes: 18,
    order: 109,
    tags: ['india', 'interview', 'class-10-12'],
    gradeBand: '10-12',
    content: {
      vocabulary: ['achieve', 'goal', 'strength', 'weakness', 'motivation'],
      phrases: [
        'My goal is to become an engineer.',
        'I am hardworking and curious to learn.',
        'I want to study at this school because...',
      ],
      exercises: [
        { type: 'translate', prompt: 'Hindi: Mera lakshya doctor banna hai.', answer: 'My goal is to become a doctor.' },
        { type: 'repeat', prompt: 'I am passionate about learning new things.', answer: 'I am passionate about learning new things.' },
        {
          type: 'mcq',
          prompt: '"Kamzori" ke liye sahi word?',
          options: ['strength', 'weakness', 'motivation', 'goal'],
          answer: 'weakness',
        },
      ],
    },
  },
  {
    title: 'Neighbors & Community',
    description: 'Padosiyon aur society mein milna-julna.',
    level: 'beginner',
    category: 'Daily Life',
    durationMinutes: 10,
    order: 110,
    tags: ['india', 'daily'],
    gradeBand: '6-12',
    content: {
      vocabulary: ['neighbor', 'festival', 'help', 'community', 'invite'],
      phrases: [
        'Happy Diwali! How is your family?',
        'Can I help you with anything?',
        'We are organizing a function in our society.',
      ],
      exercises: [
        { type: 'repeat', prompt: 'It is nice to meet you. Welcome to our neighborhood!', answer: 'It is nice to meet you. Welcome to our neighborhood!' },
        { type: 'translate', prompt: 'Hindi: Aap festival par ghar aaiye.', answer: 'Please visit our home during the festival.' },
        {
          type: 'mcq',
          prompt: '"Padosi" ke liye English word?',
          options: ['community', 'neighbor', 'festival', 'invite'],
          answer: 'neighbor',
        },
      ],
    },
  },
];
