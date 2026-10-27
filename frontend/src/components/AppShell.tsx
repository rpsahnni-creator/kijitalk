'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageCircle,
  Mic,
  BookOpen,
  BarChart3,
  Settings,
  Users,
  Phone,
  Swords,
  GraduationCap,
} from 'lucide-react';
import { navLabel } from '@/lib/i18n';
import { useAuthStore } from '@/stores/useStore';

const navItems = [
  { href: '/dashboard', key: 'home' as const, icon: Home },
  { href: '/chat', key: 'chat' as const, icon: MessageCircle },
  { href: '/call', key: 'chat' as const, icon: Phone, label: 'Call' },
  { href: '/voice', key: 'voice' as const, icon: Mic },
  { href: '/roleplay', key: 'roleplay' as const, icon: Users },
  { href: '/debate', key: 'roleplay' as const, icon: Swords, label: 'Debate' },
  { href: '/courses', key: 'lessons' as const, icon: GraduationCap, label: 'Courses' },
  { href: '/lessons', key: 'lessons' as const, icon: BookOpen, label: 'Lessons' },
  { href: '/progress', key: 'progress' as const, icon: BarChart3 },
  { href: '/settings', key: 'settings' as const, icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useAuthStore();
  const hindi = profile?.settings?.hindiLabels !== false;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-hero text-lg font-bold text-white">
            K
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">KijiTalk</span>
            <p className="text-xs text-slate-400">India&apos;s English App · Free</p>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {navItems.map(({ href, key, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={20} />
                {label ?? navLabel(key, hindi)}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-slate-200 bg-white/90 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
        {[
          navItems[0],
          navItems[1],
          navItems[2],
          navItems[4],
          navItems[8],
        ].map(({ href, key, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
                active ? 'text-brand-600' : 'text-slate-500'
              }`}
            >
              <Icon size={20} />
              {label ?? navLabel(key, hindi).split(' ')[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
