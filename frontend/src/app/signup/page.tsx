'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { AuthLayout, FormError, OrDivider } from '@/components/AuthLayout';
import { isGoogleSignInConfigured } from '@/lib/google';
import { getAuthErrorMessage } from '@/lib/authErrors';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { user, initialized, signUp, signInWithGoogle, loading } = useAuthStore();
  const router = useRouter();
  // New accounts go to onboarding; only already-signed-in visitors skip to the dashboard.
  const signingUp = useRef(false);

  useEffect(() => {
    if (initialized && user && !signingUp.current) router.replace('/dashboard');
  }, [initialized, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Apna naam likho');
      return;
    }
    if (password.length < 8) {
      setError('Password kam se kam 8 characters ka hona chahiye');
      return;
    }
    signingUp.current = true;
    try {
      await signUp(email.trim(), password, name.trim());
      router.push('/onboarding/profile');
    } catch (err) {
      signingUp.current = false;
      setError(getAuthErrorMessage(err, 'Account nahi ban paya. Dobara try karo.'));
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    signingUp.current = true;
    try {
      await signInWithGoogle(idToken);
      router.push('/onboarding/profile');
    } catch (err) {
      signingUp.current = false;
      setError(getAuthErrorMessage(err));
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;

  return (
    <AuthLayout
      title="Free account banao"
      subtitle="Aaj se English bolna shuru karo — bilkul free"
      footer={
        <>
          Pehle se account hai?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Naam</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Your name"
            required
          />
        </div>
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
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
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
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {[1, 2, 3].map((lvl) => (
              <span
                key={lvl}
                className={`h-1 flex-1 rounded-full transition ${
                  strength >= lvl
                    ? strength === 1
                      ? 'bg-red-400'
                      : strength === 2
                      ? 'bg-accent-400'
                      : 'bg-success-500'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
        <FormError message={error} />
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Account ban raha hai…' : 'Create account'}
        </button>
        <p className="text-center text-xs text-slate-400">Account banne ke baad aapke email pe ek verification link aayega.</p>
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
