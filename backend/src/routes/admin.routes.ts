import { Router, Response } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { getAiHealth, getAiUsageStats } from '../services/aiMonitor.service';
import { embedText } from '../services/embedding.service';
import { prisma } from '../config/prisma';
import { PLANS } from '../config/plans';
import { logger } from '../utils/logger';
import { refreshSchoolLicenses, seatsUsed } from '../services/school.service';
import adminUsersRoutes from './adminUsers.routes';

const router = Router();
router.use(authMiddleware, requireAdmin);
router.use(adminUsersRoutes); // /users/:id, /users/:id/actions, /audit

const DAY = 24 * 60 * 60 * 1000;

// GET /api/admin/me — lets the web app know whether to show the admin panel.
router.get('/me', (_req: AuthRequest, res: Response) => {
  res.json({ admin: true });
});

// GET /api/admin/overview — headline numbers for the dashboard.
router.get('/overview', async (_req: AuthRequest, res: Response) => {
  try {
    const now = Date.now();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const live = { deletedAt: null } as const;

    const [total, new7d, active7d, active1d, premium, liveSubs, revenueMonth, revenueAll] = await Promise.all([
      prisma.user.count({ where: live }),
      prisma.user.count({ where: { ...live, createdAt: { gte: new Date(now - 7 * DAY) } } }),
      prisma.user.count({ where: { ...live, lastActiveAt: { gte: new Date(now - 7 * DAY) } } }),
      prisma.user.count({ where: { ...live, lastActiveAt: { gte: new Date(now - DAY) } } }),
      prisma.user.count({
        where: {
          ...live,
          OR: [
            { subscriptionTier: 'premium', subscriptionExpiresAt: { gt: new Date() } },
            { schoolLicenseUntil: { gt: new Date() } },
            { premiumGrantUntil: { gt: new Date() } },
          ],
        },
      }),
      prisma.subscription.count({ where: { status: { in: ['active', 'authenticated', 'pending'] }, cancelAtPeriodEnd: false } }),
      prisma.payment.aggregate({ where: { status: { in: ['paid', 'refunded'] }, createdAt: { gte: monthStart } }, _sum: { amountInr: true, refundedPaise: true } }),
      prisma.payment.aggregate({ where: { status: { in: ['paid', 'refunded'] } }, _sum: { amountInr: true, refundedPaise: true } }),
    ]);

    res.json({
      users: { total, new7d, active7d, active1d, premium },
      revenue: {
        mrrInr: liveSubs * PLANS.premium.priceInr,
        activeSubscriptions: liveSubs,
        // Net of refunds.
        thisMonthInr: (revenueMonth._sum.amountInr ?? 0) - Math.round((revenueMonth._sum.refundedPaise ?? 0) / 100),
        allTimeInr: (revenueAll._sum.amountInr ?? 0) - Math.round((revenueAll._sum.refundedPaise ?? 0) / 100),
      },
      conversionPercent: total ? Math.round((premium / total) * 1000) / 10 : 0,
    });
  } catch (error) {
    logger.error('Admin overview failed', error);
    res.status(500).json({ error: 'Could not load overview' });
  }
});

// GET /api/admin/users?q=&page= — searchable learner list.
router.get('/users', async (req: AuthRequest, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const filter = typeof req.query.filter === 'string' ? req.query.filter : '';
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = 25;
  const now = new Date();
  const premium: Prisma.UserWhereInput = {
    OR: [
      { subscriptionTier: 'premium', subscriptionExpiresAt: { gt: now } },
      { schoolLicenseUntil: { gt: now } },
      { premiumGrantUntil: { gt: now } },
    ],
  };
  const FILTERS: Record<string, Prisma.UserWhereInput> = {
    suspended: { suspendedAt: { not: null } },
    premium,
    free: { NOT: premium },
    inactive: { lastActiveAt: { lt: new Date(now.getTime() - 14 * DAY) } },
  };
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    AND: [
      q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }] } : {},
      FILTERS[filter] ?? {},
    ],
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        displayName: true,
        email: true,
        grade: true,
        state: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        streak: true,
        xp: true,
        lessonsCompleted: true,
        createdAt: true,
        lastActiveAt: true,
        schoolLicenseUntil: true,
        premiumGrantUntil: true,
        suspendedAt: true,
      },
    }),
  ]);
  res.json({ total, page, pageSize, users });
});

// GET /api/admin/revenue — paid totals per month (last 12) and recent invoices.
router.get('/revenue', async (_req: AuthRequest, res: Response) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);
  const [payments, invoices] = await Promise.all([
    prisma.payment.findMany({ where: { status: 'paid', createdAt: { gte: since } }, select: { amountInr: true, createdAt: true } }),
    prisma.invoice.findMany({
      orderBy: { issuedAt: 'desc' },
      take: 20,
      select: { id: true, number: true, issuedAt: true, buyerName: true, totalPaise: true, placeOfSupply: true },
    }),
  ]);
  const months: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    months[d.toISOString().slice(0, 7)] = 0;
  }
  for (const p of payments) {
    const key = p.createdAt.toISOString().slice(0, 7);
    if (key in months) months[key] += p.amountInr;
  }
  res.json({ monthly: Object.entries(months).map(([month, inr]) => ({ month, inr })), invoices });
});

// GET /api/admin/ai — provider health plus usage for the last 24 hours and 7 days.
router.get('/ai', async (_req: AuthRequest, res: Response) => {
  try {
    const [day, week] = await Promise.all([getAiUsageStats(24), getAiUsageStats(24 * 7)]);
    res.json({ health: getAiHealth(), last24h: day, last7d: week });
  } catch (error) {
    logger.error('Admin AI stats failed', error);
    res.status(500).json({ error: 'Could not load AI stats' });
  }
});

// ── Lessons ────────────────────────────────────────────────────────────────

const exerciseSchema = z
  .object({
    type: z.enum(['repeat', 'fill-blank', 'translate', 'mcq', 'match', 'word-bank', 'listen-type']),
    prompt: z.string().min(1),
    promptHindi: z.string().optional(),
    answer: z.string(),
    options: z.array(z.string()).optional(),
    pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
    words: z.array(z.string()).optional(),
  })
  .passthrough();

const lessonSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(500),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string().trim().min(2).max(80),
  durationMinutes: z.number().int().min(1).max(120),
  vocabulary: z.array(z.string().trim().min(1)).max(50).default([]),
  phrases: z.array(z.string().trim().min(1)).max(50).default([]),
  exercises: z.array(exerciseSchema).max(40).default([]),
  gradeBand: z.string().trim().max(20).nullable().optional(),
  isActive: z.boolean().default(true),
});

async function withEmbedding<T extends { title: string; description: string; category: string; vocabulary: string[]; phrases: string[] }>(
  data: T
) {
  // Keeps lesson search/RAG accurate after edits; skipped if the AI key is down.
  const vector = await embedText(
    [data.title, data.description, data.category, data.vocabulary.join(', '), data.phrases.join(' ')].join('\n')
  ).catch(() => null);
  return vector ? { ...data, embedding: vector } : data;
}

router.get('/lessons', async (req: AuthRequest, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const lessons = await prisma.lesson.findMany({
    where: q
      ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { category: { contains: q, mode: 'insensitive' } }] }
      : {},
    orderBy: [{ isActive: 'desc' }, { order: 'asc' }, { title: 'asc' }],
    take: 100,
    select: { id: true, title: true, category: true, level: true, durationMinutes: true, isActive: true, updatedAt: true },
  });
  res.json({ lessons });
});

router.get('/lessons/:id', async (req: AuthRequest, res: Response) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: String(req.params.id) }, omit: { embedding: true } });
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }
  res.json({ lesson });
});

router.post('/lessons', async (req: AuthRequest, res: Response) => {
  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid lesson', fields: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const data = await withEmbedding(parsed.data);
    const lesson = await prisma.lesson.create({ data: { ...data, exercises: data.exercises as Prisma.InputJsonValue } });
    res.status(201).json({ lesson: { id: lesson.id, title: lesson.title } });
  } catch (error) {
    const duplicate = (error as { code?: string }).code === 'P2002';
    res.status(duplicate ? 409 : 500).json({ error: duplicate ? 'Is title ka lesson pehle se hai' : 'Lesson save nahi hua' });
  }
});

router.patch('/lessons/:id', async (req: AuthRequest, res: Response) => {
  const parsed = lessonSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid lesson', fields: parsed.error.flatten().fieldErrors });
    return;
  }
  const existing = await prisma.lesson.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }
  try {
    const { exercises, ...fields } = parsed.data;
    const update: Prisma.LessonUpdateInput = {
      ...fields,
      ...(exercises ? { exercises: exercises as Prisma.InputJsonValue } : {}),
    };
    // Re-embed when searchable text changes, using the merged (old + new) lesson.
    const contentChanged = ['title', 'description', 'category', 'vocabulary', 'phrases'].some((k) => k in parsed.data);
    if (contentChanged) {
      const { embedding } = (await withEmbedding({ ...existing, ...parsed.data })) as { embedding?: number[] };
      if (embedding && embedding !== existing.embedding) update.embedding = embedding;
    }
    const lesson = await prisma.lesson.update({ where: { id: existing.id }, data: update });
    res.json({ lesson: { id: lesson.id, title: lesson.title, isActive: lesson.isActive } });
  } catch (error) {
    logger.error('Lesson update failed', error);
    res.status(500).json({ error: 'Lesson save nahi hua' });
  }
});

// ── Schools (B2B licences) ─────────────────────────────────────────────────

const schoolSchema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().max(60).optional(),
  state: z.string().trim().max(60).optional(),
  contactEmail: z.string().trim().email().optional(),
  gstin: z.string().trim().max(15).optional(),
  seats: z.number().int().min(0).max(100000),
  licenseExpiresAt: z.string().datetime().nullable().optional(),
  ownerEmail: z.string().trim().email(),
});

router.get('/schools', async (_req: AuthRequest, res: Response) => {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: 'desc' },
    include: { staff: { include: { user: { select: { email: true } } } }, _count: { select: { classrooms: true } } },
  });
  res.json({
    schools: await Promise.all(
      schools.map(async (sc) => ({
        id: sc.id,
        name: sc.name,
        city: sc.city,
        state: sc.state,
        seats: sc.seats,
        seatsUsed: await seatsUsed(sc.id),
        licenseExpiresAt: sc.licenseExpiresAt,
        classes: sc._count.classrooms,
        staff: sc.staff.map((st) => ({ email: st.user.email, role: st.role })),
      }))
    ),
  });
});

router.post('/schools', async (req: AuthRequest, res: Response) => {
  const parsed = schoolSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid school', fields: parsed.error.flatten().fieldErrors });
    return;
  }
  const { ownerEmail, licenseExpiresAt, ...data } = parsed.data;
  // The owner may not have signed up yet: their profile links by email when they do.
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail.toLowerCase() },
    update: {},
    create: { email: ownerEmail.toLowerCase(), displayName: 'Teacher' },
  });
  const school = await prisma.school.create({
    data: { ...data, licenseExpiresAt: licenseExpiresAt ? new Date(licenseExpiresAt) : null, staff: { create: { userId: owner.id, role: 'owner' } } },
  });
  res.status(201).json({ school: { id: school.id, name: school.name } });
});

router.patch('/schools/:id', async (req: AuthRequest, res: Response) => {
  const parsed = schoolSchema.partial().omit({ ownerEmail: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid school', fields: parsed.error.flatten().fieldErrors });
    return;
  }
  const { licenseExpiresAt, ...data } = parsed.data;
  const school = await prisma.school.update({
    where: { id: String(req.params.id) },
    data: { ...data, ...(licenseExpiresAt !== undefined ? { licenseExpiresAt: licenseExpiresAt ? new Date(licenseExpiresAt) : null } : {}) },
  });
  // Licence changes flow through to every enrolled student's Premium access.
  if (licenseExpiresAt !== undefined) await refreshSchoolLicenses(school.id);
  res.json({ school: { id: school.id, seats: school.seats, licenseExpiresAt: school.licenseExpiresAt } });
});

// Add another teacher to a school.
router.post('/schools/:id/staff', async (req: AuthRequest, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email.includes('@')) {
    res.status(400).json({ error: 'Valid email required' });
    return;
  }
  const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email, displayName: 'Teacher' } });
  await prisma.schoolStaff.upsert({
    where: { schoolId_userId: { schoolId: String(req.params.id), userId: user.id } },
    update: {},
    create: { schoolId: String(req.params.id), userId: user.id, role: req.body?.role === 'owner' ? 'owner' : 'teacher' },
  });
  res.status(201).json({ added: true });
});

export default router;
