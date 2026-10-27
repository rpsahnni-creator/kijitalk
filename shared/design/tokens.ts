/** Figma-ready design tokens — spec v1 */

export const colors = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#6366F1',
  secondary: '#10B981',
  accent: '#F59E0B',
  bg: '#FFFFFF',
  bgDark: '#0F172A',
  surface: '#F8FAFC',
  surfaceDark: '#1E293B',
  text: '#0F172A',
  textDark: '#F1F5F9',
  muted: '#64748B',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

export const typography = {
  heading1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  heading2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  heading3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
} as const;

export const modes = [
  { id: 'chat', label: 'Chat', labelHi: 'बातचीत' },
  { id: 'call', label: 'Call', labelHi: 'कॉल' },
  { id: 'voice', label: 'Voice', labelHi: 'आवाज़' },
  { id: 'roleplay', label: 'Roleplay', labelHi: 'अभिनय' },
  { id: 'lesson', label: 'Lessons', labelHi: 'पाठ' },
  { id: 'debate', label: 'Debate', labelHi: 'वाद-विवाद' },
  { id: 'course', label: 'Courses', labelHi: 'कोर्स' },
  { id: 'progress', label: 'Progress', labelHi: 'प्रगति' },
] as const;
