'use client';

import { useState } from 'react';
import { Loader2, MailWarning, X } from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { getAuthErrorMessage } from '@/lib/authErrors';

export function EmailVerifyBanner() {
  const { account, resendVerification } = useAuthStore();
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  if (!account || account.emailVerified || hidden) return null;

  const send = async () => {
    setBusy(true);
    try {
      setNote(await resendVerification());
    } catch (err) {
      setNote(getAuthErrorMessage(err, 'Link nahi bhej paye.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-accent-300 bg-accent-50 px-4 py-3 dark:border-accent-800 dark:bg-accent-950/30">
      <MailWarning className="mt-0.5 shrink-0 text-brand-600" size={20} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Apna email verify karo</p>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {note || `${account.email} pe link bheja gaya hai. Verify karne se password reset aur account safe rehta hai.`}
        </p>
      </div>
      <button type="button" onClick={send} disabled={busy} className="btn-primary shrink-0 px-3 py-1.5 text-xs">
        {busy ? <Loader2 size={14} className="animate-spin" /> : 'Link dobara bhejo'}
      </button>
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
