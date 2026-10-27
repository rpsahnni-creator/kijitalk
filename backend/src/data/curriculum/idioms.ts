import { LessonSeed, DISTRACTOR_WORDS, pickRandom, fillBlankEx, mcqEx, matchEx, wordBankEx, translateEx, repeatEx } from './helpers';

type Idiom = [string, string, string]; // idiom, meaning, example sentence

interface IdiomGroup {
  key: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  idioms: Idiom[];
}

const GROUPS: IdiomGroup[] = [
  {
    key: 'weather-idioms',
    title: 'Weather Idioms',
    level: 'intermediate',
    idioms: [
      ['under the weather', 'feeling slightly ill', 'I am feeling a bit under the weather today.'],
      ['it never rains but it pours', 'problems come all at once', 'First my bike broke, then my phone — it never rains but it pours.'],
      ['on cloud nine', 'extremely happy', 'She was on cloud nine after winning the prize.'],
      ['take a rain check', 'postpone a plan', 'Can I take a rain check on dinner tonight?'],
      ['come rain or shine', 'no matter what happens', 'I will be there, come rain or shine.'],
      ['chase rainbows', 'chase unrealistic goals', 'Stop chasing rainbows and focus on real plans.'],
    ],
  },
  {
    key: 'animal-idioms',
    title: 'Animal Idioms',
    level: 'intermediate',
    idioms: [
      ['let the cat out of the bag', 'reveal a secret by accident', 'He let the cat out of the bag about the surprise party.'],
      ['it\'s raining cats and dogs', 'raining very heavily', 'Take an umbrella, it is raining cats and dogs.'],
      ['the elephant in the room', 'an obvious problem nobody discusses', 'Let\'s talk about the elephant in the room — our falling sales.'],
      ['kill two birds with one stone', 'achieve two things at once', 'By cycling to work, I kill two birds with one stone.'],
      ['a fish out of water', 'uncomfortable in a new situation', 'On the first day, I felt like a fish out of water.'],
      ['hold your horses', 'wait, be patient', 'Hold your horses, we are not ready yet.'],
    ],
  },
  {
    key: 'food-idioms',
    title: 'Food Idioms',
    level: 'intermediate',
    idioms: [
      ['piece of cake', 'very easy', 'This exam was a piece of cake.'],
      ['spill the beans', 'reveal a secret', 'Come on, spill the beans about your trip!'],
      ['the icing on the cake', 'an extra good thing on top of something good', 'Winning the prize was the icing on the cake.'],
      ['bring home the bacon', 'earn money for the family', 'She works two jobs to bring home the bacon.'],
      ['not my cup of tea', 'not something I enjoy', 'Horror movies are not my cup of tea.'],
      ['have a lot on my plate', 'have a lot to do', 'I have a lot on my plate this week.'],
    ],
  },
  {
    key: 'body-idioms',
    title: 'Body Idioms',
    level: 'intermediate',
    idioms: [
      ['keep an eye on', 'watch carefully', 'Please keep an eye on my bag.'],
      ['cost an arm and a leg', 'very expensive', 'That new phone cost an arm and a leg.'],
      ['get cold feet', 'become nervous before doing something', 'He got cold feet before his speech.'],
      ['all ears', 'listening very attentively', 'Tell me everything, I am all ears.'],
      ['a headache', 'an annoying problem', 'Fixing this printer is such a headache.'],
      ['put your foot in your mouth', 'say something embarrassing', 'I really put my foot in my mouth at the meeting.'],
    ],
  },
  {
    key: 'time-idioms',
    title: 'Time Idioms',
    level: 'intermediate',
    idioms: [
      ['once in a blue moon', 'very rarely', 'We go to the movies once in a blue moon.'],
      ['in the nick of time', 'just before it is too late', 'He arrived in the nick of time for the train.'],
      ['around the clock', 'all day and night', 'The team worked around the clock to finish the project.'],
      ['better late than never', 'it is good to do something even late', 'He finally called back — better late than never.'],
      ['time flies', 'time passes quickly', 'Time flies when you are having fun.'],
      ['at the eleventh hour', 'at the last possible moment', 'We finished the report at the eleventh hour.'],
    ],
  },
  {
    key: 'money-idioms',
    title: 'Money Idioms',
    level: 'intermediate',
    idioms: [
      ['break the bank', 'spend too much money', 'This trip will not break the bank.'],
      ['tighten your belt', 'spend less money', 'We need to tighten our belt this month.'],
      ['money doesn\'t grow on trees', 'money is not easy to get', 'Be careful with spending, money doesn\'t grow on trees.'],
      ['save for a rainy day', 'save money for the future', 'I always save some money for a rainy day.'],
      ['a penny saved is a penny earned', 'saving money is as good as earning it', 'She lives by the rule: a penny saved is a penny earned.'],
      ['go dutch', 'split the bill equally', 'Let\'s go dutch for dinner tonight.'],
    ],
  },
  {
    key: 'color-idioms',
    title: 'Color Idioms',
    level: 'intermediate',
    idioms: [
      ['once in a blue moon', 'very rarely', 'He visits his hometown once in a blue moon.'],
      ['green with envy', 'very jealous', 'She was green with envy when I got the promotion.'],
      ['out of the blue', 'unexpectedly', 'He called me out of the blue yesterday.'],
      ['a white lie', 'a harmless small lie', 'I told a white lie to avoid hurting her feelings.'],
      ['see red', 'become very angry', 'He saw red when his bike was scratched.'],
      ['golden opportunity', 'an excellent chance', 'This job offer is a golden opportunity.'],
    ],
  },
  {
    key: 'success-failure-idioms',
    title: 'Success & Failure Idioms',
    level: 'advanced',
    idioms: [
      ['hit the nail on the head', 'say exactly the right thing', 'You hit the nail on the head with that answer.'],
      ['back to the drawing board', 'start a plan again', 'The plan failed, so it\'s back to the drawing board.'],
      ['make or break', 'decide success or failure completely', 'This interview could make or break his career.'],
      ['a long shot', 'something unlikely to succeed', 'Winning the lottery is a long shot.'],
      ['bite the bullet', 'accept something difficult bravely', 'I had to bite the bullet and apologize first.'],
      ['the ball is in your court', 'it is your turn to decide/act', 'I have done my part, the ball is in your court now.'],
    ],
  },
  {
    key: 'emotion-idioms',
    title: 'Emotion Idioms',
    level: 'intermediate',
    idioms: [
      ['over the moon', 'extremely happy', 'She was over the moon about her exam results.'],
      ['down in the dumps', 'feeling sad', 'He has been down in the dumps since the loss.'],
      ['butterflies in my stomach', 'nervous feeling', 'I had butterflies in my stomach before the interview.'],
      ['at the end of my rope', 'completely out of patience', 'I am at the end of my rope with this noisy neighbor.'],
      ['on edge', 'nervous or anxious', 'She has been on edge all week before the exam.'],
      ['walking on air', 'feeling very happy and light', 'After the good news, he was walking on air.'],
    ],
  },
  {
    key: 'communication-idioms',
    title: 'Communication Idioms',
    level: 'advanced',
    idioms: [
      ['get to the point', 'say the main thing directly', 'Please get to the point, we have little time.'],
      ['beat around the bush', 'avoid saying something directly', 'Stop beating around the bush and tell me the truth.'],
      ['read between the lines', 'understand the hidden meaning', 'You need to read between the lines of his email.'],
      ['on the same page', 'having the same understanding', 'Let\'s make sure we are on the same page before we start.'],
      ['word of mouth', 'information spread by people talking', 'We got new customers through word of mouth.'],
      ['keep someone posted', 'keep someone updated', 'Please keep me posted about the project.'],
    ],
  },
  {
    key: 'effort-idioms',
    title: 'Effort & Hard Work Idioms',
    level: 'intermediate',
    idioms: [
      ['burn the midnight oil', 'work late into the night', 'She burned the midnight oil before the exam.'],
      ['go the extra mile', 'make extra effort', 'He always goes the extra mile for his students.'],
      ['put your back into it', 'work very hard', 'If you want to win, put your back into it.'],
      ['no pain, no gain', 'success needs hard effort', 'Training every day is tough, but no pain, no gain.'],
      ['rome wasn\'t built in a day', 'big things take time', 'Don\'t worry about slow progress, Rome wasn\'t built in a day.'],
      ['roll up your sleeves', 'prepare to work hard', 'It\'s time to roll up our sleeves and finish this.'],
    ],
  },
  {
    key: 'decision-idioms',
    title: 'Decision-Making Idioms',
    level: 'advanced',
    idioms: [
      ['on the fence', 'undecided about something', 'I am still on the fence about changing my job.'],
      ['cross that bridge when we come to it', 'deal with a problem later', 'Let\'s cross that bridge when we come to it.'],
      ['think outside the box', 'think creatively', 'We need to think outside the box for this problem.'],
      ['weigh the pros and cons', 'consider the good and bad points', 'Let\'s weigh the pros and cons before deciding.'],
      ['take the plunge', 'decide to do something risky', 'He finally took the plunge and started his own business.'],
      ['a no-brainer', 'an obviously easy decision', 'Choosing this college was a no-brainer for her.'],
    ],
  },
  {
    key: 'everyday-expressions-1',
    title: 'Everyday Expressions I',
    level: 'beginner',
    idioms: [
      ['no big deal', 'not important', 'Don\'t worry, it\'s no big deal.'],
      ['what\'s up', 'casual way to ask how someone is', 'Hey, what\'s up with you today?'],
      ['my bad', 'informal way to say sorry', 'My bad, I forgot to call you back.'],
      ['take it easy', 'relax, don\'t worry', 'Take it easy, everything will be fine.'],
      ['hang in there', 'stay patient during a hard time', 'Hang in there, exams will be over soon.'],
      ['long time no see', 'said when meeting someone after a while', 'Hey, long time no see! How are you?'],
    ],
  },
  {
    key: 'everyday-expressions-2',
    title: 'Everyday Expressions II',
    level: 'beginner',
    idioms: [
      ['piece of advice', 'a helpful suggestion', 'Let me give you a piece of advice.'],
      ['in a nutshell', 'briefly, in short', 'In a nutshell, the plan failed.'],
      ['sooner or later', 'at some point in the future', 'Sooner or later, you will have to decide.'],
      ['give it a shot', 'try something', 'Why not give it a shot? You might succeed.'],
      ['make yourself at home', 'feel comfortable as a guest', 'Please make yourself at home.'],
      ['keep in touch', 'stay in contact', 'Let\'s keep in touch after graduation.'],
    ],
  },
  {
    key: 'school-everyday-idioms',
    title: 'School & Study Idioms',
    level: 'intermediate',
    idioms: [
      ['hit the books', 'start studying seriously', 'I need to hit the books before the test.'],
      ['pass with flying colors', 'succeed very well', 'She passed the exam with flying colors.'],
      ['learn the ropes', 'learn how to do something new', 'It took a week to learn the ropes at my new school.'],
      ['cram for an exam', 'study intensely at the last minute', 'He crammed for the exam all night.'],
      ['a quick learner', 'someone who learns fast', 'My younger sister is a quick learner.'],
      ['drop out', 'leave school before finishing', 'He almost dropped out but decided to continue.'],
    ],
  },
  {
    key: 'work-everyday-idioms',
    title: 'Work & Office Idioms',
    level: 'advanced',
    idioms: [
      ['get the ball rolling', 'start something', 'Let\'s get the ball rolling on this project.'],
      ['think on your feet', 'react quickly and smartly', 'A good manager can think on her feet.'],
      ['touch base', 'make brief contact to check in', 'Let\'s touch base next week about this.'],
      ['call it a day', 'stop working for the day', 'We finished enough, let\'s call it a day.'],
      ['climb the corporate ladder', 'get promoted over time', 'She worked hard to climb the corporate ladder.'],
      ['in charge of', 'responsible for', 'She is in charge of the whole project.'],
    ],
  },
  {
    key: 'confidence-idioms',
    title: 'Confidence & Courage Idioms',
    level: 'intermediate',
    idioms: [
      ['believe in yourself', 'have confidence in your own ability', 'You can do it, believe in yourself.'],
      ['step out of your comfort zone', 'try something unfamiliar', 'Studying abroad helped him step out of his comfort zone.'],
      ['face your fears', 'confront something you are afraid of', 'She faced her fears and gave the speech.'],
      ['stand your ground', 'not give up your position', 'He stood his ground during the argument.'],
      ['take it in your stride', 'deal calmly with a difficulty', 'She took the criticism in her stride.'],
      ['go for it', 'try something without hesitation', 'If you want that job, just go for it!'],
    ],
  },
  {
    key: 'agreement-idioms',
    title: 'Agreement & Disagreement Idioms',
    level: 'intermediate',
    idioms: [
      ['see eye to eye', 'agree completely with someone', 'We don\'t always see eye to eye, but we respect each other.'],
      ['agree to disagree', 'accept different opinions peacefully', 'Let\'s just agree to disagree on this topic.'],
      ['on second thought', 'after reconsidering', 'On second thought, let\'s meet tomorrow instead.'],
      ['have a change of heart', 'change your opinion or feeling', 'He had a change of heart and decided to stay.'],
      ['stick to your guns', 'not change your position', 'She stuck to her guns despite the pressure.'],
      ['a matter of opinion', 'something people can disagree about', 'Whether this movie is good is a matter of opinion.'],
    ],
  },
  {
    key: 'common-sayings-1',
    title: 'Common Sayings I',
    level: 'intermediate',
    idioms: [
      ['actions speak louder than words', 'what you do matters more than what you say', 'He didn\'t apologize, but he helped — actions speak louder than words.'],
      ['the early bird catches the worm', 'success comes to those who act early', 'She always arrives first — the early bird catches the worm.'],
      ['don\'t judge a book by its cover', 'don\'t judge by appearance', 'He looks strict, but don\'t judge a book by its cover.'],
      ['practice makes perfect', 'repeated practice improves skill', 'Keep practicing your English, practice makes perfect.'],
      ['better safe than sorry', 'it\'s wiser to be careful', 'Take an umbrella, better safe than sorry.'],
      ['every cloud has a silver lining', 'something good can come from a bad situation', 'I lost the job, but every cloud has a silver lining — I found a better one.'],
    ],
  },
  {
    key: 'common-sayings-2',
    title: 'Common Sayings II',
    level: 'intermediate',
    idioms: [
      ['when in Rome, do as the Romans do', 'follow local customs when visiting a place', 'When in Rome, do as the Romans do — try the local food.'],
      ['the grass is always greener on the other side', 'other situations seem better than ours', 'He thinks the grass is always greener on the other side.'],
      ['don\'t count your chickens before they hatch', 'don\'t assume success too early', 'We haven\'t won yet, don\'t count your chickens before they hatch.'],
      ['honesty is the best policy', 'telling the truth is always best', 'Always tell the truth, honesty is the best policy.'],
      ['out of sight, out of mind', 'people forget what they don\'t see', 'Since she moved away, it\'s out of sight, out of mind.'],
      ['curiosity killed the cat', 'being too curious can cause trouble', 'Don\'t ask too many questions, curiosity killed the cat.'],
    ],
  },
  {
    key: 'travel-idioms',
    title: 'Travel Idioms',
    level: 'intermediate',
    idioms: [
      ['hit the road', 'start a journey', 'It\'s getting late, let\'s hit the road.'],
      ['off the beaten path', 'an unusual, less-visited place', 'We found a lovely village off the beaten path.'],
      ['pack your bags', 'prepare to leave on a trip', 'Pack your bags, we are leaving tomorrow.'],
      ['a home away from home', 'a place that feels comfortable like home', 'This hostel feels like a home away from home.'],
      ['travel light', 'travel with minimal luggage', 'I always try to travel light.'],
      ['jet lag', 'tiredness after a long flight', 'I still have jet lag from my trip.'],
    ],
  },
  {
    key: 'shopping-idioms',
    title: 'Shopping Idioms',
    level: 'intermediate',
    idioms: [
      ['window shopping', 'looking at shops without buying', 'We went window shopping over the weekend.'],
      ['a good bargain', 'a good deal/price', 'I got this jacket at a good bargain.'],
      ['burn a hole in your pocket', 'spend money quickly', 'That new phone will burn a hole in your pocket.'],
      ['dirt cheap', 'extremely inexpensive', 'These shoes were dirt cheap at the sale.'],
      ['splash out', 'spend a lot of money on something special', 'We decided to splash out on a nice dinner.'],
      ['shop till you drop', 'shop for a very long time', 'On weekends, she loves to shop till she drops.'],
    ],
  },
  {
    key: 'friendship-idioms',
    title: 'Friendship Idioms',
    level: 'intermediate',
    idioms: [
      ['a shoulder to cry on', 'someone who comforts you', 'She was always a shoulder to cry on for me.'],
      ['thick as thieves', 'very close friends', 'Those two have been thick as thieves since childhood.'],
      ['through thick and thin', 'in good times and bad times', 'My best friend has supported me through thick and thin.'],
      ['have each other\'s back', 'support and protect each other', 'In this team, we always have each other\'s back.'],
      ['a true friend', 'a loyal, genuine friend', 'She proved to be a true friend during tough times.'],
      ['drift apart', 'slowly become less close', 'We drifted apart after college.'],
    ],
  },
  {
    key: 'anger-idioms',
    title: 'Anger & Frustration Idioms',
    level: 'advanced',
    idioms: [
      ['lose your temper', 'become angry suddenly', 'He lost his temper during the meeting.'],
      ['blow a fuse', 'become extremely angry', 'My father blew a fuse when I came home late.'],
      ['get on someone\'s nerves', 'annoy someone', 'That loud music is getting on my nerves.'],
      ['fed up with', 'tired and annoyed by something', 'I am fed up with this constant traffic.'],
      ['let off steam', 'release anger or energy', 'He went for a run to let off steam.'],
      ['cool down', 'calm down after being upset', 'Take a few minutes to cool down before we talk.'],
    ],
  },
  {
    key: 'surprise-idioms',
    title: 'Surprise Idioms',
    level: 'intermediate',
    idioms: [
      ['out of the blue', 'suddenly, unexpectedly', 'She called me out of the blue after years.'],
      ['catch someone off guard', 'surprise someone unexpectedly', 'The question caught me off guard.'],
      ['a bolt from the blue', 'a complete surprise', 'The news was a bolt from the blue for everyone.'],
      ['blow someone\'s mind', 'amaze someone', 'The magic show blew my mind.'],
      ['you could have knocked me over with a feather', 'I was extremely surprised', 'When I heard the news, you could have knocked me over with a feather.'],
      ['take someone by surprise', 'surprise someone', 'The sudden rain took us by surprise.'],
    ],
  },
  {
    key: 'luck-idioms',
    title: 'Luck Idioms',
    level: 'intermediate',
    idioms: [
      ['break a leg', 'good luck (especially before a performance)', 'Break a leg at your audition today!'],
      ['a stroke of luck', 'a sudden piece of good fortune', 'Finding that job was a real stroke of luck.'],
      ['as luck would have it', 'by chance', 'As luck would have it, I found my lost keys.'],
      ['down on your luck', 'experiencing bad fortune', 'He has been down on his luck lately.'],
      ['third time\'s the charm', 'success often comes on the third attempt', 'I failed twice, but third time\'s the charm!'],
      ['beginner\'s luck', 'unexpected success for someone new', 'She won her first game — pure beginner\'s luck.'],
    ],
  },
  {
    key: 'honesty-idioms',
    title: 'Honesty Idioms',
    level: 'advanced',
    idioms: [
      ['come clean', 'admit the truth', 'He finally came clean about the mistake.'],
      ['tell it like it is', 'speak honestly, even if unpleasant', 'I appreciate that she tells it like it is.'],
      ['straight from the horse\'s mouth', 'direct, reliable information', 'I heard this straight from the horse\'s mouth.'],
      ['cut corners', 'do something badly to save time/money', 'Don\'t cut corners on safety.'],
      ['the whole truth', 'everything that is true', 'Please tell me the whole truth.'],
      ['above board', 'honest and legal', 'This business deal is completely above board.'],
    ],
  },
  {
    key: 'beginning-idioms',
    title: 'Starting Something Idioms',
    level: 'intermediate',
    idioms: [
      ['from scratch', 'from the very beginning', 'We built this business from scratch.'],
      ['a fresh start', 'a new beginning', 'Moving to a new city gave her a fresh start.'],
      ['get off on the right foot', 'start well', 'I want to get off on the right foot in this new job.'],
      ['break the ice', 'make people feel comfortable at the start', 'He told a joke to break the ice.'],
      ['take the first step', 'begin doing something', 'Just take the first step and the rest will follow.'],
      ['kick off', 'begin an event', 'The event will kick off at 6 pm.'],
    ],
  },
  {
    key: 'ending-idioms',
    title: 'Ending Something Idioms',
    level: 'intermediate',
    idioms: [
      ['call it quits', 'stop doing something', 'After three attempts, he decided to call it quits.'],
      ['the end of the road', 'the final point of something', 'This felt like the end of the road for the project.'],
      ['wrap things up', 'finish something', 'Let\'s wrap things up before lunch.'],
      ['draw to a close', 'come to an end', 'The event is drawing to a close.'],
      ['the final straw', 'the last problem that makes you give up', 'That mistake was the final straw for me.'],
      ['last but not least', 'the final point, still important', 'Last but not least, thank you all for coming.'],
    ],
  },
  {
    key: 'problem-idioms',
    title: 'Problems & Difficulty Idioms',
    level: 'advanced',
    idioms: [
      ['a tough nut to crack', 'a difficult problem or person', 'This math problem is a tough nut to crack.'],
      ['in hot water', 'in trouble', 'He is in hot water after missing the deadline.'],
      ['between a rock and a hard place', 'facing two difficult choices', 'I am between a rock and a hard place with this decision.'],
      ['a blessing in disguise', 'something bad that turns out good', 'Losing that job was a blessing in disguise.'],
      ['go from bad to worse', 'a situation getting even worse', 'The weather went from bad to worse during the trip.'],
      ['at a crossroads', 'at a point where an important decision is needed', 'She is at a crossroads in her career.'],
    ],
  },
  {
    key: 'speed-idioms',
    title: 'Speed Idioms',
    level: 'intermediate',
    idioms: [
      ['in a flash', 'very quickly', 'He finished his homework in a flash.'],
      ['at the speed of light', 'extremely fast', 'News travels at the speed of light these days.'],
      ['slow and steady wins the race', 'patience leads to success', 'Don\'t rush, slow and steady wins the race.'],
      ['on the double', 'very quickly, immediately', 'Get here on the double, it\'s urgent.'],
      ['in no time', 'very soon', 'We will finish this in no time.'],
      ['take your time', 'do something without hurrying', 'There\'s no rush, take your time.'],
    ],
  },
  {
    key: 'importance-idioms',
    title: 'Importance Idioms',
    level: 'advanced',
    idioms: [
      ['a big deal', 'something important', 'Getting this scholarship is a big deal for her.'],
      ['make a mountain out of a molehill', 'exaggerate a small problem', 'Don\'t make a mountain out of a molehill.'],
      ['the tip of the iceberg', 'a small visible part of a bigger problem', 'This complaint is just the tip of the iceberg.'],
      ['a top priority', 'the most important thing', 'Safety is our top priority.'],
      ['mean the world to someone', 'be extremely important to someone', 'This opportunity means the world to me.'],
      ['not worth the trouble', 'not important enough to deal with', 'Arguing about this is not worth the trouble.'],
    ],
  },
  {
    key: 'everyday-expressions-3',
    title: 'Everyday Expressions III',
    level: 'beginner',
    idioms: [
      ['no worries', 'it\'s okay, don\'t worry', 'No worries, we can reschedule.'],
      ['sounds good', 'that is fine/agreeable', 'Meeting at six? Sounds good!'],
      ['my pleasure', 'it was not a problem to help', 'Thank you! — My pleasure.'],
      ['you\'re welcome', 'a polite reply to thank you', 'You\'re welcome, happy to help.'],
      ['take care', 'said when saying goodbye, meaning be safe', 'Take care, see you next week.'],
      ['let\'s see', 'said when considering something', 'Let\'s see what we can do about this.'],
    ],
  },
  {
    key: 'everyday-expressions-4',
    title: 'Everyday Expressions IV',
    level: 'beginner',
    idioms: [
      ['it depends', 'the answer is not fixed, it varies', 'Will it rain tomorrow? It depends on the weather.'],
      ['I guess so', 'a weak agreement', 'Are you coming tonight? I guess so.'],
      ['never mind', 'forget about it, it doesn\'t matter', 'Never mind, it wasn\'t important.'],
      ['on purpose', 'intentionally', 'He didn\'t break it on purpose.'],
      ['by accident', 'unintentionally', 'I deleted the file by accident.'],
      ['just in case', 'as a precaution', 'Take an umbrella, just in case it rains.'],
    ],
  },
  {
    key: 'modern-slang',
    title: 'Modern Everyday Slang',
    level: 'intermediate',
    idioms: [
      ['that\'s lit', 'that is exciting/great (informal)', 'The concert last night was lit!'],
      ['no cap', 'no lie, seriously (informal)', 'This is the best food ever, no cap.'],
      ['low-key', 'somewhat, secretly', 'I low-key enjoyed that boring movie.'],
      ['ghosted', 'suddenly stopped responding to someone', 'He ghosted me after our last chat.'],
      ['vibe check', 'checking the general mood/feeling', 'Let\'s do a quick vibe check before the meeting.'],
      ['it\'s a vibe', 'describes a pleasant atmosphere or mood', 'This cafe has such a nice vibe.'],
    ],
  },
];

function buildIdiomLessons(g: IdiomGroup, baseOrder: number): LessonSeed[] {
  const vocabulary = g.idioms.map((x) => x[0]);
  const examples = g.idioms.map((x) => x[2]);

  const lesson1 = {
    title: `${g.title} — Recognize Meaning`,
    description: `Learn what these common idioms mean: ${g.title.toLowerCase()}.`,
    level: g.level,
    category: 'Idioms & Everyday English',
    durationMinutes: 9,
    order: baseOrder,
    tags: ['idioms', g.key],
    content: {
      vocabulary,
      phrases: examples,
      exercises: [
        mcqEx(`What does "${g.idioms[0][0]}" mean?`, g.idioms[0][1], pickRandom(DISTRACTOR_WORDS, 3)),
        mcqEx(`What does "${g.idioms[1][0]}" mean?`, g.idioms[1][1], pickRandom(DISTRACTOR_WORDS, 3)),
        matchEx(
          g.idioms.slice(2, 6).map(([idiom, meaning]) => ({ left: idiom, right: meaning })),
          'Match each idiom to its meaning:'
        ),
      ],
    },
  };

  const lesson2 = {
    title: `${g.title} — Use in Context`,
    description: `Practice using idioms from ${g.title.toLowerCase()} in real sentences.`,
    level: g.level,
    category: 'Idioms & Everyday English',
    durationMinutes: 10,
    order: baseOrder + 1,
    tags: ['idioms', g.key],
    content: {
      vocabulary,
      phrases: examples,
      exercises: [
        fillBlankEx(examples[0], g.idioms[0][0]),
        fillBlankEx(examples[2], g.idioms[2][0]),
        wordBankEx(examples[3]),
        translateEx(`English mein idiom "${g.idioms[4][0]}" ka matlab batao`, g.idioms[4][1]),
        repeatEx(examples[5] ?? examples[0]),
      ],
    },
  };

  const lesson3 = {
    title: `${g.title} — Review`,
    description: `Mixed review of idioms from ${g.title.toLowerCase()}.`,
    level: g.level,
    category: 'Idioms & Everyday English',
    durationMinutes: 10,
    order: baseOrder + 2,
    tags: ['idioms', g.key],
    content: {
      vocabulary,
      phrases: examples,
      exercises: [
        mcqEx(`What does "${g.idioms[5] ? g.idioms[5][0] : g.idioms[2][0]}" mean?`, g.idioms[5] ? g.idioms[5][1] : g.idioms[2][1], pickRandom(DISTRACTOR_WORDS, 3)),
        translateEx(`English mein idiom "${g.idioms[1][0]}" ka matlab batao`, g.idioms[1][1]),
        fillBlankEx(examples[1], g.idioms[1][0]),
        repeatEx(examples[4] ?? examples[0]),
      ],
    },
  };

  return [lesson1, lesson2, lesson3];
}

export const IDIOM_LESSONS: LessonSeed[] = GROUPS.flatMap((g, i) => buildIdiomLessons(g, 4000 + i * 3));
