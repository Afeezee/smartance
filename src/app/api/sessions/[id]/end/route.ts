import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attendanceSessions, courses } from '@/lib/db/schema';
import { requireApiRole } from '@/lib/api';

export const runtime = 'nodejs';

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const guard = await requireApiRole('lecturer');
  if (!guard.ok) return guard.response;

  // Verify ownership via the join.
  const [row] = await db
    .select({ id: attendanceSessions.id, lecturerId: courses.lecturerId })
    .from(attendanceSessions)
    .innerJoin(courses, eq(courses.id, attendanceSessions.courseId))
    .where(eq(attendanceSessions.id, ctx.params.id))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (row.lecturerId !== guard.user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  await db
    .update(attendanceSessions)
    .set({ status: 'ended', endsAt: new Date() })
    .where(eq(attendanceSessions.id, ctx.params.id));

  return NextResponse.json({ ok: true });
}
