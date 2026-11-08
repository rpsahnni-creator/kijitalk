import express from 'express';
import * as Sentry from '@sentry/node';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { corsOrigins, env } from './config/env';
import { verifyAccessToken } from './utils/authToken';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import roleplayRoutes from './routes/roleplay.routes';
import lessonsRoutes from './routes/lessons.routes';
import progressRoutes from './routes/progress.routes';
import voiceRoutes from './routes/voice.routes';
import settingsRoutes from './routes/settings.routes';
import gamificationRoutes from './routes/gamification.routes';
import debateRoutes from './routes/debate.routes';
import coursesRoutes from './routes/courses.routes';
import subscriptionRoutes from './routes/subscription.routes';
import accountRoutes from './routes/account.routes';
import internalRoutes from './routes/internal.routes';
import adminRoutes from './routes/admin.routes';
import reviewRoutes from './routes/review.routes';
import placementRoutes from './routes/placement.routes';
import schoolRoutes from './routes/school.routes';
import { getAiHealth } from './services/aiMonitor.service';

export function createApp() {
  const app = express();
  // Real client IPs behind Caddy/nginx (needed for per-IP limits and logs).
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  );
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    })
  );
  // Signed-in learners are limited per account, so a school sharing one IP
  // doesn't lock itself out; anonymous traffic is limited per IP. Razorpay
  // webhooks and server-to-server calls are never limited.
  const learnerId = (req: express.Request): string | null => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    return verifyAccessToken(header.slice(7))?.authUserId ?? null;
  };
  const exempt = (req: express.Request) =>
    req.path === '/health' || req.path === '/api/subscription/webhook' || req.path.startsWith('/internal/');
  const tooMany = { error: 'Bahut zyada requests. Thodi der baad try karo.' };
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: env.RATE_LIMIT_PER_USER,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skip: (req) => exempt(req) || learnerId(req) === null,
      keyGenerator: (req) => `user:${learnerId(req)}`,
      message: tooMany,
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: env.RATE_LIMIT_PER_IP,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skip: exempt,
      message: tooMany,
    })
  );

  app.get('/', (_req, res) => {
    res.json({
      service: 'KijiTalk API',
      status: 'running',
      message: 'Backend is OK. Web app ke liye http://localhost:3100 kholo.',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        chat: '/api/chat',
        roleplay: '/api/roleplay',
        lessons: '/api/lessons',
        progress: '/api/progress',
        voice: '/api/voice',
        settings: '/api/settings',
        gamification: '/api/gamification',
        debate: '/api/debate',
        courses: '/api/courses',
        subscription: '/api/subscription',
      },
    });
  });

  app.get('/health', (_req, res) => {
    const ai = getAiHealth();
    const aiStatus = (p: (typeof ai)['gemini']) => (!p.configured ? 'not_configured' : p.paused ? 'paused' : 'ok');
    res.json({
      status: 'ok',
      service: 'kijitalk-api',
      timestamp: new Date().toISOString(),
      ai: { gemini: aiStatus(ai.gemini), claude: aiStatus(ai.claude) },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/roleplay', roleplayRoutes);
  app.use('/api/lessons', lessonsRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/voice', voiceRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/gamification', gamificationRoutes);
  app.use('/api/debate', debateRoutes);
  app.use('/api/courses', coursesRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/internal', internalRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/review', reviewRoutes);
  app.use('/api/placement', placementRoutes);
  app.use('/api/school', schoolRoutes);

  // Reports unhandled route errors to Sentry (no-op without SENTRY_DSN).
  Sentry.setupExpressErrorHandler(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
