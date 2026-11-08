'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/** Last-resort error screen; also reports the crash to Sentry when configured. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ color: '#dc143c' }}>Kuch gadbad ho gayi 😕</h1>
          <p style={{ color: '#475569' }}>Humein pata chal gaya hai aur hum theek kar rahe hain.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, background: '#dc143c', color: '#fff', border: 0, borderRadius: 12, padding: '10px 20px', fontWeight: 600 }}
          >
            Dobara try karo
          </button>
        </div>
      </body>
    </html>
  );
}
