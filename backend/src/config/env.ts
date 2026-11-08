import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3100'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-1.5-pro'),
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-sonnet-5-5'),
  // When Gemini is down, let Claude answer free users too (costs money per message).
  AI_FALLBACK_TO_CLAUDE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  // Shared with auth-service (Django), which issues the access tokens this API trusts.
  AUTH_JWT_SECRET: z.string().min(32, 'AUTH_JWT_SECRET must be at least 32 characters'),
  AUTH_JWT_ISSUER: z.string().default('kijitalk-auth'),
  AUTH_JWT_AUDIENCE: z.string().default('kijitalk-api'),
  // Shared with auth-service: protects /internal/* (account deletion). Min 32 chars.
  INTERNAL_API_KEY: z.string().min(32).optional(),
  // Comma-separated emails allowed to see /api/admin/* (AI usage monitoring).
  ADMIN_EMAILS: z.string().default(''),
  // Legacy: signed the old 30-day tokens before auth moved to auth-service. Unused now.
  JWT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  SPEECH_SERVICE_URL: z.string().default('http://localhost:5001'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

export const env = parsed.success
  ? parsed.data
  : ({
      PORT: 4001,
      NODE_ENV: 'test',
      CORS_ORIGIN: 'http://localhost:3100',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/kijitalk-test',
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-1.5-pro',
      CLAUDE_MODEL: 'claude-sonnet-5-5',
      AI_FALLBACK_TO_CLAUDE: true,
      AUTH_JWT_SECRET: 'test-auth-jwt-secret-at-least-32-characters',
      AUTH_JWT_ISSUER: 'kijitalk-auth',
      AUTH_JWT_AUDIENCE: 'kijitalk-api',
      ADMIN_EMAILS: '',
      SPEECH_SERVICE_URL: 'http://localhost:5001',
      LOG_LEVEL: 'error',
    } as z.infer<typeof envSchema>);

export const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
