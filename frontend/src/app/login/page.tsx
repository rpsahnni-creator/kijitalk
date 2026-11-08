'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { AuthLayout, FormError, OrDivider } from '@/components/AuthLayout';
import { isGoogleSignInConfigured } from '@/lib/google';
import { getAuthErrorMessage } from '@/lib/authErrors';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { user, initialized, signIn, signInWithGoogle, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (initialized && user) router.replace('/dashboard');
  }, [initialized, user, router]);

  // Sent here because an admin suspended the account mid-session.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('suspended') === '1') {
      setError('Aapka account suspend kar diya gaya hai. Madad ke liye support se baat karo.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signIn(email.trim(), password);
      router.push('/dashboard');
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Invalid email or password'));
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    try {
      await signInWithGoogle(idToken);
      router.push('/dashboard');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in karke practice continue karo"
      footer={
        <>
          Account nahi hai?{' '}
          <Link href="/signup" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Free sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot-password" className="mb-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
              Password bhool gaye?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-11"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <FormError message={error} />
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {isGoogleSignInConfigured() && (
        <>
          <OrDivider />
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </>
      )}
    </AuthLayout>
  );
}
