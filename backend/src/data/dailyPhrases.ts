export interface DailyPhrase {
  english: string;
  hindi: string;
  category: string;
  tip: string;
}

export const DAILY_PHRASES: DailyPhrase[] = [
  {
    english: 'May I come in, sir?',
    hindi: 'Sir, kya main andar aa sakta/sakti hoon?',
    category: 'School',
    tip: 'Class ke andar jaane se pehle yeh polite phrase use karo.',
  },
  {
    english: 'Could you please explain again?',
    hindi: 'Kya aap dobara samjha sakte hain?',
    category: 'School',
    tip: 'Teacher se doubt poochne ka sabse achha tareeka.',
  },
  {
    english: 'I am preparing for my board exams.',
    hindi: 'Main apni board exams ki taiyari kar raha/rahi hoon.',
    category: 'Exams',
    tip: 'Board exams ke baare mein baat karne ke liye useful.',
  },
  {
    english: 'How much does this cost?',
    hindi: 'Iska daam kitna hai?',
    category: 'Daily Life',
    tip: 'Market ya shop mein price poochne ke liye.',
  },
  {
    english: 'Which platform is the train on?',
    hindi: 'Train kis platform par hai?',
    category: 'Travel',
    tip: 'Railway station par bahut kaam aata hai.',
  },
  {
    english: 'I would like to introduce myself.',
    hindi: 'Main apna parichay dena chahta/chahti hoon.',
    category: 'Interview',
    tip: 'School interview ya competition ke liye perfect.',
  },
  {
    english: 'Can you speak a little slower, please?',
    hindi: 'Kya aap thoda dheere bol sakte hain?',
    category: 'Conversation',
    tip: 'Jab samajh na aaye tab confidently bolo.',
  },
  {
    english: 'I enjoy playing cricket with my friends.',
    hindi: 'Mujhe doston ke saath cricket khelna pasand hai.',
    category: 'Hobbies',
    tip: 'Apne baare mein baat karne ka natural tareeka.',
  },
  {
    english: 'Excuse me, is this seat available?',
    hindi: 'Maaf kijiye, kya yeh seat khali hai?',
    category: 'Travel',
    tip: 'Bus ya train mein seat poochne ke liye.',
  },
  {
    english: 'Thank you for your guidance.',
    hindi: 'Aapke margdarshan ke liye dhanyavaad.',
    category: 'School',
    tip: 'Teacher ya mentor ko thank you karne ka formal tareeka.',
  },
];

export function getDailyPhrase(dayOfYear?: number): DailyPhrase {
  const day =
    dayOfYear ??
    Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_PHRASES[day % DAILY_PHRASES.length];
}
