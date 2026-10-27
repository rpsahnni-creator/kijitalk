export const labels = {
  home: { en: 'Home', hi: 'होम' },
  chat: { en: 'Kiki Chat', hi: 'Kiki से बात' },
  voice: { en: 'Voice', hi: 'आवाज़' },
  roleplay: { en: 'Roleplay', hi: 'अभिनय' },
  lessons: { en: 'Lessons', hi: 'पाठ' },
  progress: { en: 'Progress', hi: 'प्रगति' },
  settings: { en: 'Settings', hi: 'सेटिंग' },
  dashboardGreeting: { en: 'Ready to practice English today?', hi: 'आज English practice करें?' },
  dailyPhrase: { en: "Today's Phrase", hi: 'आज का वाक्य' },
  quickActions: { en: 'Quick Actions', hi: 'त्वरित कार्य' },
  recommended: { en: 'Recommended for you', hi: 'आपके लिए सुझाव' },
  allLessons: { en: 'All Lessons', hi: 'सभी पाठ' },
  startLesson: { en: 'Start Lesson', hi: 'पाठ शुरू करें' },
  practiceGoal: { en: "Today's Goal", hi: 'आज का लक्ष्य' },
  freeForStudents: { en: 'Free for every Indian student', hi: 'हर भारतीय छात्र के लिए मुफ़्त' },
} as const;

export function t(key: keyof typeof labels, hindi = true): string {
  const item = labels[key];
  return hindi ? `${item.en} · ${item.hi}` : item.en;
}

export function navLabel(key: keyof typeof labels, hindi = true): string {
  const item = labels[key];
  if (!hindi) return item.en;
  return item.hi;
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

export const GRADES = [
  { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' },
  { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11' },
  { value: '12', label: 'Class 12' },
  { value: 'college', label: 'College / University' },
  { value: 'other', label: 'Other' },
];

export const BOARDS = ['CBSE', 'ICSE', 'State Board', 'Other'];

export const LEARNING_GOALS = [
  { value: 'school', label: 'School English / पाठ्यक्रम', desc: 'Class aur exam ke liye' },
  { value: 'spoken', label: 'Spoken English / बोलना', desc: 'Confidently baat karna' },
  { value: 'exam', label: 'Competitive Exams', desc: 'Interview, SSC, Banking' },
  { value: 'career', label: 'Career Growth', desc: 'Job aur professional life' },
];

export const LEVELS = [
  { value: 'beginner', label: 'Beginner / शुरुआती', desc: 'Abhi shuru kar rahe hain' },
  { value: 'intermediate', label: 'Intermediate / मध्यम', desc: 'Thoda English aata hai' },
  { value: 'advanced', label: 'Advanced / उन्नत', desc: 'Fluent hone ke paas' },
];
