'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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
  Crown,
  LayoutGrid,
  X,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { navLabel } from '@/lib/i18n';
import { useAuthStore, useSettingsStore } from '@/stores/useStore';

interface NavItem {
  href: string;
  key: 'home' | 'chat' | 'voice' | 'roleplay' | 'lessons' | 'progress' | 'settings';
  icon: LucideIcon;
  label?: string;
}

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', key: 'home', icon: Home },
      { href: '/progress', key: 'progress', icon: BarChart3 },
    ],
  },
  {
    title: 'Practice',
    items: [
      { href: '/chat', key: 'chat', icon: MessageCircle },
      { href: '/call', key: 'chat', icon: Phone, label: 'Call Kiki' },
      { href: '/voice', key: 'voice', icon: Mic },
      { href: '/roleplay', key: 'roleplay', icon: Users },
      { href: '/debate', key: 'roleplay', icon: Swords, label: 'Debate' },
    ],
  },
  {
    title: 'Learn',
    items: [
      { href: '/lessons', key: 'lessons', icon: BookOpen, label: 'Lessons' },
      { href: '/courses', key: 'lessons', icon: GraduationCap, label: 'Courses' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/pricing', key: 'settings', icon: Crown, label: 'Premium' },
      { href: '/settings', key: 'settings', icon: Settings },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
const MOBILE_TABS = ['/dashboard', '/chat', '/lessons', '/progress'];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemLabel(item: NavItem, hindi: boolean) {
  return item.label ?? navLabel(item.key, hindi);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const { darkMode, setDarkMode } = useSettingsStore();
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    updateSettings({ darkMode: next }).catch(() => {});
  };
  const hindi = profile?.settings?.hindiLabels !== false;
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const initial = profile?.displayName?.trim()?.[0]?.toUpperCase() ?? 'K';
  const moreActive = !MOBILE_TABS.some((href) => isActive(pathname, href));

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 px-5 pb-6 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hero p-1.5 shadow-sm">
            <Image src="/logo.png" alt="" width={40} height={40} className="h-full w-full object-contain" priority />
          </div>
          <div className="leading-tight">
            <span className="font-display text-lg font-bold text-slate-900 dark:text-white">KijiTalk</span>
            <p className="text-[11px] font-medium text-slate-400">English, bol ke seekho</p>
          </div>
        </Link>

        <nav className="no-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4" aria-label="Main">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {active && <span className="absolute -left-3 top-1.5 h-6 w-1 rounded-r-full bg-brand-600" />}
                      <Icon size={18} className={active ? '' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                      {itemLabel(item, hindi)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Link href="/settings" className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-hero text-sm font-bold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {profile?.displayName ?? 'Learner'}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {profile?.grade ? (profile.grade === 'college' ? 'College' : `Class ${profile.grade}`) : 'Student'}
                  {profile?.streak ? ` · 🔥 ${profile.streak}` : ''}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="btn-ghost h-9 w-9 shrink-0 p-0"
              aria-label={darkMode ? 'Light mode' : 'Dark mode'}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/85 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-hero p-1">
              <Image src="/logo.png" alt="" width={32} height={32} className="h-full w-full object-contain" />
            </div>
            <span className="font-display text-base font-bold">KijiTalk</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="btn-ghost h-9 w-9 p-0"
              aria-label={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex h-8 w-8 items-center justify-center rounded-full gradient-hero text-xs font-bold text-white"
            >
              {initial}
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tabs */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-slate-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/90 lg:hidden"
        aria-label="Tabs"
      >
        {MOBILE_TABS.map((href) => {
          const item = ALL_ITEMS.find((i) => i.href === href)!;
          const active = isActive(pathname, href);
          const Icon = item.icon;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {itemLabel(item, hindi).split(' ')[0]}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
            moreActive ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500'
          }`}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <LayoutGrid size={20} />
          More
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="All sections">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] animate-fade-up overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg font-bold">Sab kuch</p>
              <button type="button" onClick={() => setMoreOpen(false)} className="btn-ghost h-9 w-9 p-0" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-xs font-medium transition ${
                          active
                            ? 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-200'
                            : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Icon size={20} />
                        {itemLabel(item, hindi)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
