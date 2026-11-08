/**
 * Business details shown in the Privacy Policy, Terms and invoices.
 *
 * ⚠️ Fill every "[…]" value before launch, and have a lawyer review the
 * policy text. Values in square brackets are shown highlighted on the pages so
 * nothing unfinished goes live unnoticed.
 */
export const LEGAL = {
  productName: 'KijiTalk',
  entityName: process.env.NEXT_PUBLIC_LEGAL_ENTITY ?? 'Kiji Technology',
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? '[Registered office address]',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? '[support@your-domain]',
  grievanceOfficer: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER ?? '[Name of Grievance Officer]',
  grievanceEmail: process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL ?? '[grievance@your-domain]',
  jurisdictionCity: process.env.NEXT_PUBLIC_LEGAL_CITY ?? '[City]',
  effectiveDate: '8 November 2026',
  /** Must match auth-service TERMS_VERSION. */
  version: '2026-11-08',
} as const;

export function isPlaceholder(value: string): boolean {
  return value.startsWith('[') && value.endsWith(']');
}
