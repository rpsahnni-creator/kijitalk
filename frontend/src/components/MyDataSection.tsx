'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { getAuthErrorMessage } from '@/lib/authErrors';

/** DPDP Act 2023 rights: download your data, delete your account. */
export function MyDataSection() {
  const { account, exportMyData, deleteAccount } = useAuthStore();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [downloadNote, setDownloadNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const needsPassword = account?.hasPassword !== false;

  const download = async () => {
    setDownloading(true);
    setDownloadNote('');
    try {
      const blob = await exportMyData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kijitalk-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadNote('Download ho gaya.');
    } catch (err) {
      setDownloadNote(getAuthErrorMessage(err, 'Download nahi ho paya. Dobara try karo.'));
    } finally {
      setDownloading(false);
    }
  };

  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    if (typed.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Confirm karne ke liye DELETE likho.');
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(password);
      router.replace('/?deleted=1');
    } catch (err) {
      setDeleteError(getAuthErrorMessage(err, 'Account delete nahi ho paya.'));
      setDeleting(false);
    }
  };

  return (
    <>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Mera data</h2>
      <div className="card mb-6 divide-y divide-slate-100 p-0 dark:divide-slate-800">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700 dark:bg-leaf-950/50 dark:text-leaf-400">
              <Download size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Apna data download karo</p>
              <p className="text-xs text-slate-500">{downloadNote || 'Profile, progress, chats — sab ek file mein (JSON)'}</p>
            </div>
          </div>
          <button type="button" onClick={download} disabled={downloading} className="btn-secondary shrink-0 px-3 py-2">
            {downloading ? <Loader2 size={14} className="animate-spin" /> : 'Download'}
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <Trash2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Account delete karo</p>
                <p className="text-xs text-slate-500">Hamesha ke liye — wapas nahi aayega</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConfirmOpen((v) => !v)}
              className="btn-secondary shrink-0 px-3 py-2 text-red-600 dark:text-red-400"
            >
              {confirmOpen ? 'Cancel' : 'Delete'}
            </button>
          </div>

          {confirmOpen && (
            <form onSubmit={remove} className="mt-4 space-y-3 rounded-xl border-2 border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/20">
              <p className="text-sm text-slate-700 dark:text-slate-200">
                Aapka profile, progress, streak, chats aur login turant delete ho jayenge. Premium chal raha ho to uska
                renewal band ho jayega. GST invoices kanoon ke hisaab se kuch saal rakhe jaate hain (
                <Link href="/privacy#s5" className="underline">kyun?</Link>).
              </p>
              {needsPassword && (
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Apna password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  aria-label="Password"
                  required
                />
              )}
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder='Confirm karne ke liye "DELETE" likho'
                className="input-field"
                aria-label="Type DELETE to confirm"
              />
              {deleteError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>}
              <button type="submit" disabled={deleting} className="btn-primary w-full bg-red-600 hover:bg-red-700">
                {deleting && <Loader2 size={16} className="animate-spin" />}
                Haan, mera account delete karo
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
