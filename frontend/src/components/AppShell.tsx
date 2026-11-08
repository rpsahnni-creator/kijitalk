'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { FeatureIcon } from './FeatureIcon';
import { AccountGate } from './AccountGate';
import { useAuthStore, useSettingsStore } from '@/stores/useStore';
import { MOBILE_TABS, NAV_SECTIONS, featureLabel } from '@/lib/features';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BrandFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`relative overflow-hidden bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 ${className}`}>
      <span className="pointer-events-none absolute -bottom-8 -right-6 h-20 w-20 rounded-full bg-accent-400/90" />
      <span className="pointer-events-none absolute -left-4 -top-6 h-12 w-12 rounded-full bg-leaf-700" />
      <div className="relative flex flex-col items-center gap-1 px-4 py-3.5 text-sm text-white">
        <p>
          <span className="font-semibold text-accent-300">Design By:</span> Kiji Technology
        </p>
        <p className="text-xs text-white/80">
          <Link href="/privacy" className="hover:text-accent-300 hover:underline">Privacy Policy</Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-accent-300 hover:underline">Terms</Link>
        </p>
      </div>
    </footer>
  );
}

export function AppShell({
  children,
  footer = true,
}: {
  children: React.ReactNode;
  /** Full-height screens (chat) hide the footer so the composer stays on screen. */
  footer?: boolean;
}) {
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);
  const updateSettings = useAuthStore((s) => s.updateSettings);
  const { darkMode, setDarkMode } = useSettingsStore();
  const hindi = profile?.settings?.hindiLabels !== false;
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    updateSettings({ darkMode: next }).catch(() => {});
  };

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const initial = profile?.displayName?.trim()?.[0]?.toUpperCase() ?? 'K';
  const firstName = profile?.displayName?.split(' ')[0];
  const menuActive = !MOBILE_TABS.some((f) => isActive(pathname, f.href));

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex">
        <Link
          href="/dashboard"
          className="flex h-14 items-center gap-3 border-b-2 border-accent-400 bg-gradient-to-r from-brand-700 to-brand-600 px-5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 p-1">
            <Image src="/logo.png" alt="" width={36} height={36} className="h-full w-full object-contain" priority />
          </div>
          <div className="leading-tight">
            <span className="font-display text-lg font-bold text-white">KijiTalk</span>
            <p className="text-[10px] font-medium text-accent-300">English, bol ke seekho</p>
          </div>
        </Link>

        <nav className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4" aria-label="Main">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                      }`}
                    >
                      {active && <span className="absolute -left-3 top-2 h-6 w-1 rounded-r-full bg-brand-600" />}
                      <FeatureIcon name={item.icon} size={30} />
                      {featureLabel(item, hindi)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <Link
          href="/settings"
          className="flex items-center gap-3 border-t border-slate-200/80 px-5 py-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white ring-2 ring-accent-400">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{profile?.displayName ?? 'Learner'}</p>
            <p className="truncate text-xs text-slate-500">
              {profile?.grade ? (profile.grade === 'college' ? 'College' : `Class ${profile.grade}`) : 'Student'}
              {profile?.streak ? ` · 🔥 ${profile.streak}` : ''}
            </p>
          </div>
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b-2 border-accent-400 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-3 text-white shadow-md shadow-brand-900/20 sm:px-5">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/15 lg:hidden"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <Menu size={24} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 p-1">
              <Image src="/logo.png" alt="" width={32} height={32} className="h-full w-full object-contain" />
            </div>
            <span className="hidden font-display text-base font-bold min-[380px]:inline">KijiTalk</span>
          </Link>

          <p className="flex-1 truncate text-center font-display text-lg font-bold text-accent-300 lg:text-left">
            Welcome{firstName ? <span className="hidden sm:inline">, {firstName}</span> : null}
            <span className="hidden sm:inline"> 👋</span>
          </p>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/15"
            aria-label={darkMode ? 'Light mode' : 'Dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            href="/settings"
            aria-label="Profile and settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-700 ring-2 ring-accent-400"
          >
            {initial}
          </Link>
        </header>

        <main className="flex-1">
          {/* Settings stays reachable so a blocked learner can still download or delete their data. */}
          {isActive(pathname, '/settings') ? children : <AccountGate>{children}</AccountGate>}
        </main>

        {footer && <BrandFooter />}
      </div>

      {/* Mobile bottom tabs */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t-2 border-accent-400 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:bg-slate-950 lg:hidden"
        aria-label="Tabs"
      >
        {MOBILE_TABS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 pb-2 pt-1.5 text-[11px] font-semibold ${
                active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500'
              }`}
            >
              {active && <span className="absolute top-0 h-1 w-8 rounded-b-full bg-brand-600" />}
              <FeatureIcon name={item.icon} size={28} className={active ? '' : 'opacity-80 grayscale-[35%]'} />
              {featureLabel(item, hindi).split(' ')[0]}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className={`relative flex flex-1 flex-col items-center gap-0.5 pb-2 pt-1.5 text-[11px] font-semibold ${
            menuActive ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500'
          }`}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          {menuActive && <span className="absolute top-0 h-1 w-8 rounded-b-full bg-brand-600" />}
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-leaf-700 text-white">
            <Menu size={18} />
          </span>
          More
        </button>
      </nav>

      {/* Mobile menu sheet */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="All sections">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] animate-fade-up overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] dark:bg-slate-900">
            <div className="sticky top-0 flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-brand-700 to-brand-500 px-5 py-4 text-white">
              <p className="font-display text-lg font-bold text-accent-300">Sab kuch · Menu</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/15"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-4 py-4">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="mb-5">
                  <p className="mb-2 border-b-2 border-brand-200 pb-1 font-display text-base font-bold text-leaf-700 dark:border-brand-900 dark:text-leaf-400">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {section.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 text-center text-xs font-semibold transition ${
                            active
                              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200'
                              : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                        >
                          <FeatureIcon name={item.icon} size={44} />
                          {featureLabel(item, hindi)}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <BrandFooter />
          </div>
        </div>
      )}
    </div>
  );
}
