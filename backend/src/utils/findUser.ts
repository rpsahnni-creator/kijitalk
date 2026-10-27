import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { AuthRequest } from '../middleware/auth';

export async function findUserByAuth(req: AuthRequest): Promise<User | null> {
  const uid = req.user?.uid;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}
