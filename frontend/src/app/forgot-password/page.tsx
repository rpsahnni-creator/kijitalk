'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import { AuthLayout, FormError } from '@/components/AuthLayout';
import { authRequest } from '@/lib/api';
import { getAuthErrorMessage } from '@/lib/authErrors';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const { message } = await authRequest<{ message: string }>('/api/auth/password/forgot/', { email: email.trim() });
      setSent(message);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Link nahi bhej paye. Dobara try karo.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout
      title="Password bhool gaye?"
      subtitle="Apna email daalo — hum reset ka link bhej denge"
      footer={
        <>
          Yaad aa gaya?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-5 text-center dark:border-leaf-900 dark:bg-leaf-950/40">
          <MailCheck className="mx-auto mb-3 text-leaf-700 dark:text-leaf-400" size={36} />
          <p className="font-semibold text-slate-900 dark:text-white">Inbox check karo</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{sent}</p>
          <p className="mt-3 text-xs text-slate-500">Link 1 ghante tak valid hai. Spam folder bhi dekh lena.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>
          <FormError message={error} />
          <button type="submit" disabled={sending} className="btn-primary w-full py-3">
            {sending && <Loader2 size={16} className="animate-spin" />}
            {sending ? 'Bhej rahe hain…' : 'Reset link bhejo'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
