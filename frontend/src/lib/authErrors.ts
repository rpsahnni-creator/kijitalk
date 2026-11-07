import { ApiError } from './api';

/** Turns an auth failure into a message the student can act on. */
export function getAuthErrorMessage(error: unknown, fallback = 'Sign-in failed. Please try again.'): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Bahut zyada attempts — thodi der baad try karo.';
    if (error.status >= 500) return 'Server mein problem hai. Thodi der baad try karo.';
    return error.message || fallback;
  }
  // fetch() throws a TypeError when the API can't be reached at all.
  if (error instanceof TypeError) {
    return 'Server se connect nahi ho paya. Internet check karke dobara try karo.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
