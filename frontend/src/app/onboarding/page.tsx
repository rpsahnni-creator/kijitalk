'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const slides = [
  {
    title: 'Kiki se English Seekho',
    description: 'Hindi mein bolo ya likho — Kiki turant English mein translate karke sikhayegi. Poore Bharat ke students ke liye free!',
    emoji: '💬',
    gradient: 'from-brand-500 to-accent-500',
  },
  {
    title: 'School & Daily Life Practice',
    description: 'Class introduction, teacher se baat, railway station, bazaar — real Indian situations mein practice karo.',
    emoji: '🏫',
    gradient: 'from-accent-500 to-accent-600',
  },
  {
    title: 'Bol kar Seekho · Track karo',
    description: 'Mic se bolo, pronunciation score pao, daily streak banao — roz thoda practice, bahut aage badho!',
    emoji: '🎤',
    gradient: 'from-brand-500 to-brand-600',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const slide = slides[step];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <div className={`mx-6 mt-8 flex flex-1 flex-col items-center justify-center rounded-3xl bg-gradient-to-br ${slide.gradient} p-8 text-center text-white`}>
        <span className="mb-6 text-7xl">{slide.emoji}</span>
        <h1 className="mb-4 text-3xl font-bold">{slide.title}</h1>
        <p className="max-w-sm text-lg text-white/90">{slide.description}</p>
      </div>

      <div className="p-6">
        <div className="mb-6 flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-brand-600' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary flex-1">
              <ChevronLeft size={20} /> Back
            </button>
          )}
          {step < slides.length - 1 ? (
            <button type="button" onClick={() => setStep(step + 1)} className="btn-primary flex-1">
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <Link href="/signup" className="btn-primary flex-1">
              Free shuru karo <ChevronRight size={20} />
            </Link>
          )}
        </div>

        <button type="button" onClick={() => router.push('/signup')} className="mt-4 w-full text-center text-sm text-slate-500">
          Skip · seedha signup
        </button>
      </div>
    </div>
  );
}
