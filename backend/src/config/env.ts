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
  // Monthly Premium plan created in the Razorpay dashboard (Subscriptions → Plans).
  RAZORPAY_PLAN_ID: z.string().optional(),

  // ── Seller details printed on GST tax invoices ──
  SELLER_LEGAL_NAME: z.string().default('Kiji Technology'),
  SELLER_GSTIN: z.string().default(''),
  SELLER_ADDRESS: z.string().default(''),
  SELLER_STATE: z.string().default(''),
  INVOICE_PREFIX: z.string().default('KT'),
  GST_RATE_PERCENT: z.coerce.number().default(18),
  // SAC for online education/training services — confirm with your CA.
  INVOICE_SAC_CODE: z.string().default('999293'),

  // ── Email (receipts, welcome mail, reminders). Unset = printed to the log. ──
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('KijiTalk <no-reply@kijitalk.local>'),
  WEB_URL: z.string().default('http://localhost:3100'),
  // auth-service base URL for server-to-server calls (bulk student invites).
  AUTH_SERVICE_URL: z.string().default('http://localhost:8100'),
  // Run daily jobs (streak reminders) inside this process. Use on one instance, or call /internal/jobs/* from a cron instead.
  ENABLE_SCHEDULER: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  SPEECH_SERVICE_URL: z.string().default('http://localhost:5001'),
  // Hops of reverse proxy in front of the API (Caddy = 1). Without it every
  // request looks like it comes from the proxy and shares one rate limit.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Requests per 15 minutes. Per signed-in learner, and per IP for anonymous
  // traffic. The IP limit is high because a whole school shares one IP.
  RATE_LIMIT_PER_USER: z.coerce.number().int().positive().default(900),
  RATE_LIMIT_PER_IP: z.coerce.number().int().positive().default(3000),
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
      SELLER_LEGAL_NAME: 'Kiji Technology',
      SELLER_GSTIN: '',
      SELLER_ADDRESS: '',
      SELLER_STATE: 'Karnataka',
      INVOICE_PREFIX: 'KT',
      GST_RATE_PERCENT: 18,
      INVOICE_SAC_CODE: '999293',
      MAIL_FROM: 'KijiTalk <no-reply@kijitalk.local>',
      WEB_URL: 'http://localhost:3100',
      AUTH_SERVICE_URL: 'http://localhost:8100',
      ENABLE_SCHEDULER: false,
      SPEECH_SERVICE_URL: 'http://localhost:5001',
      TRUST_PROXY: 0,
      RATE_LIMIT_PER_USER: 900,
      RATE_LIMIT_PER_IP: 3000,
      LOG_LEVEL: 'error',
    } as z.infer<typeof envSchema>);

export const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
