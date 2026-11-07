'use client';

import { useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, MailWarning } from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { getAuthErrorMessage } from '@/lib/authErrors';

/** Email verification status and password change, backed by auth-service. */
export function SecuritySection() {
  const { account, changePassword, resendVerification } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [resend, setResend] = useState<{ busy: boolean; text: string }>({ busy: false, text: '' });

  const hasPassword = account?.hasPassword !== false;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < 8) {
      setMessage({ ok: false, text: 'Naya password kam se kam 8 characters ka ho.' });
      return;
    }
    if (newPassword !== confirm) {
      setMessage({ ok: false, text: 'Dono naye password match nahi kar rahe.' });
      return;
    }
    setBusy(true);
    try {
      const text = await changePassword(oldPassword, newPassword);
      setMessage({ ok: true, text });
      setOldPassword('');
      setNewPassword('');
      setConfirm('');
      setOpen(false);
    } catch (err) {
      setMessage({ ok: false, text: getAuthErrorMessage(err, 'Password nahi badal paya.') });
    } finally {
      setBusy(false);
    }
  };

  const sendLink = async () => {
    setResend({ busy: true, text: '' });
    try {
      setResend({ busy: false, text: await resendVerification() });
    } catch (err) {
      setResend({ busy: false, text: getAuthErrorMessage(err, 'Link nahi bhej paye.') });
    }
  };

  return (
    <>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Security</h2>
      <div className="card mb-6 divide-y divide-slate-100 p-0 dark:divide-slate-800">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                account?.emailVerified
                  ? 'bg-leaf-50 text-leaf-700 dark:bg-leaf-950/50 dark:text-leaf-400'
                  : 'bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-300'
              }`}
            >
              {account?.emailVerified ? <CheckCircle2 size={18} /> : <MailWarning size={18} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{account?.emailVerified ? 'Email verified' : 'Email verify nahi hua'}</p>
              <p className="truncate text-xs text-slate-500">{resend.text || account?.email}</p>
            </div>
          </div>
          {!account?.emailVerified && (
            <button type="button" onClick={sendLink} disabled={resend.busy} className="btn-secondary shrink-0 px-3 py-2">
              {resend.busy ? <Loader2 size={14} className="animate-spin" /> : 'Link bhejo'}
            </button>
          )}
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <KeyRound size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">{hasPassword ? 'Password badlo' : 'Password set karo'}</p>
                <p className="text-xs text-slate-500">Badalne pe baaki sab devices se logout ho jayega</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen((v) => !v)} className="btn-secondary shrink-0 px-3 py-2">
              {open ? 'Cancel' : 'Badlo'}
            </button>
          </div>

          {message && (
            <p
              role="status"
              className={`mt-3 rounded-xl px-3 py-2 text-sm ${
                message.ok
                  ? 'bg-leaf-50 text-leaf-800 dark:bg-leaf-950/40 dark:text-leaf-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
              }`}
            >
              {message.text}
            </p>
          )}

          {open && (
            <form onSubmit={submit} className="mt-4 space-y-3">
              {hasPassword && (
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Purana password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="input-field"
                  aria-label="Current password"
                  required
                />
              )}
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Naya password (min. 8)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                aria-label="New password"
                required
                minLength={8}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Naya password dobara"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field"
                aria-label="Confirm new password"
                required
              />
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy && <Loader2 size={16} className="animate-spin" />}
                {busy ? 'Save ho raha hai…' : 'Password save karo'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
