'use client';

import { KikiAvatar } from './KikiAvatar';

export function LoadingScreen({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900">
      <KikiAvatar size="lg" animated />
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:0.3s]" />
        <span className="ml-1">{label}</span>
      </div>
    </div>
  );
}
