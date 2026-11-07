'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Check, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorState } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, ApiError } from '@/lib/api';

interface PlanDef {
  id: 'free' | 'premium';
  name: string;
  priceLabel: string;
  features: string[];
}

interface SubscriptionStatus {
  tier: 'free' | 'premium';
  expiresAt: string | null;
  paymentsEnabled: boolean;
  plans: Record<'free' | 'premium', PlanDef>;
}

interface CheckoutOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  name: string;
  description: string;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function PricingPage() {
  const router = useRouter();
  const { user, token, profile, initialized, syncProfile } = useAuthStore();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  const [loadError, setLoadError] = useState(false);

  const loadStatus = useCallback(() => {
    if (!token) return;
    setLoadError(false);
    api
      .get<SubscriptionStatus>('/api/subscription/status', token)
      .then(setStatus)
      .catch(() => setLoadError(true));
  }, [token]);

  useEffect(loadStatus, [loadStatus]);

  const upgrade = async () => {
    if (!token || !scriptReady) return;
    setMessage('');
    setPaying(true);
    try {
      const order = await api.post<CheckoutOrder>('/api/subscription/checkout', {}, token);
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: { name: profile?.displayName, email: profile?.email },
        theme: { color: '#dc143c' },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            await api.post('/api/subscription/verify', response, token);
            setMessage('Premium activate ho gaya! Unlimited practice ka maza lo. 🎉');
            const updated = await api.get<SubscriptionStatus>('/api/subscription/status', token);
            setStatus(updated);
            await syncProfile();
          } catch {
            setMessage('Payment ho gaya, lekin activate nahi ho paya. Thodi der mein phir try karo.');
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Checkout start nahi ho saka. Try again.');
      setPaying(false);
    }
  };

  if (loadError) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <ErrorState message="Plans load nahi ho paye." onRetry={loadStatus} />
        </div>
      </AppShell>
    );
  }

  if (!initialized || !user || !status) return <LoadingScreen />;

  const { free, premium } = status.plans;
  const isPremium = status.tier === 'premium';

  return (
    <AppShell>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptReady(true)} />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
        <header className="mb-10 text-center">
          <span className="chip mb-3 bg-accent-100 px-3 py-1 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
            <Sparkles size={12} /> Plans
          </span>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Jitna practice, utni growth</h1>
          <p className="mx-auto mt-2 max-w-md text-slate-500">
            Free mein shuru karo. Jab zyada practice chahiye, Premium lo — koi hidden charges nahi.
          </p>
        </header>

        {isPremium && (
          <div className="card mb-6 flex items-center gap-3 border-brand-200 bg-brand-50 dark:border-brand-900 dark:bg-brand-950/40">
            <Crown className="text-brand-600" size={24} />
            <div>
              <p className="font-semibold text-brand-700 dark:text-brand-300">Aap Premium ho!</p>
              {status.expiresAt && (
                <p className="text-sm text-slate-500">
                  {new Date(status.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} tak valid
                </p>
              )}
            </div>
          </div>
        )}

        {message && (
          <p className="mb-6 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800 dark:border-accent-900/50 dark:bg-accent-900/20 dark:text-accent-200">
            {message}
          </p>
        )}

        <div className="grid items-stretch gap-6 md:grid-cols-2">
          <div className="card flex flex-col p-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">{free.name}</p>
            <p className="mt-2 font-display text-4xl font-bold">{free.priceLabel}</p>
            <p className="mt-1 text-sm text-slate-500">Hamesha ke liye free</p>
            <ul className="my-6 flex-1 space-y-3">
              {free.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="btn-secondary pointer-events-none w-full opacity-70">{isPremium ? 'Included' : 'Current plan'}</div>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-2xl gradient-hero p-7 text-white shadow-xl shadow-brand-900/25">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-100">{premium.name}</p>
              <span className="chip bg-accent-400 font-semibold text-brand-950">Best value</span>
            </div>
            <p className="relative mt-2 font-display text-4xl font-bold">{premium.priceLabel}</p>
            <p className="relative mt-1 text-sm text-brand-100">Cancel kabhi bhi</p>
            <ul className="relative my-6 flex-1 space-y-3">
              {premium.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-400 text-brand-950">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            {!isPremium ? (
              <button
                type="button"
                onClick={upgrade}
                disabled={paying || !status.paymentsEnabled || !scriptReady}
                className="relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50 disabled:opacity-60"
              >
                <Crown size={16} />
                {paying ? 'Processing…' : status.paymentsEnabled ? 'Upgrade karo' : 'Jald aa raha hai'}
              </button>
            ) : (
              <div className="relative rounded-xl bg-white/15 px-5 py-3 text-center text-sm font-semibold">Active ✓</div>
            )}
            {!status.paymentsEnabled && !isPremium && (
              <p className="relative mt-2 text-center text-xs text-brand-100">Payments abhi setup ho rahe hain</p>
            )}
          </div>
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck size={14} /> Secure payments via Razorpay · UPI, cards, netbanking
        </p>
      </div>
    </AppShell>
  );
}
