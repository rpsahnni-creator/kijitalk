'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { AuthLayout, FormError } from '@/components/AuthLayout';
import { authRequest } from '@/lib/api';
import { getAuthErrorMessage } from '@/lib/authErrors';

interface ConsentRequest {
  learnerName: string;
  learnerEmail: string;
  parentEmail: string;
  status: 'pending' | 'granted' | 'denied' | 'not_required';
  decidedAt: string | null;
}

const DATA_POINTS = [
  'Naam, email, aur class/board/state',
  'Lessons ki progress, score aur streak',
  'AI tutor (Kiki) ke saath chat aur voice practice ke text messages',
];

function ParentConsent() {
  const token = useSearchParams().get('token') ?? '';
  const [request, setRequest] = useState<ConsentRequest | null>(null);
  const [loadError, setLoadError] = useState(token ? '' : 'Link adhoora hai. Email wala poora link kholo.');
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<'grant' | 'deny' | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    authRequest<ConsentRequest>(`/api/auth/parent-consent/?token=${encodeURIComponent(token)}`)
      .then(setRequest)
      .catch((err) => setLoadError(getAuthErrorMessage(err, 'Link khul nahi paya.')));
  }, [token]);

  const decide = async (decision: 'grant' | 'deny') => {
    setError('');
    if (decision === 'grant' && (!name.trim() || !confirm)) {
      setError('Apna naam likho aur confirm karo ki aap parent/guardian ho.');
      return;
    }
    setBusy(decision);
    try {
      setDone(
        await authRequest('/api/auth/parent-consent/', {
          token,
          decision,
          parent_name: name.trim(),
          confirm_guardian: confirm,
        })
      );
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Faisla save nahi ho paya.'));
    } finally {
      setBusy(null);
    }
  };

  if (loadError) return <FormError message={loadError} />;
  if (!request) return <Loader2 className="mx-auto animate-spin text-brand-600" />;

  if (done) {
    const granted = done.status === 'granted';
    return (
      <div className={`rounded-2xl border p-5 text-center ${granted ? 'border-leaf-200 bg-leaf-50 dark:bg-leaf-950/40' : 'border-slate-200 bg-slate-50 dark:bg-slate-900'}`}>
        {granted ? (
          <CheckCircle2 className="mx-auto mb-3 text-leaf-700" size={36} />
        ) : (
          <XCircle className="mx-auto mb-3 text-slate-500" size={36} />
        )}
        <p className="font-semibold text-slate-900 dark:text-white">{done.message}</p>
        <p className="mt-2 text-xs text-slate-500">Confirmation email aapko bhej diya gaya hai. Aap usi email se faisla badal bhi sakte ho.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p>
          <strong>{request.learnerName}</strong> ({request.learnerEmail}) ne KijiTalk pe account banaya hai aur aapko
          parent/guardian bataya hai.
        </p>
        {request.status !== 'pending' && (
          <p className="mt-2 rounded-lg bg-accent-50 px-3 py-2 text-xs dark:bg-accent-950/30">
            Pichla faisla: <strong>{request.status === 'granted' ? 'Permission di' : 'Permission nahi di'}</strong>. Aap
            neeche se badal sakte ho.
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Permission dene pe hum yeh data use karenge — sirf English sikhane ke liye:</p>
        <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          {DATA_POINTS.map((d) => (
            <li key={d} className="flex gap-2">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-leaf-700" /> {d}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Hum bachchon ka data advertising, tracking ya profiling ke liye kabhi use nahi karte. AI replies ke liye
          messages Google/Anthropic ke AI tak jaate hain.{' '}
          <Link href="/privacy" target="_blank" className="font-semibold text-brand-600 underline">Poori Privacy Policy</Link>
        </p>
      </div>

      <div>
        <label htmlFor="parent-name" className="label">Aapka poora naam</label>
        <input id="parent-name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Jaise: Sunita Sharma" />
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
        <span>Main confirm karta/karti hoon ki main {request.learnerName} ka parent ya legal guardian hoon, aur maine Terms aur Privacy Policy padh li hai.</span>
      </label>

      <FormError message={error} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => decide('grant')} disabled={busy !== null} className="btn-primary flex-1 py-3">
          {busy === 'grant' && <Loader2 size={16} className="animate-spin" />} Haan, permission deta/deti hoon
        </button>
        <button type="button" onClick={() => decide('deny')} disabled={busy !== null} className="btn-secondary flex-1 py-3">
          {busy === 'deny' && <Loader2 size={16} className="animate-spin" />} Nahi
        </button>
      </div>
    </div>
  );
}

export default function ParentConsentPage() {
  return (
    <AuthLayout
      title="Parent ki permission"
      subtitle="Aapke bachche ne KijiTalk pe English practice ke liye account banaya hai"
      footer={<Link href="/privacy" className="font-semibold text-brand-600 hover:underline">Privacy Policy</Link>}
    >
      <Suspense fallback={<Loader2 className="mx-auto animate-spin text-brand-600" />}>
        <ParentConsent />
      </Suspense>
    </AuthLayout>
  );
}
