'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Check, Crown } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
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

  useEffect(() => {
    if (!token) return;
    api.get<SubscriptionStatus>('/api/subscription/status', token).then(setStatus).catch(console.error);
  }, [token]);

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
        theme: { color: '#952248' },
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

  if (!initialized || !user || !status) return <LoadingScreen />;

  const { free, premium } = status.plans;
  const isPremium = status.tier === 'premium';

  return (
    <AppShell>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptReady(true)} />
      <div className="mx-auto max-w-3xl p-6">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Plans</h1>
          <p className="text-slate-500">Jitna practice karna hai, utna milega</p>
        </header>

        {isPremium && (
          <div className="card mb-6 flex items-center gap-3 border-brand-200 bg-brand-50 dark:bg-brand-900/20">
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

        {message && <p className="mb-6 rounded-2xl bg-accent-50 px-4 py-3 text-sm text-accent-800 dark:bg-accent-900/20 dark:text-accent-200">{message}</p>}

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-bold">{free.name}</h2>
            <p className="mb-4 text-2xl font-extrabold">{free.priceLabel}</p>
            <ul className="space-y-2">
              {free.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="card border-2 border-accent-400">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-bold">{premium.name}</h2>
              <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">Best value</span>
            </div>
            <p className="mb-4 text-2xl font-extrabold">{premium.priceLabel}</p>
            <ul className="mb-6 space-y-2">
              {premium.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> {f}
                </li>
              ))}
            </ul>
            {!isPremium && (
              <button
                onClick={upgrade}
                disabled={paying || !status.paymentsEnabled || !scriptReady}
                className="btn-primary w-full"
              >
                {paying ? 'Processing...' : status.paymentsEnabled ? 'Upgrade karo' : 'Jald aa raha hai'}
              </button>
            )}
            {!status.paymentsEnabled && (
              <p className="mt-2 text-center text-xs text-slate-400">Payments abhi setup ho rahe hain</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
