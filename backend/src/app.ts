import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { corsOrigins } from './config/env';
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

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      message: { error: 'Too many requests, please try again later.' },
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
      },
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'kijitalk-api', timestamp: new Date().toISOString() });
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
