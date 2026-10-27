import type { Prisma, User } from '@prisma/client';
import { prisma } from '../config/prisma';

export function saveUser(user: User) {
  const { id, createdAt, updatedAt, ...data } = user;
  return prisma.user.update({ where: { id }, data: data as Prisma.UserUpdateInput });
}
