'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Ban,
  BadgeCheck,
  CreditCard,
  Crown,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';

/* ------------------------------------------------------------------ types */

interface Account {
  exists: boolean;
  active?: boolean;
  emailVerified?: boolean;
  gate?: string;
  isMinor?: boolean;
  parentEmail?: string | null;
  parentalConsent?: string;
  parentalConsentAt?: string | null;
  parentalConsentName?: string | null;
  termsAcceptedAt?: string | null;
  hasPassword?: boolean;
  googleLinked?: boolean;
  joinedAt?: string;
  lastLoginAt?: string | null;
}

interface Payment {
  id: string;
  amountInr: number;
  status: string;
  createdAt: string;
  razorpayPaymentId: string | null;
  refundedPaise: number;
  refundedAt: string | null;
  refundablePaise: number;
  invoice: { id: string; number: string } | null;
}

interface AuditEntry {
  id: string;
  adminEmail: string;
  action: string;
  reason: string | null;
  createdAt: string;
}

interface Detail {
  user: {
    id: string;
    email: string;
    displayName: string;
    grade: string | null;
    board: string | null;
    state: string | null;
    nativeLanguage: string;
    targetLevel: string;
    subscriptionTier: string;
    subscriptionExpiresAt: string | null;
    schoolLicenseUntil: string | null;
    premiumGrantUntil: string | null;
    aiMessagesToday: number;
    streak: number;
    totalMinutes: number;
    lessonsCompleted: number;
    xp: number;
    level: number;
    placementScore: number | null;
    lastActiveAt: string;
    createdAt: string;
    suspendedAt: string | null;
    suspendedReason: string | null;
  };
  isAdmin: boolean;
  tier: 'free' | 'premium';
  premiumSource: string[];
  account: Account | null;
  stats: { minutes7d: number; aiCalls30d: number; aiByFeature: Array<{ feature: string; count: number }>; mistakes: number; reviewDue: number };
  subscriptions: Array<{ id: string; status: string; currentEnd: string | null; cancelAtPeriodEnd: boolean; createdAt: string }>;
  payments: Payment[];
  classes: Array<{ id: string; name: string; school: string; joinedAt: string }>;
  recentActivity: Array<{ id: string; date: string; activityType: string; minutesSpent: number; score: number; lesson: string | null }>;
  audit: AuditEntry[];
  razorpayConfigured: boolean;
}

type ActionId =
  | 'suspend'
  | 'unsuspend'
  | 'logout_all'
  | 'grant_premium'
  | 'revoke_premium'
  | 'reset_ai_usage'
  | 'send_password_reset'
  | 'mark_verified'
  | 'resend_verification'
  | 'resend_parent_consent'
  | 'cancel_subscription'
  | 'refund'
  | 'delete';

interface ActionSpec {
  title: string;
  description: string;
  confirm: string;
  danger?: boolean;
  needsReason?: boolean;
  optionalReason?: boolean;
}

const ACTIONS: Record<ActionId, ActionSpec> = {
  suspend: {
    title: 'Account suspend karo',
    description: 'Learner turant har device se logout ho jayega aur login nahi kar payega jab tak aap unsuspend na karo. Data safe rehta hai.',
    confirm: 'Suspend karo',
    danger: true,
    needsReason: true,
  },
  unsuspend: { title: 'Account phir se chalu karo', description: 'Learner dobara login kar payega.', confirm: 'Unsuspend karo', optionalReason: true },
  logout_all: {
    title: 'Sab devices se logout',
    description: 'Saare sessions khatam. Learner apne password se dobara login kar sakta hai. Phone kho gaya ho ya account share hua ho tab kaam aata hai.',
    confirm: 'Logout karao',
    optionalReason: true,
  },
  grant_premium: {
    title: 'Premium free mein do',
    description: 'Paid subscription se alag. Pehle se chal raha ho to utne din aur jud jaate hain.',
    confirm: 'Premium do',
    needsReason: true,
  },
  revoke_premium: {
    title: 'Admin wala Premium hatao',
    description: 'Sirf admin ka diya Premium hatega. Paid subscription aur school licence waise hi rahenge.',
    confirm: 'Hatao',
    danger: true,
    needsReason: true,
  },
  reset_ai_usage: { title: 'Aaj ki AI limit reset karo', description: 'Aaj ke AI messages ka count 0 ho jayega.', confirm: 'Reset karo', optionalReason: true },
  send_password_reset: { title: 'Password reset link bhejo', description: 'Learner ke email pe 1 ghante ka reset link jayega.', confirm: 'Bhejo' },
  mark_verified: { title: 'Email verified mark karo', description: 'Tabhi karo jab aapne kisi aur tareeke se confirm kiya ho ki email learner ka hi hai.', confirm: 'Verify karo', optionalReason: true },
  resend_verification: { title: 'Verification email dobara bhejo', description: 'Learner ko naya verify link milega.', confirm: 'Bhejo' },
  resend_parent_consent: { title: 'Parent ko consent email bhejo', description: 'Parent ko permission ka link dobara jayega.', confirm: 'Bhejo' },
  cancel_subscription: {
    title: 'Subscription cancel karo',
    description: 'Razorpay pe renewal band ho jayega.',
    confirm: 'Cancel karo',
    danger: true,
    needsReason: true,
  },
  refund: {
    title: 'Refund do',
    description: 'Razorpay se paisa learner ke account mein wapas jayega (5–7 din). Poora ya thoda.',
    confirm: 'Refund karo',
    danger: true,
    needsReason: true,
  },
  delete: {
    title: 'Account delete karo',
    description: 'Learner ki profile aur saara learning data hamesha ke liye mit jayega, login bhi. Payment aur GST invoice record kanoon ke liye rakhe jaate hain. Yeh wapas nahi hota.',
    confirm: 'Hamesha ke liye delete karo',
    danger: true,
    needsReason: true,
  },
};

/* ---------------------------------------------------------------- helpers */

const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const ACTION_LABEL: Record<string, string> = Object.fromEntries(Object.entries(ACTIONS).map(([k, v]) => [k, v.title]));
export const auditActionLabel = (a: string) => ACTION_LABEL[a] ?? a;

const SOURCE_LABEL: Record<string, string> = { subscription: 'Paid', school: 'School licence', admin_grant: 'Admin ne diya' };
const CONSENT_LABEL: Record<string, string> = {
  not_required: 'Zaroori nahi (18+)',
  pending: 'Parent ka intezaar',
  granted: 'Parent ne permission di',
  denied: 'Parent ne mana kiya',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      <h3 className="section-title mb-2">{title}</h3>
      {children}
    </section>
  );
}

function ActionButton({ icon: Icon, label, onClick, danger, disabled, title }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40'
          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={16} className="shrink-0" /> {label}
    </button>
  );
}

/* ----------------------------------------------------------------- dialog */

function ActionDialog({
  action,
  detail,
  payment,
  onClose,
  onRun,
}: {
  action: ActionId;
  detail: Detail;
  payment: Payment | null;
  onClose: () => void;
  onRun: (body: Record<string, unknown>) => Promise<void>;
}) {
  const spec = ACTIONS[action];
  const [reason, setReason] = useState('');
  const [days, setDays] = useState(30);
  const [amount, setAmount] = useState(payment ? String(payment.refundablePaise / 100) : '');
  const [immediately, setImmediately] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const reasonOk = !spec.needsReason || reason.trim().length >= 3;
  const deleteOk = action !== 'delete' || confirmEmail.trim().toLowerCase() === detail.user.email;
  const amountNum = Number(amount);
  const amountOk = action !== 'refund' || (amountNum > 0 && payment !== null && amountNum * 100 <= payment.refundablePaise + 0.001);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonOk || !deleteOk || !amountOk) return;
    setBusy(true);
    setError('');
    const body: Record<string, unknown> = { action };
    if (reason.trim()) body.reason = reason.trim();
    if (action === 'grant_premium') body.days = days;
    if (action === 'cancel_subscription') body.immediately = immediately;
    if (action === 'refund' && payment) {
      body.paymentId = payment.id;
      body.amountInr = amountNum;
    }
    if (action === 'delete') body.confirmEmail = confirmEmail.trim().toLowerCase();
    try {
      await onRun(body);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action fail ho gaya.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" onClick={() => !busy && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 id="action-title" className={`font-display text-lg font-bold ${spec.danger ? 'text-red-700 dark:text-red-400' : ''}`}>
            {spec.title}
          </h2>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Band karo">
            <X size={18} />
          </button>
        </div>
        <p className="mb-1 text-sm font-medium">{detail.user.displayName} · {detail.user.email}</p>
        <p className="mb-4 text-sm text-slate-500">{spec.description}</p>

        {action === 'grant_premium' && (
          <label className="mb-3 block text-sm font-medium">
            Kitne din
            <div className="mt-1 flex flex-wrap gap-2">
              {[7, 30, 90, 365].map((d) => (
                <button key={d} type="button" onClick={() => setDays(d)} className={`pill-tab ${days === d ? 'pill-tab-active' : 'pill-tab-idle'}`} aria-pressed={days === d}>
                  {d} din
                </button>
              ))}
              <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))} className="input-field w-24 py-1.5" aria-label="Din" />
            </div>
          </label>
        )}

        {action === 'cancel_subscription' && (
          <div className="mb-3 space-y-2 text-sm">
            <label className="flex items-start gap-2">
              <input type="radio" checked={!immediately} onChange={() => setImmediately(false)} className="mt-1" />
              <span><b>Period ke end pe</b> — jo paise diye hain unka Premium chalta rahega, aage charge nahi hoga.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" checked={immediately} onChange={() => setImmediately(true)} className="mt-1" />
              <span><b>Turant</b> — Premium abhi khatam. (Refund alag se dena hoga.)</span>
            </label>
          </div>
        )}

        {action === 'refund' && payment && (
          <label className="mb-3 block text-sm font-medium">
            Amount (₹) — zyada se zyada {rupees(payment.refundablePaise)}
            <input type="number" step="0.01" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field mt-1" />
            {!amountOk && amount !== '' && <span className="mt-1 block text-xs text-red-600">Amount sahi nahi hai.</span>}
          </label>
        )}

        {(spec.needsReason || spec.optionalReason) && (
          <label className="mb-3 block text-sm font-medium">
            Wajah {spec.needsReason ? '(zaroori — audit log mein jayegi)' : '(optional)'}
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} className="input-field mt-1" placeholder="Jaise: learner ne support email pe request kiya" />
          </label>
        )}

        {action === 'delete' && (
          <label className="mb-3 block text-sm font-medium">
            Confirm karne ke liye learner ka email likho
            <input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} className="input-field mt-1 font-mono" placeholder={detail.user.email} autoComplete="off" />
          </label>
        )}

        {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">{error}</p>}

        <div className="flex justify-end gap-2">
          <button ref={first} type="button" onClick={onClose} disabled={busy} className="btn-secondary">Rehne do</button>
          <button
            type="submit"
            disabled={busy || !reasonOk || !deleteOk || !amountOk}
            className={spec.danger ? 'inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50' : 'btn-primary'}
          >
            {busy && <Loader2 size={16} className="animate-spin" />} {spec.confirm}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ----------------------------------------------------------------- detail */

export function StudentDetail({ token, id, onBack }: { token: string; id: string; onBack: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<{ action: ActionId; payment?: Payment } | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    setError('');
    api
      .get<Detail>(`/api/admin/users/${id}`, token)
      .then(setDetail)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Load nahi hua'));
  }, [id, token]);
  useEffect(load, [load]);

  const run = async (body: Record<string, unknown>) => {
    const res = await api.post<{ message: string }>(`/api/admin/users/${id}/actions`, body, token);
    setOpen(null);
    setToast(res.message);
    if (body.action === 'delete') {
      setTimeout(onBack, 1200);
      return;
    }
    load();
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  if (error) {
    return (
      <div>
        <button type="button" onClick={onBack} className="btn-ghost -ml-3 mb-3"><ArrowLeft size={16} /> Users</button>
        <p className="card text-sm text-red-600">{error}</p>
      </div>
    );
  }
  if (!detail) return <Loader2 className="mx-auto animate-spin text-brand-600" />;

  const { user, account, stats } = detail;
  const suspended = !!user.suspendedAt;
  const liveSub = detail.subscriptions.find((s) => ['created', 'authenticated', 'active', 'pending'].includes(s.status));
  const act = (action: ActionId, payment?: Payment) => setOpen({ action, payment });
  const authDown = account === null;

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="btn-ghost -ml-3"><ArrowLeft size={16} /> Users</button>

      {toast && (
        <div className="rounded-2xl bg-leaf-50 px-4 py-3 text-sm font-medium text-leaf-800 dark:bg-leaf-950/40 dark:text-leaf-200" role="status">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="card flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-xl font-bold">{user.displayName}</p>
          <p className="break-all text-sm text-slate-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suspended && <span className="chip bg-red-100 text-red-800">Suspended</span>}
            {detail.isAdmin && <span className="chip bg-leaf-100 text-leaf-800">Admin</span>}
            <span className={`chip ${detail.tier === 'premium' ? 'bg-accent-200 text-slate-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
              {detail.tier === 'premium' ? `Premium · ${detail.premiumSource.map((s) => SOURCE_LABEL[s] ?? s).join(', ')}` : 'Free'}
            </span>
            {account?.isMinor && <span className="chip bg-brand-100 text-brand-800">18 se kam</span>}
            {account && !account.emailVerified && <span className="chip bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Email unverified</span>}
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Joined {day(user.createdAt)}</p>
          <p>Last active {when(user.lastActiveAt)}</p>
          <p>Last login {when(account?.lastLoginAt)}</p>
        </div>
      </div>

      {suspended && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {when(user.suspendedAt)} se suspended. Wajah: {user.suspendedReason ?? '—'}
        </div>
      )}
      {authDown && (
        <div className="rounded-2xl bg-accent-100 px-4 py-3 text-sm text-slate-800">
          Auth service se login ki details nahi mil payi — login wale actions abhi kaam nahi karenge.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: info */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel title="Profile">
              <Row label="Class / Board">{user.grade ?? '—'} · {user.board ?? '—'}</Row>
              <Row label="State">{user.state ?? '—'}</Row>
              <Row label="Ghar ki bhasha">{user.nativeLanguage}</Row>
              <Row label="Level">{user.targetLevel}{user.placementScore !== null ? ` (test ${user.placementScore}/100)` : ''}</Row>
            </Panel>
            <Panel title="Login aur consent">
              <Row label="Status">{account?.exists === false ? 'Login nahi hai' : account?.active === false ? 'Band (suspended)' : account ? 'Chalu' : '—'}</Row>
              <Row label="Sign-in">{account ? [account.hasPassword && 'Password', account.googleLinked && 'Google'].filter(Boolean).join(' + ') || 'Password set nahi' : '—'}</Row>
              <Row label="Terms">{account?.termsAcceptedAt ? day(account.termsAcceptedAt) : 'Accept nahi kiye'}</Row>
              <Row label="Parent consent">{account?.parentalConsent ? CONSENT_LABEL[account.parentalConsent] ?? account.parentalConsent : '—'}</Row>
              {account?.parentEmail && <Row label="Parent email">{account.parentEmail}</Row>}
              {account?.parentalConsentName && <Row label="Consent diya">{account.parentalConsentName} · {day(account.parentalConsentAt)}</Row>}
            </Panel>
          </div>

          <Panel title="Learning">
            <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
              {[
                ['Streak', `${user.streak}🔥`],
                ['Lessons', user.lessonsCompleted],
                ['XP', user.xp],
                ['Minutes (7d)', stats.minutes7d],
                ['AI calls (30d)', stats.aiCalls30d],
                ['Revision due', `${stats.reviewDue}/${stats.mistakes}`],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                  <p className="text-lg font-bold">{v}</p>
                  <p className="text-[11px] text-slate-500">{k}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Aaj AI messages: {user.aiMessagesToday}
              {stats.aiByFeature.length > 0 && ` · 30 din: ${stats.aiByFeature.map((f) => `${f.feature} ${f.count}`).join(', ')}`}
            </p>
            {detail.recentActivity.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">
                {detail.recentActivity.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2 py-1.5">
                    <span>{a.lesson ?? a.activityType}</span>
                    <span className="shrink-0 text-xs text-slate-500">{a.score ? `${a.score}% · ` : ''}{a.minutesSpent} min · {day(a.date)}</span>
                  </li>
                ))}
              </ul>
            )}
            {detail.classes.length > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-sm"><Users size={14} /> {detail.classes.map((c) => `${c.school} · ${c.name}`).join(', ')}</p>
            )}
          </Panel>

          <Panel title="Billing">
            <Row label="Subscription">
              {liveSub ? `${liveSub.status}${liveSub.cancelAtPeriodEnd ? ' (renew nahi hoga)' : ''} · ${day(liveSub.currentEnd)} tak` : 'Koi chalu nahi'}
            </Row>
            {user.premiumGrantUntil && <Row label="Admin Premium">{day(user.premiumGrantUntil)} tak</Row>}
            {user.schoolLicenseUntil && <Row label="School licence">{day(user.schoolLicenseUntil)} tak</Row>}
            {detail.payments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Koi payment nahi.</p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-slate-500">
                    <tr><th className="py-1">Date</th><th>Amount</th><th>Status</th><th>Invoice</th><th /></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {detail.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-1.5">{day(p.createdAt)}</td>
                        <td>₹{p.amountInr}{p.refundedPaise > 0 && <span className="block text-xs text-red-600">−{rupees(p.refundedPaise)} refund</span>}</td>
                        <td>{p.status}</td>
                        <td>{p.invoice ? <Link className="text-brand-600 underline" href={`/invoices/${p.invoice.id}`}>{p.invoice.number}</Link> : '—'}</td>
                        <td className="text-right">
                          {p.refundablePaise > 0 && (
                            <button
                              type="button"
                              className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-40"
                              disabled={!detail.razorpayConfigured}
                              title={detail.razorpayConfigured ? '' : 'Razorpay keys set nahi hain'}
                              onClick={() => act('refund', p)}
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Admin history (audit log)">
            {detail.audit.length === 0 ? (
              <p className="text-sm text-slate-500">Is learner pe abhi tak koi admin action nahi hua.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                {detail.audit.map((a) => (
                  <li key={a.id} className="py-2">
                    <p className="font-medium">{auditActionLabel(a.action)}</p>
                    <p className="text-xs text-slate-500">{a.adminEmail} · {when(a.createdAt)}{a.reason ? ` · “${a.reason}”` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Right: actions */}
        <div className="space-y-4">
          <Panel title="Account">
            <div className="space-y-2">
              {suspended ? (
                <ActionButton icon={UserCheck} label="Unsuspend karo" onClick={() => act('unsuspend')} disabled={authDown} />
              ) : (
                <ActionButton icon={Ban} label="Suspend karo" danger onClick={() => act('suspend')} disabled={authDown || detail.isAdmin} title={detail.isAdmin ? 'Admin ko suspend nahi kar sakte' : ''} />
              )}
              <ActionButton icon={LogOut} label="Sab devices se logout" onClick={() => act('logout_all')} disabled={authDown} />
            </div>
          </Panel>
          <Panel title="Premium">
            <div className="space-y-2">
              <ActionButton icon={Crown} label="Premium free mein do" onClick={() => act('grant_premium')} />
              {user.premiumGrantUntil && <ActionButton icon={RotateCcw} label="Admin Premium hatao" danger onClick={() => act('revoke_premium')} />}
              <ActionButton icon={RefreshCcw} label="Aaj ki AI limit reset" onClick={() => act('reset_ai_usage')} />
              {liveSub && (
                <ActionButton
                  icon={CreditCard}
                  label="Subscription cancel karo"
                  danger
                  onClick={() => act('cancel_subscription')}
                  disabled={!detail.razorpayConfigured}
                  title={detail.razorpayConfigured ? '' : 'Razorpay keys set nahi hain'}
                />
              )}
            </div>
          </Panel>
          <Panel title="Support">
            <div className="space-y-2">
              <ActionButton icon={KeyRound} label="Password reset link bhejo" onClick={() => act('send_password_reset')} disabled={authDown || suspended} />
              {account && !account.emailVerified && (
                <>
                  <ActionButton icon={Mail} label="Verification email bhejo" onClick={() => act('resend_verification')} />
                  <ActionButton icon={BadgeCheck} label="Email verified mark karo" onClick={() => act('mark_verified')} />
                </>
              )}
              {account?.parentalConsent === 'pending' && (
                <ActionButton icon={ShieldCheck} label="Parent ko consent email bhejo" onClick={() => act('resend_parent_consent')} />
              )}
            </div>
          </Panel>
          <Panel title="Danger zone" className="border border-red-200 dark:border-red-900">
            <ActionButton icon={Trash2} label="Account delete karo" danger onClick={() => act('delete')} disabled={detail.isAdmin} title={detail.isAdmin ? 'Admin account delete nahi ho sakta' : ''} />
          </Panel>
        </div>
      </div>

      {open && (
        <ActionDialog action={open.action} detail={detail} payment={open.payment ?? null} onClose={() => setOpen(null)} onRun={run} />
      )}
    </div>
  );
}
