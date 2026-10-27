export interface PlanDef {
  id: 'free' | 'premium';
  name: string;
  /** AI-backed actions per day: chat/roleplay/debate messages + voice pronunciation checks combined. */
  dailyAiActions: number;
  claudeAccess: boolean;
  priceInr: number;
  priceLabel: string;
  features: string[];
}

export const PLANS: Record<'free' | 'premium', PlanDef> = {
  free: {
    id: 'free',
    name: 'Free',
    dailyAiActions: 30,
    claudeAccess: false,
    priceInr: 0,
    priceLabel: 'Free',
    features: [
      'Saare 511 lessons aur exercises',
      '30 AI practice messages/day (chat, roleplay, debate, voice)',
      'Gemini-powered Kiki tutor',
      'Progress tracking, badges, leaderboard',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    dailyAiActions: Infinity,
    claudeAccess: true,
    priceInr: 149,
    priceLabel: '₹149/month',
    features: [
      'Unlimited AI practice — koi daily limit nahi',
      'Claude-powered Premium tutor (behtar, zyada natural)',
      'Saare Free features',
    ],
  },
};

export function getPlan(tier: 'free' | 'premium'): PlanDef {
  return PLANS[tier];
}
