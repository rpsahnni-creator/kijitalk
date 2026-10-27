import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { saveUser } from '../utils/persistUser';
import { logger } from '../utils/logger';
import { findUserByAuth } from '../utils/findUser';
import { signAuthToken } from '../utils/authToken';
import { toPublicUser } from '../utils/publicUser';
import { env } from '../config/env';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

router.get('/providers', (_req, res: Response) => {
  res.json({ google: !!googleClient });
});

router.post('/register', authLimiter, async (req, res: Response) => {
  try {
    const { email, password, displayName, nativeLanguage } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
      nativeLanguage?: string;
    };

    if (!email?.trim() || !password || password.length < 6) {
      res.status(400).json({ error: 'Valid email and a password of at least 6 characters are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName?.trim() || 'Learner',
        nativeLanguage: nativeLanguage ?? 'hi',
      },
    });

    const token = signAuthToken(user.id);
    logger.info(`New user registered: ${user.id}`);
    res.status(201).json({ user: toPublicUser(user), token });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/login', authLimiter, async (req, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user?.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = signAuthToken(updated.id);
    res.json({ user: toPublicUser(updated), token });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

router.post('/google', authLimiter, async (req, res: Response) => {
  try {
    if (!googleClient) {
      res.status(503).json({ error: 'Google sign-in is not configured on this server' });
      return;
    }

    const { idToken } = req.body as { idToken?: string };
    if (!idToken) {
      res.status(400).json({ error: 'idToken is required' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
      if (user) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub } });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email.toLowerCase(),
          googleId: payload.sub,
          displayName: payload.name ?? 'Learner',
          avatarUrl: payload.picture,
        },
      });
      logger.info(`New user registered via Google: ${user.id}`);
    } else {
      user = await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    }

    const token = signAuthToken(user.id);
    res.json({ user: toPublicUser(user), token });
  } catch (error) {
    logger.error('Google sign-in error:', error);
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const allowed = [
      'displayName',
      'avatarUrl',
      'nativeLanguage',
      'targetLevel',
      'grade',
      'board',
      'state',
      'learningGoal',
      'onboardingCompleted',
      'settings',
    ] as const;

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }

    const updated = await saveUser({ ...user, ...data });
    res.json({ user: toPublicUser(updated) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
