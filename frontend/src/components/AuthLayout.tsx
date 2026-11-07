'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { KikiAvatar } from './KikiAvatar';

const POINTS = [
  'Hindi mein bolo, English mein seekho',
  '500+ lessons — school, exams, daily life',
  'Pronunciation score aur daily streak',
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden gradient-hero p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 p-1.5 backdrop-blur">
            <Image src="/logo.png" alt="" width={44} height={44} className="h-full w-full object-contain" priority />
          </div>
          <span className="font-display text-xl font-bold">KijiTalk</span>
        </Link>

        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-tight">
            English bolne ka
            <br />
            <span className="text-accent-300">darr khatam.</span>
          </h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-brand-50">
                <CheckCircle2 size={18} className="shrink-0 text-accent-300" /> {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
          <KikiAvatar size="md" />
          <p className="text-sm text-brand-50">
            &ldquo;Namaste! Main Kiki hoon — aapki English practice partner. Chalo shuru karte hain!&rdquo;
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hero p-1.5">
              <Image src="/logo.png" alt="" width={40} height={40} className="h-full w-full object-contain" />
            </div>
            <span className="font-display text-lg font-bold">KijiTalk</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
          <p className="mb-8 mt-1 text-slate-500">{subtitle}</p>
          {children}
          <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>
          <p className="mt-10 text-center text-xs text-slate-400">
            <span className="font-semibold text-brand-600 dark:text-brand-400">Design By:</span> Kiji Technology
          </p>
        </div>
      </main>
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
      {message}
    </p>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
