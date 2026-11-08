import type { Invoice } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { escapeHtml, sendMail } from './mailer';
import { financialYear, formatInr, formatInvoiceNumber, placeOfSupply, splitInclusiveGst } from './gst';

export function sellerSnapshot() {
  return {
    legalName: env.SELLER_LEGAL_NAME,
    gstin: env.SELLER_GSTIN || null,
    address: env.SELLER_ADDRESS || null,
    state: env.SELLER_STATE || null,
  };
}

/**
 * Issues the GST tax invoice for a paid payment. Idempotent: a payment gets
 * exactly one invoice, and numbers come from a per-financial-year counter in
 * the same transaction, so they are sequential with no gaps or duplicates.
 */
export async function issueInvoiceForPayment(paymentId: string): Promise<Invoice | null> {
  const existing = await prisma.invoice.findUnique({ where: { paymentId } });
  if (existing) return existing;

  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { user: true } });
  if (!payment || payment.status !== 'paid') return null;

  const issuedAt = new Date();
  const fy = financialYear(issuedAt);
  const totalPaise = payment.amountInr * 100;
  const split = splitInclusiveGst(totalPaise, env.GST_RATE_PERCENT, env.SELLER_STATE, payment.user.state);

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const counter = await tx.invoiceCounter.upsert({
        where: { financialYear: fy },
        create: { financialYear: fy, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      return tx.invoice.create({
        data: {
          number: formatInvoiceNumber(env.INVOICE_PREFIX, fy, counter.lastNumber),
          userId: payment.userId,
          paymentId: payment.id,
          issuedAt,
          buyerName: payment.user.displayName,
          buyerEmail: payment.user.email,
          buyerState: payment.user.state,
          placeOfSupply: placeOfSupply(payment.user.state, env.SELLER_STATE),
          description: 'KijiTalk Premium — 1 month subscription',
          sacCode: env.INVOICE_SAC_CODE,
          taxablePaise: split.taxablePaise,
          cgstPaise: split.cgstPaise,
          sgstPaise: split.sgstPaise,
          igstPaise: split.igstPaise,
          totalPaise: split.totalPaise,
          seller: sellerSnapshot(),
        },
      });
    });
    void emailInvoice(invoice);
    return invoice;
  } catch (error) {
    // Two webhooks racing for the same payment: the other one created it.
    const raced = await prisma.invoice.findUnique({ where: { paymentId } });
    if (raced) return raced;
    logger.error(`Invoice for payment ${paymentId} failed`, error);
    throw error;
  }
}

export function invoiceLines(inv: Invoice) {
  const rate = env.GST_RATE_PERCENT;
  return [
    ['Taxable value', formatInr(inv.taxablePaise)],
    ...(inv.igstPaise > 0
      ? [[`IGST @ ${rate}%`, formatInr(inv.igstPaise)]]
      : [
          [`CGST @ ${rate / 2}%`, formatInr(inv.cgstPaise)],
          [`SGST @ ${rate / 2}%`, formatInr(inv.sgstPaise)],
        ]),
    ['Total (incl. GST)', formatInr(inv.totalPaise)],
  ];
}

async function emailInvoice(invoice: Invoice): Promise<void> {
  const link = `${env.WEB_URL}/invoices/${invoice.id}`;
  const lines = invoiceLines(invoice);
  const text = [
    `Namaste ${invoice.buyerName}!`,
    '',
    'KijiTalk Premium ke liye aapka payment mil gaya. Shukriya! 🎉',
    '',
    `Tax invoice: ${invoice.number}`,
    `Date: ${invoice.issuedAt.toLocaleDateString('en-IN')}`,
    ...lines.map(([k, v]) => `${k}: ${v}`),
    '',
    `Invoice dekhne/print karne ke liye: ${link}`,
    '',
    '— Team KijiTalk',
  ].join('\n');
  const html = `<p>Namaste ${escapeHtml(invoice.buyerName)}!</p>
<p>KijiTalk Premium ke liye aapka payment mil gaya. Shukriya! 🎉</p>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif">
<tr><td><b>Tax invoice</b></td><td>${escapeHtml(invoice.number)}</td></tr>
${lines.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td align="right">${escapeHtml(v)}</td></tr>`).join('\n')}
</table>
<p><a href="${link}">Invoice dekho / print karo</a></p>
<p>— Team KijiTalk</p>`;
  const sent = await sendMail({ to: invoice.buyerEmail, subject: `KijiTalk payment receipt · ${invoice.number}`, text, html });
  if (sent) await prisma.invoice.update({ where: { id: invoice.id }, data: { emailedAt: new Date() } });
}
