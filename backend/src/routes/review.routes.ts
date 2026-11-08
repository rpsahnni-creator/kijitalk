import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { dueReviews, reviewStats, submitReview } from '../services/review.service';

const router = Router();
router.use(authMiddleware);

// GET /api/review — today's revision cards (your own past mistakes) and counts.
router.get('/', async (req: AuthRequest, res: Response) => {
  const [cards, stats] = await Promise.all([dueReviews(req.user!.uid), reviewStats(req.user!.uid)]);
  res.json({ cards, stats });
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  res.json(await reviewStats(req.user!.uid));
});

// POST /api/review/:id { answer } — check the corrected sentence and reschedule.
router.post('/:id', async (req: AuthRequest, res: Response) => {
  const answer = typeof req.body?.answer === 'string' ? req.body.answer : '';
  const result = await submitReview(req.user!.uid, String(req.params.id), answer);
  if (!result) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }
  res.json(result);
});

export default router;
