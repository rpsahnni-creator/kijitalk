'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mic, MessageCircle, TrendingUp, Sparkles } from 'lucide-react';
import { KikiAvatar } from '@/components/KikiAvatar';
import { useAuthStore } from '@/stores/useStore';

export default function WelcomePage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && user) {
      router.replace('/dashboard');
    }
  }, [user, initialized, router]);

  const features = [
    { icon: MessageCircle, title: 'Chat with Kiki', desc: 'Hindi se English — Kiki translate karke sikhati hai' },
    { icon: Mic, title: 'Voice Practice', desc: 'Real-time pronunciation scoring' },
    { icon: TrendingUp, title: 'Track Progress', desc: 'Daily streak, score aur goal — roz practice karo' },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 p-2 backdrop-blur">
              <Image src="/logo.png" alt="KijiTalk" width={48} height={48} className="h-full w-full object-contain" priority />
            </div>
            <span className="text-2xl font-bold text-white">KijiTalk</span>
          </div>
          <Link href="/login" className="rounded-2xl bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30">
            Sign In
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur">
            <Sparkles size={16} />
            Free AI-powered English practice
          </div>
          <h1 className="mb-6 max-w-3xl text-5xl font-extrabold leading-tight text-white md:text-6xl">
            Bharat ke har student ke liye
            <br />
            <span className="text-accent-300">English Practice</span>
          </h1>
          <p className="mb-10 max-w-xl text-lg text-brand-50">
            Class 6 se college tak — Kiki se Hindi mein baat karo, English seekho. Bilkul free, koi bhi use kar sakta hai.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/signup" className="btn-primary bg-accent-400 text-brand-900 shadow-none hover:bg-accent-300">
              Get Started Free
            </Link>
            <Link href="/onboarding" className="rounded-2xl border-2 border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
              Take a Tour
            </Link>
          </div>
        </main>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-3xl bg-white/10 p-6 backdrop-blur">
              <Icon className="mb-3 text-accent-300" size={28} />
              <h3 className="mb-1 font-semibold text-white">{title}</h3>
              <p className="text-sm text-brand-50">{desc}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
