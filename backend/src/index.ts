import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';
import { seedLessons } from './scripts/seedLessons';

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
