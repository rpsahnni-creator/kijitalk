import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateTutorReply, TutorEngine } from '../services/tutor.service';
import { findUserByAuth } from '../utils/findUser';
import { saveUser } from '../utils/persistUser';
import { awardActivity } from '../services/gamification.service';
import { recordUserActivity } from '../utils/streak';

const DEBATE_TOPICS = [
  { id: 'phones-school', topic: 'Should mobile phones be allowed in schools?', level: 'intermediate' },
  { id: 'english-mandatory', topic: 'Should English be mandatory in all Indian states?', level: 'advanced' },
  { id: 'online-classes', topic: 'Are online classes better than offline classes?', level: 'beginner' },
  { id: 'cricket-india', topic: 'Is cricket the most important sport in India?', level: 'beginner' },
  { id: 'exams-stress', topic: 'Do board exams cause too much stress?', level: 'intermediate' },
];

const DEBATE_SYSTEM = `You are Kiki, a debate coach for Indian students learning English.
The student is practicing structured debate in English. Give a short counter-argument or follow-up question (2-3 sentences).
Encourage clear English. List grammar corrections if needed.
Return JSON: { "reply": "...", "corrections": [], "translation": null, "wasHindi": false }`;

const router = Router();

router.get('/topics', (_req, res: Response) => {
  res.json({ topics: DEBATE_TOPICS });
});

router.post('/message', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { topicId, message, history = [], engine } = req.body as {
      topicId: string;
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      engine?: TutorEngine;
    };

    const topic = DEBATE_TOPICS.find((t) => t.id === topicId);
    if (!topic || !message?.trim()) {
      res.status(400).json({ error: 'Topic and message required' });
      return;
    }

    const user = await findUserByAuth(req);
    const prompt = `[Debate topic: ${topic.topic}] Student says: ${message}`;

    const aiResponse = await generateTutorReply(engine, prompt, history, DEBATE_SYSTEM, user?.id);

    if (user) {
      awardActivity(user, 'debate', 85);
      recordUserActivity(user, 2);
      await saveUser(user);
    }

    res.json({
      topic,
      reply: aiResponse.reply,
      corrections: aiResponse.corrections,
      translation: aiResponse.translation,
    });
  } catch {
    res.status(500).json({ error: 'Debate message failed' });
  }
});

export default router;
