import { prisma } from './prisma';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<boolean> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      logger.info('✅ PostgreSQL connected');
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`❌ PostgreSQL attempt ${attempt}/${maxRetries} failed`, msg);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  return false;
}
