import type { User } from '@prisma/client';

/** Strips fields that must never reach the client (password hash, internal auth ids). */
export function toPublicUser(user: User) {
  const { passwordHash, googleId, firebaseUid, ...publicUser } = user;
  return publicUser;
}
