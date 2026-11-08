// Loaded before anything else so Sentry can instrument Express and Prisma.
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // Learners are often children: never attach emails, IPs or request bodies.
    sendDefaultPii: false,
  });
}
