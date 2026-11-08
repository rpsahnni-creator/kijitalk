import './instrument';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';
import { seedLessons } from './scripts/seedLessons';
import { checkGeminiKey } from './services/gemini.service';
import { isClaudeAvailable } from './services/claude.service';
import { markProviderCheck, setProviderConfigured } from './services/aiMonitor.service';
import { startScheduler } from './jobs/streakReminders';

async function bootstrap() {
  const dbConnected = await connectDatabase();
  if (dbConnected) {
    try {
      await seedLessons();
    } catch (error) {
      logger.warn('⚠️ Lesson seed skipped (database may already have data)', error);
    }
  } else if (env.NODE_ENV === 'development') {
    logger.warn('⚠️ Running without PostgreSQL — check DATABASE_URL / that Postgres is running');
  } else {
    throw new Error('PostgreSQL connection required in production');
  }

  const app = createApp();

  // AI self-check: a wrong key is logged loudly at startup instead of surfacing
  // later as "AI service is busy" replies.
  setProviderConfigured('gemini', !!env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'test-key');
  setProviderConfigured('claude', isClaudeAvailable());
  void checkGeminiKey().then(({ ok, error }) => {
    markProviderCheck('gemini', ok, error);
    if (ok) logger.info('✅ Gemini API key works');
    else logger.error('❌ Gemini check failed — Kiki will fall back to Claude/offline replies', error);
  });
  if (env.ENABLE_SCHEDULER && dbConnected) startScheduler();
  if (!isClaudeAvailable()) logger.warn('⚠️ ANTHROPIC_API_KEY not set — no Claude fallback if Gemini fails');

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 KijiTalk API running on http://localhost:${env.PORT}`);
    logger.info(`📚 Health check: http://localhost:${env.PORT}/health`);
    if (!dbConnected) {
      logger.warn('⚠️ Database offline — login/chat will not work until PostgreSQL connects');
    }
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${env.PORT} already in use! Pehle purana backend band karo:`);
      logger.error(`   taskkill /F /IM node.exe  (ya CMD mein Ctrl+C)`);
      process.exit(1);
    }
    throw err;
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
