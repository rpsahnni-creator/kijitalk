import type { FeatureIconName } from '@/components/FeatureIcon';

export interface Feature {
  href: string;
  label: string;
  hindi: string;
  icon: FeatureIconName;
}

export interface FeatureSection {
  title: string;
  hindi: string;
  items: Feature[];
}

export const FEATURES = {
  home: { href: '/dashboard', label: 'Home', hindi: 'होम', icon: 'home' },
  chat: { href: '/chat', label: 'Kiki Chat', hindi: 'Kiki से बात', icon: 'chat' },
  call: { href: '/call', label: 'Call Kiki', hindi: 'कॉल', icon: 'call' },
  voice: { href: '/voice', label: 'Voice', hindi: 'आवाज़', icon: 'voice' },
  roleplay: { href: '/roleplay', label: 'Roleplay', hindi: 'अभिनय', icon: 'roleplay' },
  debate: { href: '/debate', label: 'Debate', hindi: 'बहस', icon: 'debate' },
  lessons: { href: '/lessons', label: 'Lessons', hindi: 'पाठ', icon: 'lessons' },
  courses: { href: '/courses', label: 'Courses', hindi: 'कोर्स', icon: 'courses' },
  progress: { href: '/progress', label: 'Progress', hindi: 'प्रगति', icon: 'progress' },
  premium: { href: '/pricing', label: 'Premium', hindi: 'प्रीमियम', icon: 'premium' },
  settings: { href: '/settings', label: 'Settings', hindi: 'सेटिंग', icon: 'settings' },
} satisfies Record<string, Feature>;

/** Sidebar / menu grouping. */
export const NAV_SECTIONS: FeatureSection[] = [
  { title: 'Overview', hindi: 'ओवरव्यू', items: [FEATURES.home, FEATURES.progress] },
  {
    title: 'Practice',
    hindi: 'प्रैक्टिस',
    items: [FEATURES.chat, FEATURES.call, FEATURES.voice, FEATURES.roleplay, FEATURES.debate],
  },
  { title: 'Learn', hindi: 'सीखो', items: [FEATURES.lessons, FEATURES.courses] },
  { title: 'Account', hindi: 'अकाउंट', items: [FEATURES.premium, FEATURES.settings] },
];

export const MOBILE_TABS: Feature[] = [FEATURES.home, FEATURES.chat, FEATURES.lessons, FEATURES.progress];

export function featureLabel(f: Feature, hindi: boolean) {
  return hindi ? f.hindi : f.label;
}
