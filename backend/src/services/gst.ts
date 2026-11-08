/**
 * GST maths for B2C tax invoices. Prices shown to learners include GST, so the
 * tax is carved out of the total: intra-state sales are split CGST + SGST,
 * inter-state sales are IGST. All amounts are integer paise.
 */

// GST state codes (first two digits of a GSTIN).
export const GST_STATE_CODES: Record<string, string> = {
  'Jammu and Kashmir': '01', 'Himachal Pradesh': '02', Punjab: '03', Chandigarh: '04', Uttarakhand: '05',
  Haryana: '06', Delhi: '07', Rajasthan: '08', 'Uttar Pradesh': '09', Bihar: '10', Sikkim: '11',
  'Arunachal Pradesh': '12', Nagaland: '13', Manipur: '14', Mizoram: '15', Tripura: '16', Meghalaya: '17',
  Assam: '18', 'West Bengal': '19', Jharkhand: '20', Odisha: '21', Chhattisgarh: '22', 'Madhya Pradesh': '23',
  Gujarat: '24', 'Dadra and Nagar Haveli and Daman and Diu': '26', Maharashtra: '27', Karnataka: '29', Goa: '30',
  Lakshadweep: '31', Kerala: '32', 'Tamil Nadu': '33', Puducherry: '34', 'Andaman and Nicobar Islands': '35',
  Telangana: '36', 'Andhra Pradesh': '37', Ladakh: '38',
};

export interface GstSplit {
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
  intraState: boolean;
}

function sameState(sellerState: string, buyerState: string | null | undefined): boolean {
  if (!buyerState || !sellerState) return false;
  const norm = (s: string) => s.trim().toLowerCase();
  return norm(sellerState) === norm(buyerState);
}

/** Splits a GST-inclusive total into taxable value and tax heads. Rounds so the parts add up exactly. */
export function splitInclusiveGst(
  totalPaise: number,
  ratePercent: number,
  sellerState: string,
  buyerState: string | null | undefined
): GstSplit {
  const taxablePaise = Math.round((totalPaise * 100) / (100 + ratePercent));
  const taxPaise = totalPaise - taxablePaise;
  const intraState = sameState(sellerState, buyerState);
  if (intraState) {
    const cgstPaise = Math.floor(taxPaise / 2);
    return { taxablePaise, cgstPaise, sgstPaise: taxPaise - cgstPaise, igstPaise: 0, totalPaise, intraState };
  }
  return { taxablePaise, cgstPaise: 0, sgstPaise: 0, igstPaise: taxPaise, totalPaise, intraState };
}

/** Indian financial year label for a date, e.g. 15 Mar 2027 → "2026-27", 1 Apr 2027 → "2027-28". */
export function financialYear(date: Date): string {
  // Financial years follow India time (IST, UTC+5:30).
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const year = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/** Gap-free invoice number, e.g. "KT/2026-27/000042". */
export function formatInvoiceNumber(prefix: string, fy: string, n: number): string {
  return `${prefix}/${fy}/${String(n).padStart(6, '0')}`;
}

/** Place of supply as printed on the invoice: "Bihar (10)". */
export function placeOfSupply(buyerState: string | null | undefined, sellerState: string): string {
  const state = buyerState?.trim() || sellerState || 'India';
  const code = GST_STATE_CODES[state];
  return code ? `${state} (${code})` : state;
}

export function formatInr(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
