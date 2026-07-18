/**
 * Live attendance feed for a session. The lecturer's live dashboard polls
 * this every few seconds (Phase 5).
 */
import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  attendance,
  attendanceSessions,
  courses,
  users,
} from '@/lib/db/schema';
import { requireApiRole } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const guard = await requireApiRole('lecturer', 'admin');
  if (!guard.ok) return guard.response;

  const [row] = await db
    .select({
      id: attendanceSessions.id,
      lecturerId: courses.lecturerId,
    })
    .from(attendanceSessions)
    .innerJoin(courses, eq(courses.id, attendanceSessions.courseId))
    .where(eq(attendanceSessions.id, ctx.params.id))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (guard.user.role === 'lecturer' && row.lecturerId !== guard.user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const rows = await db
    .select({
      id: attendance.id,
      markedAt: attendance.markedAt,
      flagged: attendance.flagged,
      studentName: users.fullName,
      matricNo: users.matricNo,
    })
    .from(attendance)
    .innerJoin(users, eq(users.id, attendance.studentId))
    .where(eq(attendance.sessionId, ctx.params.id))
    .orderBy(asc(attendance.markedAt));

  return NextResponse.json({ attendance: rows });
}
