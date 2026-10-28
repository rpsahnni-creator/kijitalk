import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ROLEPLAY_SCENARIOS, getRoleplayById } from '../data/roleplayScenarios';
import { prisma } from '../config/prisma';
import { generateTutorReply, TutorEngine } from '../services/tutor.service';
import { findUserByAuth } from '../utils/findUser';
import { recordUserActivity } from '../utils/streak';
import { saveUser } from '../utils/persistUser';
import { canUseClaudeEngine, checkAiUsage, recordAiUsage } from '../services/subscription.service';

const router = Router();

router.get('/', (_req, res: Response) => {
  res.json({ scenarios: ROLEPLAY_SCENARIOS });
});

router.get('/:id', (req, res: Response) => {
  const scenario = getRoleplayById(String(req.params.id));
  if (!scenario) {
    res.status(404).json({ error: 'Scenario not found' });
    return;
  }
  res.json({ scenario });
});

router.post('/:id/start', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const scenario = getRoleplayById(String(req.params.id));
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    const user = await findUserByAuth(req);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const session = await prisma.chatSession.create({
      data: {
        userId: user.id,
        title: scenario.title,
        type: 'roleplay',
        roleplayId: scenario.id,
        messages: {
          create: [{ role: 'assistant', content: scenario.openingLine }],
        },
      },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    res.status(201).json({ session, scenario });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start roleplay' });
  }
});

router.post('/:id/message', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const scenario = getRoleplayById(String(req.params.id));
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    const { sessionId, message, engine } = req.body as { sessionId?: string; message: string; engine?: TutorEngine };
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

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: user.id },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const history = session.messages.map((m) => ({ role: m.role, content: m.content }));

    const aiResponse = await generateTutorReply(requestedEngine, message, history, scenario.systemPrompt, user.id);

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
    const updatedSession = await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    await prisma.progress.create({
      data: {
        userId: user.id,
        minutesSpent: 2,
        score: 80,
        activityType: 'roleplay',
        metadata: { roleplayId: scenario.id },
      },
    });

    recordUserActivity(user, 2);
    recordAiUsage(user);
    await saveUser(user);

    res.json({
      reply: aiResponse.reply,
      corrections: aiResponse.corrections,
      translation: aiResponse.translation,
      wasHindi: aiResponse.wasHindi,
      teachingTip: aiResponse.teachingTip,
      engineUsed: aiResponse.engineUsed,
      session: updatedSession,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process roleplay message' });
  }
});

export default router;
