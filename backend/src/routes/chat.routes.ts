import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { availableEngines, generateTutorReply, TutorEngine } from '../services/tutor.service';
import { logger } from '../utils/logger';
import { findUserByAuth } from '../utils/findUser';
import { recordUserActivity } from '../utils/streak';
import { saveUser } from '../utils/persistUser';
import { awardActivity } from '../services/gamification.service';
import { canUseClaudeEngine, checkAiUsage, recordAiUsage } from '../services/subscription.service';

const router = Router();

router.get('/engines', (_req, res: Response) => {
  res.json(availableEngines());
});

router.get('/sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const sessions = await prisma.chatSession.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.post('/sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { title, type = 'free', roleplayId } = req.body;
    const session = await prisma.chatSession.create({
      data: {
        userId: user.id,
        title: title ?? 'New Conversation',
        type,
        roleplayId,
      },
      include: { messages: true },
    });
    res.status(201).json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.post('/message', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, message, systemPrompt, engine } = req.body as {
      sessionId?: string;
      message?: string;
      systemPrompt?: string;
      engine?: TutorEngine;
    };
    if (!message?.trim()) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const usage = checkAiUsage(user);
    if (!usage.allowed) {
      res.status(429).json({
        error: 'Aaj ka free limit khatam ho gaya — kal phir try karo, ya Premium lo unlimited practice ke liye.',
        limitReached: true,
        usage,
      });
      return;
    }

    const requestedEngine = engine === 'claude' && !canUseClaudeEngine(user) ? 'gemini' : engine;
    const claudeDowngraded = engine === 'claude' && requestedEngine === 'gemini';

    let session = sessionId
      ? await prisma.chatSession.findFirst({
          where: { id: sessionId, userId: user.id },
          include: { messages: { orderBy: { timestamp: 'asc' } } },
        })
      : null;

    if (!session) {
      session = await prisma.chatSession.create({
        data: { userId: user.id, title: message.slice(0, 50) },
        include: { messages: true },
      });
    }

    const history = session.messages.map((m) => ({ role: m.role, content: m.content }));

    const aiResponse = await generateTutorReply(requestedEngine, message, history, systemPrompt, user.id);

    await prisma.chatMessage.createMany({
      data: [
        { sessionId: session.id, role: 'user', content: message },
        {
          sessionId: session.id,
          role: 'assistant',
          content: aiResponse.reply,
          corrections: aiResponse.corrections,
        },
      ],
    });
    session = await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    await prisma.progress.create({
      data: {
        userId: user.id,
        minutesSpent: 1,
        score: aiResponse.corrections.length === 0 ? 100 : 70,
        activityType: 'chat',
      },
    });

    recordUserActivity(user, 1);
    recordAiUsage(user);
    const rewards = awardActivity(user, 'chat', aiResponse.corrections.length === 0 ? 100 : 70);
    await saveUser(user);

    res.json({
      session,
      reply: aiResponse.reply,
      corrections: aiResponse.corrections,
      translation: aiResponse.translation,
      wasHindi: aiResponse.wasHindi,
      teachingTip: aiResponse.teachingTip,
      engineUsed: aiResponse.engineUsed,
      claudeDowngraded,
      rewards,
    });
  } catch (error) {
    logger.error('Chat message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
