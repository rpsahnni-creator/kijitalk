import {
  LessonSeed,
  chunk,
  fillBlankEx,
  mcqEx,
  translateEx,
  repeatEx,
  wordBankEx,
  matchEx,
} from './helpers';

type FB = [string, string, string?]; // sentence, answer word, hindi hint
type MCQT = [string, string, string[], string?]; // prompt, answer, distractors, hindi hint
type TR = [string, string]; // hindi, english

interface GrammarPattern {
  key: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  vocabulary: string[];
  phrases: string[];
  fillBlanks: FB[];
  mcqs: MCQT[];
  translates: TR[];
  repeats: string[];
  matchPairs?: Array<{ left: string; right: string }>;
  gradeBand?: string;
}

const PATTERNS: GrammarPattern[] = [
  {
    key: 'present-simple',
    title: 'Present Simple',
    level: 'beginner',
    vocabulary: ['every day', 'always', 'usually', 'never', 'habit'],
    phrases: ['I go to school every day.', 'She works in Delhi.', 'They play cricket on Sundays.'],
    fillBlanks: [
      ['She ___ to school every morning. (go)', 'goes'],
      ['He ___ English very well. (speak)', 'speaks'],
      ['We ___ rice every day. (eat)', 'eat'],
      ['My father ___ in a bank. (work)', 'works'],
      ['The sun ___ in the east. (rise)', 'rises'],
    ],
    mcqs: [
      ['She ___ TV every evening.', 'watches', ['watch', 'watching', 'watched']],
      ['I ___ coffee every morning.', 'drink', ['drinks', 'drank', 'drinking']],
      ['My brother ___ cricket on Sundays.', 'plays', ['play', 'playing', 'played']],
    ],
    translates: [
      ['Main roz school jaata hoon.', 'I go to school every day.'],
      ['Woh Hindi bolti hai.', 'She speaks Hindi.'],
    ],
    repeats: ['I always wake up at six o\'clock.', 'She usually finishes her homework before dinner.'],
  },
  {
    key: 'present-continuous',
    title: 'Present Continuous',
    level: 'beginner',
    vocabulary: ['right now', 'at the moment', 'currently', 'still'],
    phrases: ['I am studying right now.', 'She is cooking dinner.', 'They are watching a movie.'],
    fillBlanks: [
      ['I ___ my homework right now. (do)', 'am doing'],
      ['She ___ a letter at the moment. (write)', 'is writing'],
      ['They ___ football in the park. (play)', 'are playing'],
      ['He ___ for the bus. (wait)', 'is waiting'],
    ],
    mcqs: [
      ['Look! It ___ outside.', 'is raining', ['rains', 'rained', 'rain']],
      ['She ___ dinner right now.', 'is cooking', ['cooks', 'cooked', 'cook']],
    ],
    translates: [
      ['Main abhi padh raha hoon.', 'I am studying right now.'],
      ['Woh abhi khana bana rahi hai.', 'She is cooking right now.'],
    ],
    repeats: ["We are learning English together.", "He is talking on the phone."],
  },
  {
    key: 'past-simple-regular',
    title: 'Past Simple — Regular Verbs',
    level: 'beginner',
    vocabulary: ['yesterday', 'last week', 'ago', 'finished'],
    phrases: ['I walked to school yesterday.', 'She cleaned her room.', 'We watched a movie last night.'],
    fillBlanks: [
      ['I ___ my homework last night. (finish)', 'finished'],
      ['She ___ the dishes after dinner. (wash)', 'washed'],
      ['We ___ football yesterday. (play)', 'played'],
      ['He ___ his friend at the station. (meet)', 'meeted'],
    ],
    mcqs: [
      ['She ___ her room yesterday.', 'cleaned', ['cleans', 'cleaning', 'clean']],
      ['They ___ a new restaurant last week.', 'tried', ['try', 'tries', 'trying']],
    ],
    translates: [
      ['Maine kal apna homework khatam kiya.', 'I finished my homework yesterday.'],
    ],
    repeats: ['I walked to school yesterday.', 'We watched a movie last night.'],
  },
  {
    key: 'past-simple-irregular',
    title: 'Past Simple — Irregular Verbs',
    level: 'beginner',
    vocabulary: ['went', 'ate', 'saw', 'bought', 'came', 'took'],
    phrases: ['I went to the market.', 'She ate lunch at noon.', 'We saw a movie together.'],
    fillBlanks: [
      ['I ___ to the park yesterday. (go)', 'went'],
      ['She ___ lunch at noon. (eat)', 'ate'],
      ['We ___ a good movie last night. (see)', 'saw'],
      ['He ___ a new phone yesterday. (buy)', 'bought'],
    ],
    mcqs: [
      ['Past tense of "drink"?', 'drank', ['drinked', 'drunk', 'drinks']],
      ['Past tense of "come"?', 'came', ['comed', 'come', 'coming']],
      ['Past tense of "take"?', 'took', ['taked', 'taken', 'take']],
    ],
    translates: [
      ['Mai bazaar gaya tha.', 'I went to the market.'],
    ],
    repeats: ['She ate lunch at noon.', 'We saw a movie together.'],
    matchPairs: [
      { left: 'go', right: 'went' },
      { left: 'eat', right: 'ate' },
      { left: 'see', right: 'saw' },
      { left: 'buy', right: 'bought' },
      { left: 'come', right: 'came' },
    ],
  },
  {
    key: 'past-continuous',
    title: 'Past Continuous',
    level: 'intermediate',
    vocabulary: ['while', 'when', 'at that time', 'interrupted'],
    phrases: ['I was sleeping when you called.', 'She was studying all evening.'],
    fillBlanks: [
      ['I ___ when the phone rang. (sleep)', 'was sleeping'],
      ['They ___ cricket when it started raining. (play)', 'were playing'],
      ['She ___ dinner when I arrived. (cook)', 'was cooking'],
    ],
    mcqs: [
      ['What ___ you doing at 8pm yesterday?', 'were', ['was', 'are', 'is']],
      ['He ___ watching TV when the power went off.', 'was', ['were', 'is', 'are']],
    ],
    translates: [
      ['Jab tum aaye, main so raha tha.', 'I was sleeping when you came.'],
    ],
    repeats: ['I was sleeping when you called.', 'She was studying all evening.'],
  },
  {
    key: 'present-perfect',
    title: 'Present Perfect',
    level: 'intermediate',
    vocabulary: ['already', 'yet', 'just', 'ever', 'never'],
    phrases: ['I have finished my work.', 'She has already left.', 'Have you ever been to Goa?'],
    fillBlanks: [
      ['I ___ already finished my homework. (have)', 'have'],
      ['She ___ just arrived. (have)', 'has'],
      ['They ___ never visited Mumbai. (have)', 'have'],
    ],
    mcqs: [
      ['Have you ___ visited the Taj Mahal?', 'ever', ['never', 'already', 'yet']],
      ['I have ___ finished my dinner.', 'already', ['ever', 'yet', 'never']],
    ],
    translates: [
      ['Maine abhi abhi apna kaam khatam kiya hai.', 'I have just finished my work.'],
    ],
    repeats: ['I have finished my work.', 'Have you ever been to Goa?'],
  },
  {
    key: 'future-going-to',
    title: 'Future — Going To',
    level: 'beginner',
    vocabulary: ['plan', 'tomorrow', 'next week', 'intend'],
    phrases: ['I am going to visit my grandmother.', 'She is going to study medicine.'],
    fillBlanks: [
      ['I ___ to visit my cousin tomorrow. (go)', 'am going'],
      ['She ___ to start a new job next week. (go)', 'is going'],
      ['We ___ to watch a movie tonight. (go)', 'are going'],
    ],
    mcqs: [
      ['What are you ___ to do this weekend?', 'going', ['go', 'went', 'gone']],
    ],
    translates: [
      ['Main kal apni dadi se milne jaa raha hoon.', 'I am going to visit my grandmother tomorrow.'],
    ],
    repeats: ['I am going to visit my grandmother.', 'She is going to study medicine.'],
  },
  {
    key: 'future-will',
    title: 'Future — Will',
    level: 'beginner',
    vocabulary: ['promise', 'tomorrow', 'soon', 'definitely'],
    phrases: ['I will call you tomorrow.', 'She will help you with your homework.'],
    fillBlanks: [
      ['I ___ call you tomorrow. (will)', 'will'],
      ['She ___ help you with your homework. (will)', 'will'],
      ['We ___ finish the project soon. (will)', 'will'],
    ],
    mcqs: [
      ['I promise I ___ be on time.', 'will', ['would', 'am', 'was']],
    ],
    translates: [
      ['Main kal tumhe call karunga.', 'I will call you tomorrow.'],
    ],
    repeats: ['I will call you tomorrow.', 'She will help you with your homework.'],
  },
  {
    key: 'articles',
    title: 'Articles — A / An / The',
    level: 'beginner',
    vocabulary: ['a', 'an', 'the', 'specific', 'general'],
    phrases: ['I saw a dog.', 'She is an engineer.', 'The sun is bright today.'],
    fillBlanks: [
      ['She is ___ engineer. (an/a)', 'an'],
      ['I saw ___ dog in the park. (a/an)', 'a'],
      ['___ sun rises in the east. (the/a)', 'The'],
      ['He wants to be ___ doctor. (a/an)', 'a'],
    ],
    mcqs: [
      ['I need ___ umbrella; it is raining.', 'an', ['a', 'the', '']],
      ['___ Taj Mahal is in Agra.', 'The', ['A', 'An', '']],
    ],
    translates: [
      ['Woh ek engineer hai.', 'She is an engineer.'],
    ],
    repeats: ['I saw a dog.', 'The sun is bright today.'],
  },
  {
    key: 'prepositions-place',
    title: 'Prepositions of Place',
    level: 'beginner',
    vocabulary: ['in', 'on', 'under', 'near', 'between', 'behind'],
    phrases: ['The book is on the table.', 'The cat is under the chair.', 'The school is near my house.'],
    fillBlanks: [
      ['The book is ___ the table. (on/in)', 'on'],
      ['The cat is ___ the chair. (under/on)', 'under'],
      ['My school is ___ my house. (near/on)', 'near'],
      ['The park is ___ the bank and the market. (between/under)', 'between'],
    ],
    mcqs: [
      ['The pen is ___ the box.', 'in', ['on', 'under', 'between']],
      ['Stand ___ me, please.', 'behind', ['in', 'on', 'under']],
    ],
    translates: [
      ['Kitaab table par hai.', 'The book is on the table.'],
    ],
    repeats: ['The book is on the table.', 'The school is near my house.'],
  },
  {
    key: 'prepositions-time',
    title: 'Prepositions of Time',
    level: 'beginner',
    vocabulary: ['at', 'on', 'in', 'during', 'since'],
    phrases: ['I wake up at 6 am.', 'My birthday is in July.', 'We meet on Mondays.'],
    fillBlanks: [
      ['I wake up ___ 6 am. (at/on)', 'at'],
      ['My birthday is ___ July. (in/at)', 'in'],
      ['We have a test ___ Monday. (on/in)', 'on'],
      ['She has lived here ___ 2015. (since/for)', 'since'],
    ],
    mcqs: [
      ['I was born ___ 2008.', 'in', ['on', 'at', 'since']],
      ['The shop closes ___ night.', 'at', ['in', 'on', 'since']],
    ],
    translates: [
      ['Mera birthday July mein hai.', 'My birthday is in July.'],
    ],
    repeats: ['I wake up at 6 am.', 'We meet on Mondays.'],
  },
  {
    key: 'modals-can-could',
    title: 'Modals — Can / Could',
    level: 'beginner',
    vocabulary: ['ability', 'permission', 'polite request'],
    phrases: ['I can swim.', 'Could you help me, please?', 'She can speak three languages.'],
    fillBlanks: [
      ['I ___ swim very well. (can)', 'can'],
      ['___ you please pass the salt? (could)', 'Could'],
      ['She ___ speak three languages. (can)', 'can'],
    ],
    mcqs: [
      ['___ you help me with this bag?', 'Could', ['Can', 'Will', 'Shall']],
      ['When I was five, I ___ already read.', 'could', ['can', 'will', 'shall']],
    ],
    translates: [
      ['Kya aap meri madad kar sakte hain?', 'Could you help me, please?'],
    ],
    repeats: ['I can swim.', 'Could you help me, please?'],
  },
  {
    key: 'modals-should-must',
    title: 'Modals — Should / Must',
    level: 'intermediate',
    vocabulary: ['advice', 'obligation', 'necessary'],
    phrases: ['You should sleep early.', 'You must wear a seatbelt.', 'We must finish this today.'],
    fillBlanks: [
      ['You ___ sleep early to stay healthy. (should)', 'should'],
      ['You ___ wear a seatbelt in the car. (must)', 'must'],
      ['We ___ finish this report today. (must)', 'must'],
    ],
    mcqs: [
      ['You look tired. You ___ rest.', 'should', ['must', 'can', 'will']],
      ['Students ___ submit their assignments on time.', 'must', ['should', 'can', 'could']],
    ],
    translates: [
      ['Tumhe jaldi sona chahiye.', 'You should sleep early.'],
    ],
    repeats: ['You should sleep early.', 'You must wear a seatbelt.'],
  },
  {
    key: 'modals-have-to',
    title: 'Modals — Have To',
    level: 'intermediate',
    vocabulary: ['necessity', 'requirement', 'obligation'],
    phrases: ['I have to finish my homework.', 'She has to wake up early.', 'We had to leave quickly.'],
    fillBlanks: [
      ['I ___ to finish my homework before dinner. (have)', 'have'],
      ['She ___ to wake up early for school. (have)', 'has'],
      ['We ___ to leave early yesterday. (had)', 'had'],
    ],
    mcqs: [
      ['He ___ to work on weekends sometimes.', 'has', ['have', 'had', 'having']],
    ],
    translates: [
      ['Mujhe apna homework khatam karna hai.', 'I have to finish my homework.'],
    ],
    repeats: ['I have to finish my homework.', 'She has to wake up early.'],
  },
  {
    key: 'comparatives',
    title: 'Comparatives',
    level: 'beginner',
    vocabulary: ['taller', 'faster', 'bigger', 'more expensive', 'better'],
    phrases: ['This bag is bigger than that one.', 'She is taller than her brother.'],
    fillBlanks: [
      ['This bag is ___ than that one. (big)', 'bigger'],
      ['She is ___ than her brother. (tall)', 'taller'],
      ['This phone is ___ than that one. (expensive)', 'more expensive'],
      ['Today is ___ than yesterday. (hot)', 'hotter'],
    ],
    mcqs: [
      ['My car is ___ than yours.', 'faster', ['fast', 'fastest', 'more fast']],
      ['This book is ___ than that one.', 'more interesting', ['interestinger', 'interesting', 'most interesting']],
    ],
    translates: [
      ['Yeh bag us se bada hai.', 'This bag is bigger than that one.'],
    ],
    repeats: ['This bag is bigger than that one.', 'She is taller than her brother.'],
  },
  {
    key: 'superlatives',
    title: 'Superlatives',
    level: 'beginner',
    vocabulary: ['the tallest', 'the fastest', 'the best', 'the most beautiful'],
    phrases: ['He is the tallest boy in the class.', 'This is the best restaurant in town.'],
    fillBlanks: [
      ['He is ___ boy in the class. (tall)', 'the tallest'],
      ['This is ___ restaurant in town. (good)', 'the best'],
      ['She is ___ student in school. (smart)', 'the smartest'],
    ],
    mcqs: [
      ['Everest is ___ mountain in the world.', 'the highest', ['the high', 'higher', 'more high']],
    ],
    translates: [
      ['Woh class ka sabse lamba ladka hai.', 'He is the tallest boy in the class.'],
    ],
    repeats: ['He is the tallest boy in the class.', 'This is the best restaurant in town.'],
  },
  {
    key: 'wh-questions',
    title: 'Wh- Questions',
    level: 'beginner',
    vocabulary: ['what', 'where', 'when', 'why', 'who', 'how'],
    phrases: ['What is your name?', 'Where do you live?', 'Why are you late?'],
    fillBlanks: [
      ['___ is your name? (what)', 'What'],
      ['___ do you live? (where)', 'Where'],
      ['___ are you late today? (why)', 'Why'],
      ['___ is coming to the party? (who)', 'Who'],
    ],
    mcqs: [
      ['___ old are you?', 'How', ['What', 'Where', 'Who']],
      ['___ does the shop close?', 'When', ['What', 'Why', 'Who']],
    ],
    translates: [
      ['Tumhara naam kya hai?', 'What is your name?'],
    ],
    repeats: ['What is your name?', 'Where do you live?'],
  },
  {
    key: 'yes-no-questions',
    title: 'Yes/No Questions',
    level: 'beginner',
    vocabulary: ['do', 'does', 'is', 'are', 'can'],
    phrases: ['Do you like tea?', 'Is she your sister?', 'Can you swim?'],
    fillBlanks: [
      ['___ you like tea? (do)', 'Do'],
      ['___ she your sister? (is)', 'Is'],
      ['___ you swim? (can)', 'Can'],
      ['___ they live here? (do)', 'Do'],
    ],
    mcqs: [
      ['___ your brother play cricket?', 'Does', ['Do', 'Is', 'Are']],
    ],
    translates: [
      ['Kya tumhe chai pasand hai?', 'Do you like tea?'],
    ],
    repeats: ['Do you like tea?', 'Can you swim?'],
  },
  {
    key: 'conditionals-zero',
    title: 'Conditionals — Zero Conditional',
    level: 'intermediate',
    vocabulary: ['if', 'always', 'fact', 'general truth'],
    phrases: ['If you heat water, it boils.', 'If it rains, the ground gets wet.'],
    fillBlanks: [
      ['If you heat water, it ___. (boil)', 'boils'],
      ['If it rains, the ground ___ wet. (get)', 'gets'],
      ['If you mix red and blue, you ___ purple. (get)', 'get'],
    ],
    mcqs: [
      ['If ice gets warm, it ___.', 'melts', ['melt', 'melted', 'melting']],
    ],
    translates: [
      ['Agar aap pani garam karte hain, toh woh ubalta hai.', 'If you heat water, it boils.'],
    ],
    repeats: ['If you heat water, it boils.', 'If it rains, the ground gets wet.'],
  },
  {
    key: 'conditionals-first',
    title: 'Conditionals — First Conditional',
    level: 'intermediate',
    vocabulary: ['if', 'will', 'possible', 'future'],
    phrases: ['If it rains, I will stay home.', 'If you study hard, you will pass.'],
    fillBlanks: [
      ['If it rains, I ___ stay home. (will)', 'will'],
      ['If you study hard, you ___ pass the exam. (will)', 'will'],
      ['If she calls, I ___ answer. (will)', 'will'],
    ],
    mcqs: [
      ['If I have time, I ___ visit you.', 'will', ['would', 'am', 'was']],
    ],
    translates: [
      ['Agar baarish hui, toh main ghar par rahunga.', 'If it rains, I will stay home.'],
    ],
    repeats: ['If it rains, I will stay home.', 'If you study hard, you will pass.'],
  },
  {
    key: 'conditionals-second',
    title: 'Conditionals — Second Conditional',
    level: 'advanced',
    vocabulary: ['if', 'would', 'hypothetical', 'imaginary'],
    phrases: ['If I were rich, I would travel the world.', 'If I had wings, I would fly.'],
    fillBlanks: [
      ['If I were rich, I ___ travel the world. (would)', 'would'],
      ['If I had wings, I ___ fly. (would)', 'would'],
      ['If she knew the answer, she ___ tell us. (would)', 'would'],
    ],
    mcqs: [
      ['If I ___ you, I would apologize.', 'were', ['was', 'am', 'be']],
    ],
    translates: [
      ['Agar main ameer hota, toh duniya ghoomta.', 'If I were rich, I would travel the world.'],
    ],
    repeats: ['If I were rich, I would travel the world.', 'If I had wings, I would fly.'],
  },
  {
    key: 'passive-voice',
    title: 'Passive Voice — Basics',
    level: 'advanced',
    vocabulary: ['is made', 'was written', 'is spoken', 'by'],
    phrases: ['English is spoken worldwide.', 'This book was written by a famous author.'],
    fillBlanks: [
      ['English ___ spoken in many countries. (is)', 'is'],
      ['This letter ___ written by my father. (was)', 'was'],
      ['The cake ___ made by my mother. (was)', 'was'],
    ],
    mcqs: [
      ['The Taj Mahal ___ built by Shah Jahan.', 'was', ['is', 'were', 'be']],
    ],
    translates: [
      ['English poori duniya mein boli jaati hai.', 'English is spoken worldwide.'],
    ],
    repeats: ['English is spoken worldwide.', 'This book was written by a famous author.'],
  },
  {
    key: 'reported-speech',
    title: 'Reported Speech — Basics',
    level: 'advanced',
    vocabulary: ['said', 'told', 'that', 'asked'],
    phrases: ['She said that she was tired.', 'He told me that he liked tea.'],
    fillBlanks: [
      ['She said ___ she was tired. (that)', 'that'],
      ['He told me ___ he liked tea. (that)', 'that'],
      ['She said she ___ come tomorrow. (would)', 'would'],
    ],
    mcqs: [
      ['He said he ___ busy.', 'was', ['is', 'be', 'were']],
    ],
    translates: [
      ['Usne kaha ki woh thaka hua tha.', 'He said that he was tired.'],
    ],
    repeats: ['She said that she was tired.', 'He told me that he liked tea.'],
  },
  {
    key: 'phrasal-verbs',
    title: 'Phrasal Verbs — Everyday',
    level: 'intermediate',
    vocabulary: ['wake up', 'give up', 'look after', 'turn off', 'find out'],
    phrases: ['I wake up at 6 am.', 'Please turn off the light.', 'She looks after her little brother.'],
    fillBlanks: [
      ['Please ___ off the light before you leave. (turn)', 'turn'],
      ['Never ___ up on your dreams. (give)', 'give'],
      ['She ___ after her little brother every day. (looks)', 'looks'],
    ],
    mcqs: [
      ['I need to ___ out what happened.', 'find', ['look', 'give', 'turn']],
    ],
    translates: [
      ['Please light band kar do.', 'Please turn off the light.'],
    ],
    repeats: ['Please turn off the light.', 'She looks after her little brother.'],
  },
  {
    key: 'gerund-infinitive',
    title: 'Gerund vs Infinitive',
    level: 'intermediate',
    vocabulary: ['enjoy', 'want', 'like', 'decide', 'avoid'],
    phrases: ['I enjoy reading books.', 'She wants to become a doctor.', 'We decided to leave early.'],
    fillBlanks: [
      ['I enjoy ___ books. (read)', 'reading'],
      ['She wants ___ a doctor. (become)', 'to become'],
      ['We decided ___ early. (leave)', 'to leave'],
    ],
    mcqs: [
      ['He avoids ___ junk food.', 'eating', ['to eat', 'eat', 'ate']],
    ],
    translates: [
      ['Mujhe kitabein padhna pasand hai.', 'I enjoy reading books.'],
    ],
    repeats: ['I enjoy reading books.', 'She wants to become a doctor.'],
  },
  {
    key: 'countable-uncountable',
    title: 'Countable vs Uncountable Nouns',
    level: 'beginner',
    vocabulary: ['some', 'any', 'much', 'many', 'a little', 'a few'],
    phrases: ['I have some water.', 'There are many books on the table.', 'She has a little money.'],
    fillBlanks: [
      ['I have ___ water in my bottle. (some)', 'some'],
      ['There are ___ books on the table. (many)', 'many'],
      ['She has ___ money with her. (a little)', 'a little'],
    ],
    mcqs: [
      ['How ___ rice do you want?', 'much', ['many', 'few', 'some']],
      ['How ___ chairs do we need?', 'many', ['much', 'little', 'any']],
    ],
    translates: [
      ['Mere paas thoda paani hai.', 'I have some water.'],
    ],
    repeats: ['I have some water.', 'There are many books on the table.'],
  },
  {
    key: 'possessives',
    title: 'Possessives',
    level: 'beginner',
    vocabulary: ['my', 'your', 'his', 'her', 'their', 'our'],
    phrases: ['This is my book.', 'That is her bag.', 'Their house is big.'],
    fillBlanks: [
      ['This is ___ book. (my)', 'my'],
      ['That is ___ bag. (her)', 'her'],
      ['___ house is very big. (their)', 'Their'],
    ],
    mcqs: [
      ['Is this ___ pen or mine?', 'your', ['you', 'yours', "you're"]],
    ],
    translates: [
      ['Yeh meri kitaab hai.', 'This is my book.'],
    ],
    repeats: ['This is my book.', 'Their house is big.'],
  },
  {
    key: 'pronouns',
    title: 'Pronouns',
    level: 'beginner',
    vocabulary: ['he', 'she', 'it', 'they', 'we', 'I', 'you'],
    phrases: ['He is my friend.', 'She likes music.', 'They are students.'],
    fillBlanks: [
      ['___ is my best friend. (he)', 'He'],
      ['___ likes music a lot. (she)', 'She'],
      ['___ are students in Class 9. (they)', 'They'],
    ],
    mcqs: [
      ['___ is raining outside.', 'It', ['He', 'She', 'They']],
    ],
    translates: [
      ['Woh mera sabse achha dost hai.', 'He is my best friend.'],
    ],
    repeats: ['He is my friend.', 'They are students.'],
  },
  {
    key: 'linking-words',
    title: 'Linking Words',
    level: 'intermediate',
    vocabulary: ['because', 'although', 'so', 'but', 'however'],
    phrases: ['I stayed home because it was raining.', 'She is tired, but she keeps working.'],
    fillBlanks: [
      ['I stayed home ___ it was raining. (because)', 'because'],
      ['She is tired, ___ she keeps working. (but)', 'but'],
      ['He studied hard, ___ he passed the exam. (so)', 'so'],
    ],
    mcqs: [
      ['___ it was late, we continued working.', 'Although', ['Because', 'So', 'But']],
    ],
    translates: [
      ['Main ghar par raha kyunki baarish ho rahi thi.', 'I stayed home because it was raining.'],
    ],
    repeats: ['I stayed home because it was raining.', 'She is tired, but she keeps working.'],
  },
  {
    key: 'prefixes-suffixes',
    title: 'Prefixes & Suffixes',
    level: 'advanced',
    vocabulary: ['unhappy', 'disagree', 'careful', 'quickly', 'happiness'],
    phrases: ['He looked unhappy.', 'I disagree with you.', 'Drive carefully.'],
    fillBlanks: [
      ['He looked ___ after the match. (unhappy)', 'unhappy'],
      ['I ___ with your opinion. (disagree)', 'disagree'],
      ['Please drive ___. (careful + ly)', 'carefully'],
    ],
    mcqs: [
      ['Opposite of "happy" using a prefix?', 'unhappy', ['dishappy', 'inhappy', 'nothappy']],
    ],
    translates: [
      ['Main tumse asahmat hoon.', 'I disagree with you.'],
    ],
    repeats: ['He looked unhappy.', 'I disagree with you.'],
  },
];

function buildGrammarLessons(p: GrammarPattern, baseOrder: number): LessonSeed[] {
  const tiers = ['Intro', 'Practice', 'Mastery'] as const;
  const fb = chunk(p.fillBlanks, 3);
  const mc = chunk(p.mcqs, 3);
  const tr = chunk(p.translates, 3);
  const rp = chunk(p.repeats, 3);

  return tiers.map((tier, i) => {
    const exercises = [
      ...fb[i].map(([sentence, answer, hi]) => fillBlankEx(sentence, answer, hi)),
      ...mc[i].map(([prompt, answer, distractors, hi]) => mcqEx(prompt, answer, distractors, hi)),
      ...tr[i].map(([hi, en]) => translateEx(hi, en)),
      ...rp[i].map((r) => repeatEx(r)),
    ];
    if (i === 1 && p.phrases[0]) exercises.push(wordBankEx(p.phrases[i % p.phrases.length]));
    if (i === 2 && p.matchPairs) exercises.push(matchEx(p.matchPairs));
    if (exercises.length === 0) exercises.push(repeatEx(p.phrases[0] ?? p.title));

    return {
      title: `${p.title} — ${tier}`,
      description: `${tier} level practice for ${p.title.toLowerCase()}.`,
      level: p.level,
      category: 'Grammar',
      durationMinutes: 10 + i * 2,
      order: baseOrder + i,
      tags: ['grammar', p.key],
      gradeBand: p.gradeBand,
      content: { vocabulary: p.vocabulary, phrases: p.phrases, exercises },
    };
  });
}

export const GRAMMAR_LESSONS: LessonSeed[] = PATTERNS.flatMap((p, i) => buildGrammarLessons(p, 200 + i * 3));
