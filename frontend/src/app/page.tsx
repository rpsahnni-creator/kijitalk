'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Languages, Sparkles } from 'lucide-react';
import { KikiAvatar } from '@/components/KikiAvatar';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';
import { BrandFooter } from '@/components/AppShell';
import { useAuthStore } from '@/stores/useStore';

const FEATURES: Array<{ icon: FeatureIconName; title: string; desc: string }> = [
  { icon: 'chat', title: 'Chat with Kiki', desc: 'Hindi mein likho — Kiki English mein translate karke, galti sudhaar ke sikhati hai.' },
  { icon: 'voice', title: 'Pronunciation score', desc: 'Phrase bolo aur har word ka score pao. Roz thoda better.' },
  { icon: 'call', title: 'Voice call mode', desc: 'Kiki se phone jaisi baat — bina type kiye, sirf bolke practice.' },
  { icon: 'roleplay', title: 'Real-life roleplay', desc: 'Chai tapri, auto, interview, PTM — asli situations ki practice.' },
  { icon: 'lessons', title: '500+ lessons', desc: 'Class 6 se college tak — school, exams aur daily life ke liye.' },
  { icon: 'streak', title: 'Streaks & badges', desc: 'Daily goal, XP, leaderboard — practice ki aadat banao.' },
];

const STEPS = [
  { n: '1', title: 'Free account banao', desc: 'Sirf email — 30 second mein.' },
  { n: '2', title: 'Apni class chuno', desc: 'Kiki aapke level ke hisaab se lessons degi.' },
  { n: '3', title: 'Roz 15 min bolo', desc: 'Chat, voice ya roleplay — jo pasand ho.' },
];

function ChatPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-accent-400/20 blur-3xl" />
      <div className="relative rounded-3xl border border-white/20 bg-white p-4 text-slate-800 shadow-2xl shadow-brand-950/40">
        <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
          <KikiAvatar size="md" />
          <div>
            <p className="font-semibold">Kiki</p>
            <p className="text-xs text-success-600">● Online</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2.5 text-white">
            Mujhe kal interview dena hai
            <div className="mt-1.5 flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-xs">
              <Languages size={12} /> I have to give an interview tomorrow
            </div>
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5">
            Great! Let&apos;s practice. Tell me about yourself — start with &ldquo;My name is…&rdquo; 😊
          </div>
          <div className="max-w-[85%] rounded-xl border border-accent-200 bg-accent-50 px-3 py-2 text-xs text-slate-700">
            <span className="font-semibold text-accent-700">Tip:</span> &ldquo;give an interview&rdquo; → &ldquo;have an interview&rdquo; zyada natural hai.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    setDeleted(new URLSearchParams(window.location.search).get('deleted') === '1');
  }, []);

  useEffect(() => {
    if (initialized && user) router.replace('/dashboard');
  }, [user, initialized, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {deleted && (
        <div role="status" className="bg-leaf-700 px-4 py-2.5 text-center text-sm font-medium text-white">
          Aapka account aur data delete ho gaya. KijiTalk use karne ke liye shukriya 🙏
        </div>
      )}
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <header className="flex items-center justify-between py-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 p-1.5 backdrop-blur">
                <Image src="/logo.png" alt="" width={44} height={44} className="h-full w-full object-contain" priority />
              </div>
              <span className="font-display text-xl font-bold text-white">KijiTalk</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50 sm:inline-flex"
              >
                Get started
              </Link>
            </div>
          </header>

          <div className="grid items-center gap-12 pb-20 pt-8 lg:grid-cols-2 lg:pb-28 lg:pt-14">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur">
                <Sparkles size={14} className="text-accent-300" />
                Free AI-powered English practice
              </div>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
                Bharat ke har student ke liye
                <span className="mt-1 block text-accent-300">English Practice</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-brand-100 lg:mx-0">
                Class 6 se college tak — Kiki se Hindi mein baat karo, English seekho. Bilkul free, koi bhi use kar sakta hai.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-400 px-6 py-3.5 font-semibold text-brand-950 shadow-lg shadow-brand-950/30 transition hover:bg-accent-300"
                >
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
                >
                  Take a Tour
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-brand-100 lg:justify-start">
                {['No credit card', 'Hindi + English', 'Class 6 – College'].map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-accent-300" /> {p}
                  </span>
                ))}
              </div>
            </div>
            <ChatPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">Features</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Bolne ki practice, har tarah se</h2>
          <p className="mt-3 text-slate-500">Padhna kaafi nahi — English bolke aati hai. KijiTalk aapko roz bolne ka mauka deta hai.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="card card-interactive">
              <FeatureIcon name={icon} size={60} className="mb-3" />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-200/70 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">3 steps mein shuru</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-700 font-bold text-accent-300 ring-4 ring-leaf-100 dark:ring-leaf-950">{s.n}</span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl gradient-hero px-6 py-14 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <KikiAvatar size="xl" className="mx-auto mb-6" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Aaj se English bolna shuru karo</h2>
          <p className="mx-auto mt-3 max-w-md text-brand-100">Kiki aapka intezaar kar rahi hai. Free hai, aur hamesha rahega.</p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-800 shadow-lg transition hover:bg-brand-50"
          >
            Free account banao <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <div className="border-t border-slate-200/70 py-4 text-center text-xs text-slate-500 dark:border-slate-800">
        © {new Date().getFullYear()} KijiTalk · Made in India 🇮🇳
      </div>
      <BrandFooter />
    </div>
  );
}
