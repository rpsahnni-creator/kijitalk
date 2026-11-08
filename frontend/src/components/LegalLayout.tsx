import Image from 'next/image';
import Link from 'next/link';
import { BrandFooter } from './AppShell';
import { LEGAL, isPlaceholder } from '@/lib/legal';

/** Renders a business detail; unfilled "[…]" placeholders are highlighted. */
export function L({ value }: { value: string }) {
  return isPlaceholder(value) ? (
    <mark className="rounded bg-accent-200 px-1 text-slate-900">{value}</mark>
  ) : (
    <>{value}</>
  );
}

export function LegalLayout({
  title,
  summary,
  children,
}: {
  title: string;
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b-2 border-accent-400 bg-gradient-to-r from-brand-700 to-brand-500">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 p-1">
              <Image src="/logo.png" alt="" width={32} height={32} className="h-full w-full object-contain" />
            </div>
            <span className="font-display font-bold">KijiTalk</span>
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-white/90">
            <Link href="/privacy" className="hover:text-accent-300">Privacy</Link>
            <Link href="/terms" className="hover:text-accent-300">Terms</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Effective {LEGAL.effectiveDate} · Version {LEGAL.version}
        </p>

        <div className="mt-6 rounded-2xl border-2 border-leaf-200 bg-leaf-50 p-5 text-sm leading-relaxed text-slate-700 dark:border-leaf-900 dark:bg-leaf-950/30 dark:text-slate-200">
          <p className="mb-1 font-semibold text-leaf-700 dark:text-leaf-400">Short mein · आसान भाषा में</p>
          {summary}
        </div>

        <article className="legal mt-8 space-y-6 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {children}
        </article>
      </main>

      <BrandFooter />
    </div>
  );
}

export function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-20" id={`s${n}`}>
      <h2 className="mb-2 font-display text-lg font-bold text-leaf-700 dark:text-leaf-400">
        {n}. {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
