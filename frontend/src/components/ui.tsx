'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { FeatureIcon, type FeatureIconName } from './FeatureIcon';

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  feature,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: LucideIcon;
  /** Illustrated feature icon shown beside the title. */
  feature?: FeatureIconName;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-4">
        {feature ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <FeatureIcon name={feature} size={44} />
          </div>
        ) : (
          Icon && (
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-900 sm:flex">
              <Icon size={22} />
            </div>
          )
        )}
        <div>
          {eyebrow && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-14'}`}>
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Icon size={22} />
        </div>
      )}
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = 'Kuch gadbad ho gayi. Internet check karke dobara try karo.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card flex flex-col items-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/40">
        <AlertTriangle size={22} />
      </div>
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          <RotateCcw size={16} /> Dobara try karo
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800 ${className}`} />;
}

export function SkeletonList({ rows = 4, className = 'h-20' }: { rows?: number; className?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

export function SegmentedEngine({
  engine,
  onChange,
}: {
  engine: 'gemini' | 'claude';
  onChange: (engine: 'gemini' | 'claude') => void;
}) {
  return (
    <div className="flex shrink-0 rounded-full border border-slate-200 bg-slate-100 p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
      {(['gemini', 'claude'] as const).map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          className={`rounded-full px-3 py-1.5 font-semibold transition ${
            engine === e
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {e === 'gemini' ? 'Free' : '✨ Premium'}
        </button>
      ))}
    </div>
  );
}

/** Section heading in the home-grid style: DarkGreen title with a crimson underline. */
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex-1">
        <h2 className="font-display text-xl font-bold text-leaf-700 dark:text-leaf-400">{children}</h2>
        <div className="mt-1 h-[3px] rounded-full bg-gradient-to-r from-brand-600 via-brand-300 to-transparent" />
      </div>
      {action}
    </div>
  );
}

/** Illustrated icon + label tile, with an optional count badge. */
export function FeatureTile({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: FeatureIconName;
  label: string;
  badge?: number | string | null;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-2 rounded-2xl px-1 py-3 text-center transition hover:bg-white hover:shadow-card dark:hover:bg-slate-900"
    >
      {badge !== undefined && badge !== null && badge !== 0 && (
        <span className="absolute left-1/2 top-1 z-10 -translate-x-[150%] rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow ring-2 ring-white dark:ring-slate-950">
          {badge}
        </span>
      )}
      <FeatureIcon name={icon} size={56} className="transition duration-200 group-hover:-translate-y-1 group-hover:scale-105" />
      <span className="text-[13px] font-semibold leading-tight text-slate-800 dark:text-slate-200">{label}</span>
    </Link>
  );
}
