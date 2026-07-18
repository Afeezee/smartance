/**
 * CSV export of all attendance for a course. Streamed as text/csv so it
 * downloads directly. Lecturer (owning course) or admin only.
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

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Wrap in quotes if the value contains a comma, quote, or newline; double any inner quotes.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const guard = await requireApiRole('lecturer', 'admin');
  if (!guard.ok) return guard.response;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, ctx.params.id))
    .limit(1);
  if (!course) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (guard.user.role === 'lecturer' && course.lecturerId !== guard.user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const rows = await db
    .select({
      sessionId: attendanceSessions.id,
      sessionStart: attendanceSessions.startedAt,
      studentName: users.fullName,
      matricNo: users.matricNo,
      email: users.email,
      markedAt: attendance.markedAt,
      flagged: attendance.flagged,
      latitude: attendance.latitude,
      longitude: attendance.longitude,
    })
    .from(attendance)
    .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendance.sessionId))
    .innerJoin(users, eq(users.id, attendance.studentId))
    .where(eq(attendanceSessions.courseId, course.id))
    .orderBy(asc(attendanceSessions.startedAt), asc(attendance.markedAt));

  const headers = [
    'session_id',
    'session_started_at',
    'student_name',
    'matric_no',
    'email',
    'marked_at',
    'flagged',
    'latitude',
    'longitude',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.sessionId,
        r.sessionStart instanceof Date ? r.sessionStart.toISOString() : r.sessionStart,
        r.studentName,
        r.matricNo,
        r.email,
        r.markedAt instanceof Date ? r.markedAt.toISOString() : r.markedAt,
        r.flagged ? 'true' : 'false',
        r.latitude ?? '',
        r.longitude ?? '',
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  const csv = lines.join('\r\n') + '\r\n';

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${course.code}-attendance.csv"`,
    },
  });
}
