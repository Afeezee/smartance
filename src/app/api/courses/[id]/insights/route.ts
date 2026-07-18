/**
 * Weekly narrative insights for a course.
 *
 * We shape the raw attendance data into a compact per-student summary
 * (attendance rate, flagged count, recent trend) and hand it to Groq with a
 * strict prompt asking for a short narrative + at-risk list. Keeps the
 * prompt small and the response deterministic-ish.
 */
import { NextResponse } from 'next/server';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  attendance,
  attendanceSessions,
  courses,
  enrollments,
  users,
} from '@/lib/db/schema';
import { requireApiRole } from '@/lib/api';
import { groqChat } from '@/lib/groq';

export const runtime = 'nodejs';
// Insights can take a few seconds; extend the max function duration on Vercel.
export const maxDuration = 30;

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const guard = await requireApiRole('lecturer', 'admin');
  if (!guard.ok) return guard.response;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, ctx.params.id))
    .limit(1);
  if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  if (guard.user.role === 'lecturer' && course.lecturerId !== guard.user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Sessions in the last 7 days.
  const weekSessions = await db
    .select({ id: attendanceSessions.id, startedAt: attendanceSessions.startedAt })
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.courseId, course.id),
        gte(attendanceSessions.startedAt, sinceDate),
      ),
    )
    .orderBy(desc(attendanceSessions.startedAt));

  const totalSessions = weekSessions.length;

  // Per-student stats: total attended + flagged count over the same window.
  const perStudent = await db
    .select({
      studentId: users.id,
      name: users.fullName,
      matricNo: users.matricNo,
      attended: sql<number>`count(${attendance.id})::int`,
      flagged: sql<number>`sum(case when ${attendance.flagged} then 1 else 0 end)::int`,
    })
    .from(enrollments)
    .innerJoin(users, eq(users.id, enrollments.studentId))
    .leftJoin(
      attendance,
      and(
        eq(attendance.studentId, enrollments.studentId),
        sql`${attendance.sessionId} IN (
            SELECT id FROM ${attendanceSessions}
            WHERE ${attendanceSessions.courseId} = ${course.id}
              AND ${attendanceSessions.startedAt} >= ${sinceDate.toISOString()}
        )`,
      ),
    )
    .where(eq(enrollments.courseId, course.id))
    .groupBy(users.id, users.fullName, users.matricNo);

  if (totalSessions === 0) {
    return NextResponse.json({
      configured: !!process.env.GROQ_API_KEY,
      summary:
        totalSessions === 0
          ? 'No attendance sessions have run in the past 7 days — nothing to summarise yet.'
          : null,
      stats: { totalSessions, students: perStudent.length },
    });
  }

  const compact = perStudent.map((s) => ({
    name: s.name,
    matric: s.matricNo,
    attended: s.attended,
    flagged: s.flagged,
    rate: totalSessions ? Math.round((s.attended / totalSessions) * 100) : 0,
  }));

  const systemPrompt =
    'You are an academic assistant summarising a weekly class attendance report. ' +
    'Be concise, factual, and non-judgmental. Do not invent data. Use British English.';
  const userPrompt = [
    `Course: ${course.code} — ${course.title}`,
    `Sessions in the past 7 days: ${totalSessions}`,
    `Per-student attendance (name, attended/${totalSessions}, rate%, flagged):`,
    ...compact.map(
      (s) => `- ${s.name} (${s.matric ?? '—'}): ${s.attended}/${totalSessions}, ${s.rate}%, ${s.flagged} flagged`,
    ),
    '',
    'Produce:',
    '1) One-paragraph overall trend (attendance direction, participation quality).',
    '2) A short at-risk list of students at 60% or lower — one line each, no advice.',
    '3) An anomalies section for any student with 2+ flagged records — factual only.',
  ].join('\n');

  const groq = await groqChat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  if (!groq.ok) {
    return NextResponse.json({
      configured: !!process.env.GROQ_API_KEY,
      summary: null,
      error: groq.error,
      stats: { totalSessions, students: perStudent.length },
    });
  }

  return NextResponse.json({
    configured: true,
    summary: groq.content,
    stats: { totalSessions, students: perStudent.length },
  });
}
