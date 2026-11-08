'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, MailCheck, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { FeatureIcon } from './FeatureIcon';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10">
      <div className="card w-full">{children}</div>
    </div>
  );
}

/** Asks for the Terms and age-group once (DPDP Act 2023). */
export function AgeAndTermsForm({
  submitLabel = 'Aage badho',
  onSubmit,
}: {
  submitLabel?: string;
  onSubmit: (input: { isMinor: boolean; parentEmail?: string }) => Promise<void>;
}) {
  const [isMinor, setIsMinor] = useState<boolean | null>(null);
  const [parentEmail, setParentEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isMinor === null) return setError('Apni umar ka group chuno.');
    if (isMinor && !parentEmail.trim()) return setError('Parent ya guardian ka email likho.');
    if (!accepted) return setError('Terms aur Privacy Policy accept karo.');
    setBusy(true);
    try {
      await onSubmit({ isMinor, parentEmail: isMinor ? parentEmail.trim() : undefined });
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Save nahi ho paya. Dobara try karo.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset>
        <legend className="label">Aapki umar</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: false, label: '18 ya usse zyada' },
            { v: true, label: '18 se kam' },
          ].map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setIsMinor(v)}
              aria-pressed={isMinor === v}
              className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
                isMinor === v
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-200'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {isMinor && (
        <div className="rounded-xl bg-accent-50 p-3 dark:bg-accent-950/30">
          <label htmlFor="parent-email" className="label">Parent / guardian ka email</label>
          <input
            id="parent-email"
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            className="input-field"
            placeholder="parent@example.com"
            required
          />
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            Hum unhe ek email bhejenge. Unki permission ke baad hi aap KijiTalk use kar paoge — yeh kanoon (DPDP Act
            2023) ke hisaab se zaroori hai.
          </p>
        </div>
      )}

      <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand-600"
        />
        <span>
          Maine{' '}
          <Link href="/terms" target="_blank" className="font-semibold text-brand-600 underline">Terms</Link> aur{' '}
          <Link href="/privacy" target="_blank" className="font-semibold text-brand-600 underline">Privacy Policy</Link>{' '}
          padh li hai aur accept karta/karti hoon.
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full py-3">
        {busy && <Loader2 size={16} className="animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}

function SignOutLink() {
  const signOut = useAuthStore((s) => s.signOut);
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        void signOut();
        router.push('/');
      }}
      className="btn-ghost mx-auto mt-4 flex"
    >
      <LogOut size={16} /> Sign out
    </button>
  );
}

function ParentPending() {
  const { account, resendParentConsent } = useAuthStore();
  const [changing, setChanging] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const send = async () => {
    setBusy(true);
    setNote('');
    try {
      setNote(await resendParentConsent(changing ? email.trim() : undefined));
      setChanging(false);
    } catch (err) {
      setNote(getAuthErrorMessage(err, 'Email nahi bhej paye.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="text-center">
        <MailCheck className="mx-auto mb-3 text-brand-600" size={40} />
        <h1 className="font-display text-xl font-bold">Parent ki permission ka intezaar</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Humne <strong>{account?.parentEmail}</strong> pe ek email bheja hai. Jaise hi aapke parent permission denge,
          KijiTalk khul jayega. Unse kaho inbox (aur spam folder) check karein.
        </p>
      </div>
      {changing && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Parent ka sahi email"
          className="input-field mt-4"
          aria-label="Parent email"
        />
      )}
      {note && <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">{note}</p>}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={send} disabled={busy || (changing && !email.trim())} className="btn-primary flex-1">
          {busy && <Loader2 size={16} className="animate-spin" />}
          {changing ? 'Naye email pe bhejo' : 'Email dobara bhejo'}
        </button>
        <button type="button" onClick={() => setChanging((v) => !v)} className="btn-secondary flex-1">
          {changing ? 'Cancel' : 'Email badlo'}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">
        Permission milne ke baad yeh page refresh karo.{' '}
        <Link href="/privacy" className="underline">Hum kya data rakhte hain?</Link>
      </p>
      <SignOutLink />
    </Card>
  );
}

function ParentDenied() {
  return (
    <Card>
      <div className="text-center">
        <ShieldAlert className="mx-auto mb-3 text-brand-600" size={40} />
        <h1 className="font-display text-xl font-bold">Parent ne permission nahi di</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Isliye yeh account KijiTalk use nahi kar sakta. Agar yeh galti se hua hai, to apne parent se email wala link
          dobara kholne ko kaho. Aap chaho to <Link href="/settings" className="font-semibold underline">Settings</Link> se
          apna data download ya account delete kar sakte ho.
        </p>
      </div>
      <SignOutLink />
    </Card>
  );
}

function Setup() {
  const completeSetup = useAuthStore((s) => s.completeSetup);
  return (
    <Card>
      <div className="mb-5 flex items-center gap-3">
        <FeatureIcon name="profile" size={48} />
        <div>
          <h1 className="font-display text-xl font-bold">Ek chhota sa step</h1>
          <p className="text-sm text-slate-500">Aage badhne se pehle yeh batao — sirf ek baar.</p>
        </div>
      </div>
      <AgeAndTermsForm onSubmit={completeSetup} />
      <p className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500">
        <ShieldCheck size={14} /> Aapka data safe hai — hum use bechte nahi.
      </p>
      <SignOutLink />
    </Card>
  );
}

/** Blocks the app until the account is allowed to use it. */
export function AccountGate({ children }: { children: React.ReactNode }) {
  const gate = useAuthStore((s) => s.account?.gate);
  if (gate === 'setup') return <Setup />;
  if (gate === 'parent_pending') return <ParentPending />;
  if (gate === 'parent_denied') return <ParentDenied />;
  return <>{children}</>;
}
