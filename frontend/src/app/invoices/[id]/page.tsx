'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { api, ApiError } from '@/lib/api';

interface Invoice {
  number: string;
  issuedAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerState: string | null;
  placeOfSupply: string;
  description: string;
  sacCode: string;
  totalPaise: number;
  seller: { legalName: string; gstin: string | null; address: string | null; state: string | null };
}

/** Printable GST tax invoice ("Save as PDF" from the browser's print dialog). */
export default function InvoicePage() {
  const id = String(useParams().id);
  const router = useRouter();
  const { user, token, initialized } = useAuthStore();
  const [data, setData] = useState<{ invoice: Invoice; lines: [string, string][] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [initialized, user, router]);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ invoice: Invoice; lines: [string, string][] }>(`/api/subscription/invoices/${id}`, token)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Invoice load nahi ho paya.'));
  }, [token, id]);

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!data) return <Loader2 className="mx-auto mt-20 animate-spin text-brand-600" />;

  const { invoice, lines } = data;
  const total = lines[lines.length - 1];

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-2xl justify-between px-4 print:hidden">
        <Link href="/pricing" className="btn-ghost">
          <ArrowLeft size={16} /> Wapas
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-primary py-2">
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      <article className="mx-auto max-w-2xl bg-white p-8 text-sm text-slate-800 shadow print:shadow-none">
        <header className="mb-6 flex items-start justify-between border-b-4 border-brand-600 pb-4">
          <div>
            <h1 className="text-xl font-bold text-brand-700">TAX INVOICE</h1>
            <p className="mt-1 font-semibold">{invoice.seller.legalName}</p>
            {invoice.seller.address && <p className="text-slate-600">{invoice.seller.address}</p>}
            {invoice.seller.state && <p className="text-slate-600">State: {invoice.seller.state}</p>}
            <p className="text-slate-600">GSTIN: {invoice.seller.gstin ?? '—'}</p>
          </div>
          <div className="text-right">
            <p>
              <span className="text-slate-500">Invoice no.</span>
              <br />
              <strong>{invoice.number}</strong>
            </p>
            <p className="mt-2">
              <span className="text-slate-500">Date</span>
              <br />
              {new Date(invoice.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Billed to</p>
            <p className="font-semibold">{invoice.buyerName}</p>
            <p>{invoice.buyerEmail}</p>
            {invoice.buyerState && <p>{invoice.buyerState}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-slate-500">Place of supply</p>
            <p>{invoice.placeOfSupply}</p>
          </div>
        </section>

        <table className="mb-6 w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2">Description</th>
              <th className="py-2">SAC</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3">{invoice.description}</td>
              <td className="py-3">{invoice.sacCode}</td>
              <td className="py-3 text-right">{lines[0][1]}</td>
            </tr>
          </tbody>
        </table>

        <table className="ml-auto w-64">
          <tbody>
            {lines.slice(1, -1).map(([label, value]) => (
              <tr key={label}>
                <td className="py-1 text-slate-600">{label}</td>
                <td className="py-1 text-right">{value}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-800 font-bold">
              <td className="py-2">{total[0]}</td>
              <td className="py-2 text-right">{total[1]}</td>
            </tr>
          </tbody>
        </table>

        <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>This is a computer-generated invoice and does not require a signature. Paid online via Razorpay.</p>
          <p className="mt-1">KijiTalk · Design By: Kiji Technology</p>
        </footer>
      </article>
    </div>
  );
}
