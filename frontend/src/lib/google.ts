export function isGoogleSignInConfigured(): boolean {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return !!id && id !== 'your-client-id.apps.googleusercontent.com';
}
