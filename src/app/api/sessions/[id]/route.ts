import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attendanceSessions, courses } from '@/lib/db/schema';
import { requireApiRole } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const guard = await requireApiRole('lecturer', 'admin', 'student');
  if (!guard.ok) return guard.response;

  const [row] = await db
    .select({
      id: attendanceSessions.id,
      courseId: attendanceSessions.courseId,
      courseCode: courses.code,
      courseTitle: courses.title,
      startedAt: attendanceSessions.startedAt,
      endsAt: attendanceSessions.endsAt,
      status: attendanceSessions.status,
      geofenceLat: attendanceSessions.geofenceLat,
      geofenceLng: attendanceSessions.geofenceLng,
      radiusM: attendanceSessions.radiusM,
      lecturerId: courses.lecturerId,
    })
    .from(attendanceSessions)
    .innerJoin(courses, eq(courses.id, attendanceSessions.courseId))
    .where(eq(attendanceSessions.id, ctx.params.id))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  // Lecturers can only see sessions on courses they own.
  if (guard.user.role === 'lecturer' && row.lecturerId !== guard.user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  return NextResponse.json({ session: row });
}
