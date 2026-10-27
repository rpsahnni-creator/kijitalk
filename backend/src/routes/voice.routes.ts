import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { analyzePronunciation } from '../services/gemini.service';
import { transcribeAudio, synthesizeSpeech } from '../services/speech.service';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { findUserByAuth } from '../utils/findUser';
import { recordUserActivity } from '../utils/streak';
import { saveUser } from '../utils/persistUser';

const router = Router();

router.post('/transcribe', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { audio } = req.body;
    if (!audio) {
      res.status(400).json({ error: 'Audio data required (base64)' });
      return;
    }
    const result = await transcribeAudio(audio);
    res.json(result);
  } catch (error) {
    logger.error('Transcribe error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

router.post('/synthesize', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }
    const result = await synthesizeSpeech(text, voice);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Speech synthesis failed' });
  }
});

router.post('/pronunciation', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { expected, spoken, audio } = req.body;
    if (!expected) {
      res.status(400).json({ error: 'Expected text is required' });
      return;
    }

    let transcribed = spoken;
    if (audio && !spoken) {
      const transcription = await transcribeAudio(audio);
      transcribed = transcription.text;
    }

    if (!transcribed) {
      res.status(400).json({ error: 'Spoken text or audio required' });
      return;
    }

    const result = await analyzePronunciation(expected, transcribed);

    const user = await findUserByAuth(req);
    if (user) {
      await prisma.progress.create({
        data: {
          userId: user.id,
          minutesSpent: 2,
          score: result.score,
          pronunciationScore: result.score,
          activityType: 'voice',
          metadata: { expected, spoken: transcribed },
        },
      });
      recordUserActivity(user, 2);
      await saveUser(user);
    }

    res.json({ ...result, transcribed });
  } catch (error) {
    logger.error('Pronunciation error:', error);
    res.status(500).json({ error: 'Pronunciation analysis failed' });
  }
});

export default router;
