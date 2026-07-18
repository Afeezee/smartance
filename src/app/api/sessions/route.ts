/**
 * Attendance session lifecycle.
 *
 * POST creates a new session for a course the lecturer owns.
 * GET (lecturer) lists their own recent sessions.
 */
import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { attendanceSessions, courses } from '@/lib/db/schema';
import { readJson, requireApiRole } from '@/lib/api';

export const runtime = 'nodejs';

const createSchema = z.object({
  courseId: z.string().uuid(),
  durationMinutes: z.number().int().min(5).max(240).default(30),
  geofenceLat: z.number().min(-90).max(90).optional(),
  geofenceLng: z.number().min(-180).max(180).optional(),
  radiusM: z.number().int().min(10).max(2000).optional(),
});

export async function GET() {
  const guard = await requireApiRole('lecturer', 'admin');
  if (!guard.ok) return guard.response;

  const rows = await db
    .select({
      id: attendanceSessions.id,
      courseId: attendanceSessions.courseId,
      startedAt: attendanceSessions.startedAt,
      endsAt: attendanceSessions.endsAt,
      status: attendanceSessions.status,
    })
    .from(attendanceSessions)
    .orderBy(desc(attendanceSessions.startedAt))
    .limit(50);
  return NextResponse.json({ sessions: rows });
}

export async function POST(req: Request) {
  const guard = await requireApiRole('lecturer');
  if (!guard.ok) return guard.response;

  const parsed = createSchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }

  // Only the owning lecturer may start a session on their own course.
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(eq(courses.id, parsed.data.courseId), eq(courses.lecturerId, guard.user.id)),
    )
    .limit(1);
  if (!course) {
    return NextResponse.json(
      { error: 'You do not own that course.' },
      { status: 403 },
    );
  }

  // If any geofence field is provided, all three must be present.
  const hasGeo =
    parsed.data.geofenceLat !== undefined ||
    parsed.data.geofenceLng !== undefined ||
    parsed.data.radiusM !== undefined;
  if (
    hasGeo &&
    (parsed.data.geofenceLat === undefined ||
      parsed.data.geofenceLng === undefined ||
      parsed.data.radiusM === undefined)
  ) {
    return NextResponse.json(
      { error: 'Geofence requires lat, lng, and radius together.' },
      { status: 400 },
    );
  }

  const endsAt = new Date(Date.now() + parsed.data.durationMinutes * 60_000);
  const [inserted] = await db
    .insert(attendanceSessions)
    .values({
      courseId: parsed.data.courseId,
      endsAt,
      geofenceLat: parsed.data.geofenceLat,
      geofenceLng: parsed.data.geofenceLng,
      radiusM: parsed.data.radiusM,
    })
    .returning();

  return NextResponse.json({ session: inserted }, { status: 201 });
}
