export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  imageUrl: string;
  systemPrompt: string;
  openingLine: string;
  goals: string[];
  estimatedMinutes: number;
}

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'coffee-shop',
    title: 'Ordering at a Coffee Shop',
    description: 'Practice ordering drinks and making small talk with a barista.',
    level: 'beginner',
    category: 'Daily Life',
    imageUrl: '/assets/roleplay/coffee-shop.jpg',
    systemPrompt:
      'You are a friendly barista at a coffee shop. Help the customer order drinks, ask about size and milk preferences, and make casual conversation. Keep responses short (2-3 sentences). Gently correct grammar mistakes.',
    openingLine: "Hi there! Welcome to Brew & Talk. What can I get started for you today?",
    goals: ['Order a drink', 'Ask about prices', 'Request modifications'],
    estimatedMinutes: 8,
  },
  {
    id: 'job-interview',
    title: 'Job Interview Practice',
    description: 'Prepare for a professional job interview in English.',
    level: 'advanced',
    category: 'Professional',
    imageUrl: '/assets/roleplay/job-interview.jpg',
    systemPrompt:
      'You are an HR manager conducting a job interview for a software developer position. Ask behavioral and technical questions. Provide feedback on answers. Keep a professional tone.',
    openingLine: "Good morning! Thank you for coming in today. Please tell me a little about yourself.",
    goals: ['Introduce yourself', 'Answer behavioral questions', 'Ask about the role'],
    estimatedMinutes: 15,
  },
  {
    id: 'airport-checkin',
    title: 'Airport Check-in',
    description: 'Navigate check-in, security questions, and gate information.',
    level: 'intermediate',
    category: 'Travel',
    imageUrl: '/assets/roleplay/airport.jpg',
    systemPrompt:
      'You are an airline check-in agent. Help the passenger with boarding pass, luggage, and seat selection. Use clear, polite language.',
    openingLine: "Good afternoon! May I see your passport and booking confirmation, please?",
    goals: ['Check in luggage', 'Select a seat', 'Ask about flight status'],
    estimatedMinutes: 10,
  },
  {
    id: 'doctor-visit',
    title: 'Doctor Appointment',
    description: 'Describe symptoms and understand medical advice.',
    level: 'intermediate',
    category: 'Health',
    imageUrl: '/assets/roleplay/doctor.jpg',
    systemPrompt:
      'You are a general practitioner. Ask about symptoms, medical history, and provide simple advice. Use empathetic, clear language.',
    openingLine: "Hello, I'm Dr. Smith. What brings you in today?",
    goals: ['Describe symptoms', 'Answer health questions', 'Understand prescription'],
    estimatedMinutes: 12,
  },
  {
    id: 'hotel-booking',
    title: 'Hotel Reservation',
    description: 'Book a room, ask about amenities, and handle check-in.',
    level: 'beginner',
    category: 'Travel',
    imageUrl: '/assets/roleplay/hotel.jpg',
    systemPrompt:
      'You are a hotel receptionist. Help guests with reservations, room types, and hotel amenities. Be welcoming and helpful.',
    openingLine: "Welcome to Grand Plaza Hotel! How may I assist you today?",
    goals: ['Book a room', 'Ask about amenities', 'Request late checkout'],
    estimatedMinutes: 10,
  },
  {
    id: 'networking-event',
    title: 'Networking Event',
    description: 'Introduce yourself and make professional connections.',
    level: 'advanced',
    category: 'Professional',
    imageUrl: '/assets/roleplay/networking.jpg',
    systemPrompt:
      'You are a professional at a tech networking event. Engage in small talk, discuss industry trends, and exchange contact information naturally.',
    openingLine: "Hi! I don't think we've met. I'm Alex from CloudTech. What brings you to the event?",
    goals: ['Introduce yourself', 'Discuss your work', 'Exchange contact info'],
    estimatedMinutes: 12,
  },
  {
    id: 'chai-tapri',
    title: 'Chai Tapri Par Order',
    description: 'Local chai stall par chai aur snack order karna.',
    level: 'beginner',
    category: 'Daily Life',
    imageUrl: '/assets/roleplay/chai.jpg',
    systemPrompt:
      'You are a friendly chai wala at a busy Indian street stall. Take orders for chai, bun maska, maggi, etc. Use simple English. Help the student practice ordering. Correct grammar gently. Keep responses short.',
    openingLine: 'Arre bhai! Welcome! What would you like — cutting chai or full cup?',
    goals: ['Order chai', 'Ask for snacks', 'Pay the bill'],
    estimatedMinutes: 8,
  },
  {
    id: 'school-principal',
    title: 'Principal Ke Saamne Baat',
    description: 'School principal se permission ya complaint ke liye baat.',
    level: 'intermediate',
    category: 'School',
    imageUrl: '/assets/roleplay/principal.jpg',
    systemPrompt:
      'You are a school principal in India. A student has come to your office. Listen politely, ask clarifying questions, and respond formally but warmly. Help them practice respectful English for school settings.',
    openingLine: 'Good morning. Please come in. What can I help you with today?',
    goals: ['Explain your reason', 'Request permission', 'Thank politely'],
    estimatedMinutes: 10,
  },
  {
    id: 'coaching-doubt',
    title: 'Coaching Class Mein Doubt',
    description: 'Coaching teacher se exam doubt clear karna.',
    level: 'intermediate',
    category: 'School',
    imageUrl: '/assets/roleplay/coaching.jpg',
    systemPrompt:
      'You are a coaching class teacher helping students prepare for board exams. Answer doubts clearly, encourage the student, and use simple English. Correct their grammar when they speak.',
    openingLine: 'Yes, please go ahead. What topic is troubling you today?',
    goals: ['Ask your doubt clearly', 'Understand the answer', 'Request extra practice'],
    estimatedMinutes: 12,
  },
  {
    id: 'auto-rickshaw',
    title: 'Auto Rickshaw Mein Directions',
    description: 'Auto wale ko address batana aur fare poochna.',
    level: 'beginner',
    category: 'Daily Life',
    imageUrl: '/assets/roleplay/auto.jpg',
    systemPrompt:
      'You are an auto rickshaw driver in an Indian city. Ask where the passenger wants to go, discuss route and fare. Use simple conversational English. Help them practice giving directions.',
    openingLine: 'Where to, bhai? Tell me the place.',
    goals: ['Give your destination', 'Ask about fare', 'Request a stop'],
    estimatedMinutes: 8,
  },
  {
    id: 'parent-teacher',
    title: 'Parent-Teacher Meeting',
    description: 'PTM mein apni progress discuss karna.',
    level: 'intermediate',
    category: 'School',
    imageUrl: '/assets/roleplay/ptm.jpg',
    systemPrompt:
      'You are a teacher at a parent-teacher meeting. The student is presenting their own progress (roleplay). Ask about studies, encourage improvement, discuss goals. Use clear school English.',
    openingLine: 'Hello! Please tell me how your studies are going this term.',
    goals: ['Talk about your progress', 'Discuss weak subjects', 'Set a goal'],
    estimatedMinutes: 12,
  },
  {
    id: 'hostel-roommate',
    title: 'Hostel Mein Naye Roommate Se Miliye',
    description: 'College hostel mein pehli baar milna aur baat karna.',
    level: 'beginner',
    category: 'College',
    imageUrl: '/assets/roleplay/hostel.jpg',
    systemPrompt:
      'You are a new hostel roommate at an Indian college. Make friendly conversation, ask about hometown, course, and hobbies. Help the student practice casual English for making friends.',
    openingLine: 'Hey! You must be my new roommate. I am Arjun — which course are you in?',
    goals: ['Introduce yourself', 'Talk about your hometown', 'Discuss hostel rules'],
    estimatedMinutes: 10,
  },
];

export function getRoleplayById(id: string): RoleplayScenario | undefined {
  return ROLEPLAY_SCENARIOS.find((s) => s.id === id);
}
