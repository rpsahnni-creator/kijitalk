'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { authRequest } from '@/lib/api';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { useAuthStore } from '@/stores/useStore';

function VerifyEmail() {
  const token = useSearchParams().get('token') ?? '';
  const { user, refreshSession, syncProfile } = useAuthStore();
  const [state, setState] = useState<'working' | 'done' | 'error'>(token ? 'working' : 'error');
  const [message, setMessage] = useState(token ? '' : 'Verification link adhoora hai.');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    authRequest<{ message: string }>('/api/auth/email/verify/', { token })
      .then(async ({ message: msg }) => {
        setMessage(msg);
        setState('done');
        // Pick up the "verified" claim in a fresh access token.
        if (await refreshSession()) await syncProfile();
      })
      .catch((err) => {
        setMessage(getAuthErrorMessage(err, 'Email verify nahi ho paya.'));
        setState('error');
      });
  }, [token, refreshSession, syncProfile]);

  if (state === 'working') {
    return (
      <div className="flex flex-col items-center py-6 text-slate-500">
        <Loader2 className="mb-3 animate-spin text-brand-600" size={32} />
        Verify ho raha hai…
      </div>
    );
  }

  const ok = state === 'done';
  return (
    <div
      className={`rounded-2xl border p-5 text-center ${
        ok
          ? 'border-leaf-200 bg-leaf-50 dark:border-leaf-900 dark:bg-leaf-950/40'
          : 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30'
      }`}
    >
      {ok ? (
        <CheckCircle2 className="mx-auto mb-3 text-leaf-700 dark:text-leaf-400" size={36} />
      ) : (
        <XCircle className="mx-auto mb-3 text-red-500" size={36} />
      )}
      <p className="font-semibold text-slate-900 dark:text-white">{message}</p>
      <Link href={user ? '/dashboard' : '/login'} className="btn-primary mt-4 w-full">
        {user ? 'Dashboard par jao' : 'Sign in karo'}
      </Link>
      {!ok && user && (
        <Link href="/settings" className="mt-3 block text-sm font-medium text-brand-600 hover:underline">
          Settings se naya link mangwao
        </Link>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout title="Email verification" subtitle="Aapka email confirm kar rahe hain" footer={null}>
      <Suspense fallback={<Loader2 className="mx-auto animate-spin text-brand-600" />}>
        <VerifyEmail />
      </Suspense>
    </AuthLayout>
  );
}
