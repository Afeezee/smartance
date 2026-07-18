/**
 * Student's own attendance history. The student is always implicit — they
 * cannot query anyone else's history.
 */
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  attendance,
  attendanceSessions,
  courses,
} from '@/lib/db/schema';
import { requireApiRole } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET() {
  const guard = await requireApiRole('student');
  if (!guard.ok) return guard.response;

  const rows = await db
    .select({
      id: attendance.id,
      markedAt: attendance.markedAt,
      flagged: attendance.flagged,
      code: courses.code,
      title: courses.title,
    })
    .from(attendance)
    .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendance.sessionId))
    .innerJoin(courses, eq(courses.id, attendanceSessions.courseId))
    .where(eq(attendance.studentId, guard.user.id))
    .orderBy(desc(attendance.markedAt))
    .limit(50);

  return NextResponse.json({ attendance: rows });
}
