'use client';

import posthog from 'posthog-js';

/**
 * Product analytics (PostHog), privacy-first:
 * - off unless NEXT_PUBLIC_POSTHOG_KEY is set
 * - only for signed-in adults: learners under 18 are never tracked (DPDP Act
 *   2023 forbids tracking and behavioural monitoring of children)
 * - no cookies or localStorage (memory persistence), no autocapture of what
 *   people type, no session recordings, and the user id is opaque (no email)
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

let enabled = false;

export function startAnalytics(account: { id: number; isMinor: boolean; gate: string } | null): void {
  const allowed = !!KEY && !!account && !account.isMinor && account.gate === 'ok';
  if (!allowed) {
    stopAnalytics();
    return;
  }
  if (!enabled) {
    posthog.init(KEY!, {
      api_host: HOST,
      persistence: 'memory',
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      mask_all_text: true,
      ip: false,
    });
    enabled = true;
  }
  posthog.identify(`acct_${account!.id}`);
}

export function stopAnalytics(): void {
  if (!enabled) return;
  posthog.reset();
  posthog.opt_out_capturing();
  enabled = false;
}

/** Records a product event, e.g. track('lesson_completed', { score: 80 }). No-op when off. */
export function track(event: string, props?: Record<string, string | number | boolean | null>): void {
  if (enabled) posthog.capture(event, props);
}

export function trackPageview(path: string): void {
  if (enabled) posthog.capture('$pageview', { $current_url: path });
}
