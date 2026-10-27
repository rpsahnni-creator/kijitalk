import { LessonSeed, repeatEx, listenTypeEx, mcqEx, chunk } from './helpers';

interface PronFocus {
  key: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tip: string;
  words: string[];
  sentences: string[];
  mcq?: [string, string, string[]];
}

const FOCUS_AREAS: PronFocus[] = [
  {
    key: 'th-sound',
    title: 'TH Sound',
    level: 'beginner',
    tip: 'Put your tongue lightly between your teeth for "th" — think, three, the, this.',
    words: ['think', 'three', 'the', 'this', 'that', 'weather', 'breathe', 'through'],
    sentences: ['I think this is the third time.', 'Three trees are growing through the weather.', 'This and that are both demonstratives.'],
  },
  {
    key: 'v-w-sound',
    title: 'V vs W Sound',
    level: 'beginner',
    tip: '"V" bites your lower lip gently; "W" rounds your lips like blowing a candle. Very ≠ wery.',
    words: ['very', 'wine', 'vine', 'west', 'vest', 'wet', 'vet', 'window'],
    sentences: ['The vet wore a vest to the west.', 'Very few windows were open in winter.'],
    mcq: ['Which word has the "V" sound (not "W")?', 'very', ['wine', 'west', 'wet']],
  },
  {
    key: 'r-sound',
    title: 'R Sound',
    level: 'beginner',
    tip: 'Curl your tongue back slightly without touching the roof of your mouth — red, world, really.',
    words: ['red', 'world', 'really', 'right', 'around', 'tomorrow', 'library', 'February'],
    sentences: ['The red car drove around the world.', 'I will really go to the library tomorrow.'],
  },
  {
    key: 'silent-letters',
    title: 'Silent Letters',
    level: 'beginner',
    tip: 'Some letters are written but not spoken — know (silent K), honest (silent H), write (silent W).',
    words: ['know', 'honest', 'write', 'listen', 'island', 'half', 'climb', 'often'],
    sentences: ['I know he is an honest man.', 'Please write and listen carefully.', 'We often climb that small island hill.'],
    mcq: ['Which letter is silent in "know"?', 'K', ['N', 'O', 'W']],
  },
  {
    key: 'word-stress-noun-verb',
    title: 'Word Stress — Noun vs Verb',
    level: 'intermediate',
    tip: 'Many two-syllable words stress the first syllable as a noun, second as a verb — PREsent (gift) vs preSENT (to give).',
    words: ['present', 'record', 'object', 'import', 'increase', 'permit'],
    sentences: ['I got a nice PREsent.', 'Please preSENT your project tomorrow.', 'That is a good RECord.'],
  },
  {
    key: 's-sh-sound',
    title: 'S vs SH Sound',
    level: 'beginner',
    tip: '"S" is a thin hiss; "SH" is a softer, rounder hush sound — sip vs ship, sea vs she.',
    words: ['sip', 'ship', 'sea', 'she', 'sign', 'shine', 'seat', 'sheet'],
    sentences: ['She took a sip near the ship.', 'The sea shines near the sheet of sand.'],
    mcq: ['Which word has the "SH" sound?', 'ship', ['sip', 'sea', 'sign']],
  },
  {
    key: 'short-i-long-ee',
    title: 'Short I vs Long EE',
    level: 'beginner',
    tip: 'Short "i" is quick (bit, sit); long "ee" is stretched (beat, seat). Keep them clearly different.',
    words: ['bit', 'beat', 'sit', 'seat', 'ship', 'sheep', 'live', 'leave'],
    sentences: ['Please sit on this seat.', 'The ship carried many sheep.', 'I live here; please do not leave.'],
    mcq: ['Which word has the long "ee" sound?', 'sheep', ['ship', 'sit', 'bit']],
  },
  {
    key: 'p-f-sound',
    title: 'P vs F Sound',
    level: 'beginner',
    tip: '"P" is a short burst of air with closed lips; "F" is a steady stream with lip touching teeth — pan vs fan.',
    words: ['pan', 'fan', 'pin', 'fin', 'pull', 'full', 'past', 'fast'],
    sentences: ['Turn on the fan near the pan.', 'Pull the cup; it is full and fast.'],
  },
  {
    key: 'b-v-sound',
    title: 'B vs V Sound',
    level: 'beginner',
    tip: '"B" closes both lips completely; "V" only touches your top teeth to your bottom lip — berry vs very.',
    words: ['berry', 'very', 'best', 'vest', 'bowl', 'vowel', 'bent', 'vent'],
    sentences: ['This berry is very sweet.', 'Wear your best vest today.'],
  },
  {
    key: 'ending-ed',
    title: 'Ending Sound -ED',
    level: 'intermediate',
    tip: '"-ed" can sound like /t/ (worked), /d/ (played), or /id/ (wanted) depending on the last sound of the verb.',
    words: ['worked', 'played', 'wanted', 'watched', 'cleaned', 'needed', 'walked', 'opened'],
    sentences: ['She worked and played all day.', 'He wanted and needed more time.', 'We walked and cleaned the house.'],
  },
  {
    key: 'ending-s-es',
    title: 'Ending Sound -S/-ES',
    level: 'intermediate',
    tip: 'Plural/verb endings sound like /s/ (cats), /z/ (dogs), or /iz/ (watches) depending on the last sound.',
    words: ['cats', 'dogs', 'watches', 'books', 'boxes', 'cars', 'buses', 'plates'],
    sentences: ['The cats and dogs played together.', 'She watches the buses and cars pass by.'],
  },
  {
    key: 'linking-sounds',
    title: 'Linking Sounds in Speech',
    level: 'advanced',
    tip: 'Native speakers link words together — "turn it off" sounds like "tur-ni-toff". Practice saying phrases smoothly, not word by word.',
    words: ['turn it off', 'an apple', 'pick it up', 'not at all', 'come on in'],
    sentences: ['Please turn it off before you leave.', 'She picked up an apple.', 'Come on in, not at all a problem.'],
  },
  {
    key: 'question-intonation',
    title: 'Question Intonation',
    level: 'beginner',
    tip: 'Yes/No questions usually rise in pitch at the end; wh- questions usually fall. Practice the rise and fall.',
    words: ['Are you coming?', 'Is this yours?', 'What is your name?', 'Where do you live?'],
    sentences: ['Are you coming to the party?', 'What is your name?', 'Where do you live now?'],
  },
  {
    key: 'statement-intonation',
    title: 'Statement Intonation',
    level: 'beginner',
    tip: 'Statements usually fall in pitch at the end, showing you have finished your thought.',
    words: ['I am fine.', 'This is my book.', 'She lives in Delhi.'],
    sentences: ['I am fine, thank you.', 'This is my favourite book.', 'She lives in Delhi with her family.'],
  },
  {
    key: 'z-s-sound',
    title: 'Z vs S Sound',
    level: 'intermediate',
    tip: '"Z" buzzes in your throat (voiced); "S" is a quiet hiss (voiceless) — zoo vs sue, zip vs sip.',
    words: ['zoo', 'sue', 'zip', 'sip', 'zebra', 'seal', 'buzz', 'bus'],
    sentences: ['We saw a zebra at the zoo.', 'Please zip your bag before the bus leaves.'],
  },
  {
    key: 'ch-sh-sound',
    title: 'CH vs SH Sound',
    level: 'beginner',
    tip: '"CH" starts with a quick stop before the hiss (chip); "SH" is a smooth continuous hush (ship).',
    words: ['chip', 'ship', 'cheap', 'sheep', 'catch', 'cash', 'match', 'mash'],
    sentences: ['The ship carried cheap chips.', 'The sheep ran to catch the cash.'],
    mcq: ['Which word starts with the "CH" sound?', 'chip', ['ship', 'sheep', 'cash']],
  },
  {
    key: 'j-y-sound',
    title: 'J vs Y Sound',
    level: 'intermediate',
    tip: '"J" is a soft stop-and-buzz (jet); "Y" glides smoothly (yet). Jet ≠ yet.',
    words: ['jet', 'yet', 'jam', 'yam', 'joke', 'yolk', 'jam', 'young'],
    sentences: ['Have you finished the jet engine yet?', 'I like jam on toast, do you?'],
  },
  {
    key: 'l-n-sound',
    title: 'L vs N Sound',
    level: 'beginner',
    tip: 'For "L" your tongue touches just behind your top teeth; for "N" your tongue presses flatter and air goes through your nose.',
    words: ['light', 'night', 'low', 'no', 'lose', 'news', 'lake', 'name'],
    sentences: ['Turn off the light at night.', 'I will lose the news about the lake.'],
  },
  {
    key: 'vowel-a-sound',
    title: 'Vowel Sound A',
    level: 'beginner',
    tip: 'Short "a" as in cat, cap, man is open and flat — different from the "a" in father.',
    words: ['cat', 'cap', 'man', 'bag', 'hat', 'map', 'sad', 'fan'],
    sentences: ['The man wore a cap and a hat.', 'My cat sat on the bag near the fan.'],
  },
  {
    key: 'vowel-o-sound',
    title: 'Vowel Sound O',
    level: 'beginner',
    tip: 'Short "o" (hot, dog) is open and round; long "o" (boat, go) glides into a "w" sound at the end.',
    words: ['hot', 'dog', 'boat', 'go', 'coat', 'top', 'home', 'stop'],
    sentences: ['The dog is hot; let\'s go home.', 'Wear your coat on the boat.'],
  },
  {
    key: 'double-consonants',
    title: 'Double Consonants',
    level: 'intermediate',
    tip: 'Double consonants (letter, better, dinner) do not sound longer — they usually signal a short vowel before them.',
    words: ['letter', 'better', 'dinner', 'summer', 'happy', 'running', 'bigger', 'funny'],
    sentences: ['Dinner was better than last summer.', 'She is running and feeling happy.'],
  },
  {
    key: 'syllable-counting',
    title: 'Syllable Counting',
    level: 'beginner',
    tip: 'Clap for each syllable to find word rhythm — "com-pu-ter" has 3 claps, "cat" has 1.',
    words: ['cat', 'computer', 'banana', 'elephant', 'water', 'umbrella'],
    sentences: ['The computer is on the table.', 'An elephant drank water near the banana tree.'],
  },
  {
    key: 'weak-forms',
    title: 'Weak Forms in Fast Speech',
    level: 'advanced',
    tip: 'Small words like "to", "of", "and", "a" are said quickly and softly in fast speech — "cup of tea" sounds like "cuppa tea".',
    words: ['a cup of tea', 'going to', 'lots of', 'kind of', 'sort of'],
    sentences: ['I am going to have a cup of tea.', 'There are lots of people here today.'],
  },
  {
    key: 'tongue-twisters',
    title: 'Tongue Twisters',
    level: 'advanced',
    tip: 'Say these slowly first, then faster, to build mouth control and clarity.',
    words: ['She sells seashells', 'Red lorry, yellow lorry', 'Peter Piper picked a peck'],
    sentences: ['She sells seashells by the seashore.', 'Red lorry, yellow lorry, red lorry, yellow lorry.', 'Peter Piper picked a peck of pickled peppers.'],
  },
  {
    key: 'numbers-pronunciation',
    title: 'Numbers Pronunciation',
    level: 'beginner',
    tip: 'Stress the second syllable for "-teen" numbers (thirTEEN) and the first for "-ty" numbers (THIRty) so people do not confuse 13 and 30.',
    words: ['thirteen', 'thirty', 'fourteen', 'forty', 'fifteen', 'fifty'],
    sentences: ['I am thirTEEN years old, not THIRty.', 'There are FORty students, not fourTEEN.'],
    mcq: ['Which number is stressed on the SECOND syllable?', 'thirteen', ['thirty', 'forty', 'fifty']],
  },
  {
    key: 'days-months-pronunciation',
    title: 'Days & Months Pronunciation',
    level: 'beginner',
    tip: 'Watch tricky spellings: Wednesday (WENZ-day), Tuesday (TOOZ-day), February (FEB-roo-ary).',
    words: ['Wednesday', 'Tuesday', 'February', 'Thursday', 'Saturday'],
    sentences: ['We have a test on Wednesday.', 'My birthday is in February.'],
  },
  {
    key: 'confusing-word-pairs',
    title: 'Confusing Word Pairs',
    level: 'advanced',
    tip: 'Some words look similar but are pronounced and used differently — desert (DEZ-ert, dry land) vs dessert (di-ZERT, sweet food).',
    words: ['desert', 'dessert', 'live (verb)', 'live (adjective)', 'close (verb)', 'close (adjective)'],
    sentences: ['We crossed the desert and then ate dessert.', 'I live close to the live concert venue.'],
  },
  {
    key: 'greeting-intonation',
    title: 'Greeting Intonation',
    level: 'beginner',
    tip: 'Friendly greetings rise slightly and sound warm — "Hi, how are you?" should not sound flat or bored.',
    words: ['Hi, how are you?', 'Good morning!', 'Nice to see you!', 'How is it going?'],
    sentences: ['Hi, how are you doing today?', 'Good morning! Nice to see you!'],
  },
  {
    key: 'sentence-stress-emphasis',
    title: 'Emphasis in Sentences',
    level: 'advanced',
    tip: 'Stressing a different word changes the meaning — "I didn\'t say THAT" (someone else did) vs "I didn\'t SAY that" (I only thought it).',
    words: ['I didn\'t say that.', 'She is MY sister.', 'I want THIS one.'],
    sentences: ['I didn\'t say that; she did.', 'She is my sister, not my cousin.'],
  },
  {
    key: 'connected-speech',
    title: 'Connected Speech',
    level: 'advanced',
    tip: 'Casual spoken English often shortens words — going to → gonna, want to → wanna, got to → gotta.',
    words: ['gonna', 'wanna', 'gotta', 'kinda', 'lemme'],
    sentences: ['I\'m gonna call you later.', 'Do you wanna come with us?', 'I gotta go now.'],
  },
];

function buildPronLessons(p: PronFocus, baseOrder: number): LessonSeed[] {
  const wordChunks = chunk(p.words, 2);
  const sentChunks = chunk(p.sentences, 2);

  const tiers: Array<{ name: string; dur: number }> = [
    { name: 'Practice', dur: 8 },
    { name: 'Challenge', dur: 10 },
  ];

  return tiers.map((tier, i) => {
    const exercises = [
      ...wordChunks[i].map((w) => repeatEx(w)),
      ...sentChunks[i].map((s) => (i === 1 ? listenTypeEx(s) : repeatEx(s))),
    ];
    if (i === 0 && p.mcq) exercises.push(mcqEx(p.mcq[0], p.mcq[1], p.mcq[2]));
    if (exercises.length === 0) exercises.push(repeatEx(p.sentences[0] ?? p.words[0]));

    return {
      title: `${p.title} — ${tier.name}`,
      description: `${tier.name} pronunciation drills: ${p.tip}`,
      level: p.level,
      category: 'Pronunciation',
      durationMinutes: tier.dur,
      order: baseOrder + i,
      tags: ['pronunciation', p.key],
      content: { vocabulary: p.words, phrases: p.sentences, exercises },
    };
  });
}

export const PRONUNCIATION_LESSONS: LessonSeed[] = FOCUS_AREAS.flatMap((p, i) => buildPronLessons(p, 2000 + i * 2));
