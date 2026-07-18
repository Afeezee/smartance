/**
 * Attendance marking endpoint.
 *
 * The student's device POSTs { token, latitude?, longitude?, fingerprint }.
 * The server validates in this order:
 *   1. Auth: student is signed in.
 *   2. Token: HMAC valid AND not expired (checked in tokens.ts).
 *   3. Session: exists and is still active (defensive; the token expiry
 *      already caps this, but the session may have been ended early).
 *   4. Enrollment: the student is enrolled in the session's course.
 *   5. Uniqueness: the student has not already been marked for this session
 *      (belt-and-braces — the DB unique index also enforces this).
 *   6. Geofence: if the session has one, check haversine distance.
 *      Out-of-range attendance is FLAGGED, not rejected — a lecturer can
 *      review flags rather than the student silently failing.
 *   7. Fingerprint: if the same device fingerprint has marked a *different*
 *      student in the past 10 minutes, flag this attendance as suspicious.
 */
import { NextResponse } from 'next/server';
import { and, eq, gt, ne, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import {
  attendance,
  attendanceSessions,
  courses,
  enrollments,
} from '@/lib/db/schema';
import { readJson, requireApiRole } from '@/lib/api';
import { verifyToken } from '@/lib/tokens';
import { haversineMeters } from '@/lib/geo';

export const runtime = 'nodejs';

const markSchema = z.object({
  token: z.string().min(10),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  fingerprint: z.string().min(8).max(128).optional(),
});

const FINGERPRINT_LOOKBACK_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const guard = await requireApiRole('student');
  if (!guard.ok) return guard.response;

  const parsed = markSchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }

  const verify = verifyToken(parsed.data.token);
  if (!verify.ok) {
    const message =
      verify.reason === 'expired'
        ? 'This QR code has expired — scan the newest one on the screen.'
        : 'Invalid QR code.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const [session] = await db
    .select({
      id: attendanceSessions.id,
      courseId: attendanceSessions.courseId,
      status: attendanceSessions.status,
      endsAt: attendanceSessions.endsAt,
      geofenceLat: attendanceSessions.geofenceLat,
      geofenceLng: attendanceSessions.geofenceLng,
      radiusM: attendanceSessions.radiusM,
    })
    .from(attendanceSessions)
    .where(eq(attendanceSessions.id, verify.sessionId))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }
  if (session.status !== 'active' || new Date(session.endsAt).getTime() < Date.now()) {
    return NextResponse.json(
      { error: 'This attendance session has ended.' },
      { status: 409 },
    );
  }

  const [enrolled] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, guard.user.id),
        eq(enrollments.courseId, session.courseId),
      ),
    )
    .limit(1);
  if (!enrolled) {
    return NextResponse.json(
      { error: 'You are not enrolled in this course.' },
      { status: 403 },
    );
  }

  const [already] = await db
    .select({ id: attendance.id })
    .from(attendance)
    .where(
      and(
        eq(attendance.sessionId, session.id),
        eq(attendance.studentId, guard.user.id),
      ),
    )
    .limit(1);
  if (already) {
    return NextResponse.json(
      { error: 'You have already been marked present for this session.' },
      { status: 409 },
    );
  }

  // Anti-spoofing signals — accumulate reasons rather than short-circuiting.
  let flagged = false;
  const flagReasons: string[] = [];

  if (
    session.geofenceLat !== null &&
    session.geofenceLng !== null &&
    session.radiusM !== null
  ) {
    if (parsed.data.latitude === undefined || parsed.data.longitude === undefined) {
      // Missing location on a geofenced session — flag but still allow the
      // student's phone might not have GPS access, and the lecturer can review.
      flagged = true;
      flagReasons.push('missing_location');
    } else {
      const dist = haversineMeters(
        session.geofenceLat,
        session.geofenceLng,
        parsed.data.latitude,
        parsed.data.longitude,
      );
      if (dist > session.radiusM) {
        flagged = true;
        flagReasons.push(`outside_geofence:${Math.round(dist)}m`);
      }
    }
  }

  if (parsed.data.fingerprint) {
    const since = new Date(Date.now() - FINGERPRINT_LOOKBACK_MS);
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendance)
      .where(
        and(
          eq(attendance.deviceFingerprint, parsed.data.fingerprint),
          ne(attendance.studentId, guard.user.id),
          gt(attendance.markedAt, since),
        ),
      );
    if (row && row.count > 0) {
      flagged = true;
      flagReasons.push(`fingerprint_reuse:${row.count}`);
    }
  }

  try {
    const [inserted] = await db
      .insert(attendance)
      .values({
        sessionId: session.id,
        studentId: guard.user.id,
        deviceFingerprint: parsed.data.fingerprint ?? null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        flagged,
      })
      .returning({ id: attendance.id, markedAt: attendance.markedAt });

    return NextResponse.json({
      ok: true,
      attendanceId: inserted.id,
      markedAt: inserted.markedAt,
      flagged,
      flagReasons,
    });
  } catch (err) {
    // Race with the unique index — someone marked between our check and insert.
    if (err instanceof Error && /duplicate key/.test(err.message)) {
      return NextResponse.json(
        { error: 'You have already been marked present for this session.' },
        { status: 409 },
      );
    }
    throw err;
  }
}
