import { financialYear, formatInvoiceNumber, placeOfSupply, splitInclusiveGst } from '../src/services/gst';
import { premiumUntil, toStatus } from '../src/services/billing.service';

describe('splitInclusiveGst', () => {
  it('splits ₹149 incl. 18% GST into CGST + SGST within the seller state', () => {
    const s = splitInclusiveGst(14900, 18, 'Karnataka', 'karnataka');
    expect(s.intraState).toBe(true);
    expect(s.taxablePaise).toBe(12627);
    expect(s.cgstPaise + s.sgstPaise).toBe(2273);
    expect(s.igstPaise).toBe(0);
    expect(s.taxablePaise + s.cgstPaise + s.sgstPaise).toBe(14900);
  });

  it('uses IGST for other states and when the buyer state is unknown', () => {
    for (const buyer of ['Bihar', null]) {
      const s = splitInclusiveGst(14900, 18, 'Karnataka', buyer);
      expect(s.intraState).toBe(false);
      expect(s.igstPaise).toBe(2273);
      expect(s.taxablePaise + s.igstPaise).toBe(14900);
    }
  });

  it('always adds up exactly, including odd tax amounts', () => {
    for (const total of [100, 9999, 14901, 49900]) {
      const s = splitInclusiveGst(total, 18, 'Goa', 'Goa');
      expect(s.taxablePaise + s.cgstPaise + s.sgstPaise + s.igstPaise).toBe(total);
    }
  });
});

describe('invoice numbering', () => {
  it('uses the Indian financial year (April–March, IST)', () => {
    expect(financialYear(new Date('2027-03-31T18:00:00Z'))).toBe('2026-27'); // 31 Mar 23:30 IST
    expect(financialYear(new Date('2027-03-31T19:00:00Z'))).toBe('2027-28'); // 1 Apr 00:30 IST
    expect(financialYear(new Date('2026-11-08T10:00:00Z'))).toBe('2026-27');
  });

  it('formats gap-free numbers', () => {
    expect(formatInvoiceNumber('KT', '2026-27', 42)).toBe('KT/2026-27/000042');
  });

  it('prints place of supply with the GST state code', () => {
    expect(placeOfSupply('Bihar', 'Karnataka')).toBe('Bihar (10)');
    expect(placeOfSupply(null, 'Karnataka')).toBe('Karnataka (29)');
  });
});

describe('subscription → Premium access', () => {
  const end = new Date('2026-12-08T00:00:00Z');

  it('gives a day of grace while the subscription is live', () => {
    expect(premiumUntil('active', end)?.toISOString()).toBe('2026-12-09T00:00:00.000Z');
    expect(premiumUntil('pending', end)?.toISOString()).toBe('2026-12-09T00:00:00.000Z');
  });

  it('keeps only the paid period once cancelled or halted', () => {
    expect(premiumUntil('cancelled', end)).toEqual(end);
    expect(premiumUntil('halted', end)).toEqual(end);
    expect(premiumUntil('active', null)).toBeNull();
  });

  it('maps unknown Razorpay states safely', () => {
    expect(toStatus('active')).toBe('active');
    expect(toStatus('something_new')).toBe('pending');
  });
});
