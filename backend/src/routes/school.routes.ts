import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import {
  canManageClass,
  inviteStudent,
  refreshSchoolLicense,
  seatsUsed,
  uniqueJoinCode,
} from '../services/school.service';

const router = Router();
router.use(authMiddleware);

const WEEK = 7 * 24 * 60 * 60 * 1000;

// ── Teacher side ───────────────────────────────────────────────────────────

// GET /api/school/me — schools I teach at, with their classes.
router.get('/me', async (req: AuthRequest, res: Response) => {
  const roles = await prisma.schoolStaff.findMany({
    where: { userId: req.user!.uid },
    include: {
      school: {
        include: {
          classrooms: { orderBy: { createdAt: 'desc' }, include: { _count: { select: { members: true, assignments: true } } } },
        },
      },
    },
  });
  const schools = await Promise.all(
    roles.map(async (r) => ({
      id: r.school.id,
      name: r.school.name,
      role: r.role,
      seats: r.school.seats,
      seatsUsed: await seatsUsed(r.school.id),
      licenseExpiresAt: r.school.licenseExpiresAt,
      classes: r.school.classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        joinCode: c.joinCode,
        students: c._count.members,
        assignments: c._count.assignments,
      })),
    }))
  );
  res.json({ schools });
});

router.post('/classes', async (req: AuthRequest, res: Response) => {
  const body = z.object({ schoolId: z.string(), name: z.string().trim().min(2).max(60), grade: z.string().trim().max(20).optional() }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'Class ka naam likho' });
    return;
  }
  const staff = await prisma.schoolStaff.findUnique({ where: { schoolId_userId: { schoolId: body.data.schoolId, userId: req.user!.uid } } });
  if (!staff) {
    res.status(403).json({ error: 'Aap is school ke teacher nahi ho' });
    return;
  }
  const cls = await prisma.classroom.create({
    data: { schoolId: body.data.schoolId, teacherId: req.user!.uid, name: body.data.name, grade: body.data.grade, joinCode: await uniqueJoinCode() },
  });
  res.status(201).json({ class: cls });
});

// GET /api/school/classes/:id — roster with each student's last-7-days progress, and assignments.
router.get('/classes/:id', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  if (!(await canManageClass(req.user!.uid, id))) {
    res.status(403).json({ error: 'Access nahi hai' });
    return;
  }
  const cls = await prisma.classroom.findUnique({
    where: { id },
    include: {
      school: { select: { name: true } },
      members: {
        include: { user: { select: { id: true, displayName: true, email: true, streak: true, lessonsCompleted: true, lastActiveAt: true, deletedAt: true } } },
      },
      assignments: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!cls) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }
  const memberIds = cls.members.map((m) => m.userId);
  const since = new Date(Date.now() - WEEK);
  const [recent, lessonRows, lessonTitles] = await Promise.all([
    prisma.progress.groupBy({ by: ['userId'], where: { userId: { in: memberIds }, date: { gte: since } }, _sum: { minutesSpent: true }, _avg: { score: true } }),
    prisma.progress.findMany({
      where: { userId: { in: memberIds }, activityType: 'lesson', lessonId: { in: cls.assignments.map((a) => a.lessonId) } },
      select: { userId: true, lessonId: true, date: true },
    }),
    prisma.lesson.findMany({ where: { id: { in: cls.assignments.map((a) => a.lessonId) } }, select: { id: true, title: true } }),
  ]);
  const byUser = new Map(recent.map((r) => [r.userId, r]));
  const title = new Map(lessonTitles.map((l) => [l.id, l.title]));

  res.json({
    class: { id: cls.id, name: cls.name, grade: cls.grade, joinCode: cls.joinCode, school: cls.school.name },
    students: cls.members
      .filter((m) => !m.user.deletedAt)
      .map((m) => ({
        id: m.user.id,
        name: m.user.displayName,
        email: m.user.email,
        streak: m.user.streak,
        lessonsCompleted: m.user.lessonsCompleted,
        lastActiveAt: m.user.lastActiveAt,
        minutes7d: byUser.get(m.userId)?._sum.minutesSpent ?? 0,
        avgScore7d: byUser.get(m.userId)?._avg.score ? Math.round(byUser.get(m.userId)!._avg.score!) : null,
      })),
    assignments: cls.assignments.map((a) => {
      const done = new Set(lessonRows.filter((p) => p.lessonId === a.lessonId && p.date >= a.createdAt).map((p) => p.userId));
      return { id: a.id, lessonId: a.lessonId, title: title.get(a.lessonId) ?? 'Lesson', note: a.note, dueAt: a.dueAt, completed: done.size, total: memberIds.length };
    }),
  });
});

router.post('/classes/:id/assignments', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  if (!(await canManageClass(req.user!.uid, id))) {
    res.status(403).json({ error: 'Access nahi hai' });
    return;
  }
  const body = z.object({ lessonId: z.string(), note: z.string().max(200).optional(), dueAt: z.string().datetime().optional() }).safeParse(req.body);
  if (!body.success || !(await prisma.lesson.findUnique({ where: { id: body.success ? body.data.lessonId : '' } }))) {
    res.status(400).json({ error: 'Sahi lesson chuno' });
    return;
  }
  const a = await prisma.assignment.create({
    data: { classroomId: id, lessonId: body.data.lessonId, note: body.data.note, dueAt: body.data.dueAt ? new Date(body.data.dueAt) : null },
  });
  res.status(201).json({ assignment: a });
});

// POST /api/school/classes/:id/students { students: [{ name, email }] } — bulk add (e.g. from a CSV).
router.post('/classes/:id/students', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  if (!(await canManageClass(req.user!.uid, id))) {
    res.status(403).json({ error: 'Access nahi hai' });
    return;
  }
  const body = z
    .object({ students: z.array(z.object({ name: z.string().trim().min(1).max(80), email: z.string().trim().email() })).min(1).max(200) })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'Har student ka naam aur sahi email chahiye (max 200 ek baar mein)' });
    return;
  }
  const cls = await prisma.classroom.findUnique({ where: { id }, include: { school: true } });
  if (!cls) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }

  const results: Array<{ email: string; status: 'added' | 'already' | 'no_seat' | 'failed' }> = [];
  let used = await seatsUsed(cls.schoolId);
  for (const s of body.data.students) {
    try {
      const { userId } = await inviteStudent(s);
      const existing = await prisma.classMember.findUnique({ where: { classroomId_userId: { classroomId: id, userId } } });
      if (existing) {
        results.push({ email: s.email, status: 'already' });
        continue;
      }
      const inSchool = await prisma.classMember.findFirst({ where: { userId, classroom: { schoolId: cls.schoolId } } });
      if (!inSchool && used >= cls.school.seats) {
        results.push({ email: s.email, status: 'no_seat' });
        continue;
      }
      await prisma.classMember.create({ data: { classroomId: id, userId } });
      if (!inSchool) used += 1;
      await refreshSchoolLicense(userId);
      results.push({ email: s.email, status: 'added' });
    } catch (error) {
      logger.error(`Bulk add failed for one student in class ${id}`, error);
      results.push({ email: s.email, status: 'failed' });
    }
  }
  res.json({ results, seatsUsed: used, seats: cls.school.seats });
});

router.delete('/classes/:id/students/:userId', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  if (!(await canManageClass(req.user!.uid, id))) {
    res.status(403).json({ error: 'Access nahi hai' });
    return;
  }
  const userId = String(req.params.userId);
  await prisma.classMember.deleteMany({ where: { classroomId: id, userId } });
  await refreshSchoolLicense(userId);
  res.json({ removed: true });
});

// ── Student side ───────────────────────────────────────────────────────────

// POST /api/school/join { code } — join a class with the code the teacher shared.
router.post('/join', async (req: AuthRequest, res: Response) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const cls = code ? await prisma.classroom.findUnique({ where: { joinCode: code }, include: { school: true } }) : null;
  if (!cls) {
    res.status(404).json({ error: 'Yeh class code nahi mila. Teacher se dobara poochho.' });
    return;
  }
  const userId = req.user!.uid;
  const already = await prisma.classMember.findUnique({ where: { classroomId_userId: { classroomId: cls.id, userId } } });
  if (!already) {
    const inSchool = await prisma.classMember.findFirst({ where: { userId, classroom: { schoolId: cls.schoolId } } });
    if (!inSchool && (await seatsUsed(cls.schoolId)) >= cls.school.seats) {
      res.status(409).json({ error: 'School ki saari seats bhar gayi hain. Teacher ko batao.' });
      return;
    }
    await prisma.classMember.create({ data: { classroomId: cls.id, userId } });
    await refreshSchoolLicense(userId);
  }
  res.json({ class: { id: cls.id, name: cls.name, school: cls.school.name } });
});

// GET /api/school/my — my classes and their homework, with what I've finished.
router.get('/my', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.uid;
  const memberships = await prisma.classMember.findMany({
    where: { userId },
    include: { classroom: { include: { school: { select: { name: true, licenseExpiresAt: true } }, assignments: { orderBy: { createdAt: 'desc' }, take: 20 } } } },
  });
  const lessonIds = memberships.flatMap((m) => m.classroom.assignments.map((a) => a.lessonId));
  const [done, lessons] = await Promise.all([
    prisma.progress.findMany({ where: { userId, activityType: 'lesson', lessonId: { in: lessonIds } }, select: { lessonId: true, date: true } }),
    prisma.lesson.findMany({ where: { id: { in: lessonIds } }, select: { id: true, title: true, durationMinutes: true } }),
  ]);
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  res.json({
    classes: memberships.map((m) => ({
      id: m.classroom.id,
      name: m.classroom.name,
      school: m.classroom.school.name,
      premiumUntil: m.classroom.school.licenseExpiresAt,
      homework: m.classroom.assignments.map((a) => ({
        id: a.id,
        lessonId: a.lessonId,
        title: lessonById.get(a.lessonId)?.title ?? 'Lesson',
        minutes: lessonById.get(a.lessonId)?.durationMinutes ?? null,
        note: a.note,
        dueAt: a.dueAt,
        done: done.some((d) => d.lessonId === a.lessonId && d.date >= a.createdAt),
      })),
    })),
  });
});

export default router;
