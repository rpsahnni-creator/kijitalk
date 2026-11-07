'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout, FormError } from '@/components/AuthLayout';
import { authRequest } from '@/lib/api';
import { getAuthErrorMessage } from '@/lib/authErrors';

function ResetPasswordForm() {
  const params = useSearchParams();
  const uid = params.get('uid') ?? '';
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  if (!uid || !token) {
    return (
      <div className="space-y-4 text-center">
        <FormError message="Yeh reset link adhoora hai. Email wala link poora kholo, ya naya link mangwao." />
        <Link href="/forgot-password" className="btn-primary w-full">Naya link mangwao</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password kam se kam 8 characters ka hona chahiye');
      return;
    }
    if (password !== confirm) {
      setError('Dono password match nahi kar rahe');
      return;
    }
    setSaving(true);
    try {
      const { message } = await authRequest<{ message: string }>('/api/auth/password/reset/', {
        uid,
        token,
        new_password: password,
      });
      setDone(message);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Password reset nahi ho paya.'));
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-5 text-center dark:border-leaf-900 dark:bg-leaf-950/40">
        <CheckCircle2 className="mx-auto mb-3 text-leaf-700 dark:text-leaf-400" size={36} />
        <p className="font-semibold text-slate-900 dark:text-white">{done}</p>
        <Link href="/login" className="btn-primary mt-4 w-full">Sign in karo</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="password" className="label">Naya password</label>
        <div className="relative">
          <input
            id="password"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field pr-11"
            placeholder="Min. 8 characters"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Password dobara likho</label>
        <input
          id="confirm"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input-field"
          required
        />
      </div>
      <FormError message={error} />
      <button type="submit" disabled={saving} className="btn-primary w-full py-3">
        {saving && <Loader2 size={16} className="animate-spin" />}
        {saving ? 'Save ho raha hai…' : 'Naya password set karo'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Naya password banao"
      subtitle="Aisa password chuno jo aapko yaad rahe, par dusre guess na kar sakein"
      footer={
        <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
          Sign in pe wapas jao
        </Link>
      }
    >
      <Suspense fallback={<Loader2 className="mx-auto animate-spin text-brand-600" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
