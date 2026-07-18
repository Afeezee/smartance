/**
 * Issues a fresh rotating QR token for the currently signed-in lecturer's
 * own session. Called on a short polling interval by the live-session page.
 *
 * Tokens are persisted to session_tokens as an audit trail — validation
 * itself does not need the DB (the token carries its own signature and
 * expiry, see src/lib/tokens.ts).
 */
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attendanceSessions, courses, sessionTokens } from '@/lib/db/schema';
import { requireApiRole } from '@/lib/api';
import { signToken } from '@/lib/tokens';

export const runtime = 'nodejs';

// How long a single QR frame is valid. Short enough that a screenshotted
// token is useless within a few seconds, long enough that a poor connection
// can still make the round-trip.
const TOKEN_TTL_MS = 12_000;

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const guard = await requireApiRole('lecturer');
  if (!guard.ok) return guard.response;

  const [row] = await db
    .select({
      id: attendanceSessions.id,
      endsAt: attendanceSessions.endsAt,
      status: attendanceSessions.status,
      lecturerId: courses.lecturerId,
    })
    .from(attendanceSessions)
    .innerJoin(courses, eq(courses.id, attendanceSessions.courseId))
    .where(eq(attendanceSessions.id, ctx.params.id))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (row.lecturerId !== guard.user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  if (row.status !== 'active' || new Date(row.endsAt).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Session is not active.' }, { status: 409 });
  }

  // Cap the token expiry at the session end so a token can never outlive
  // its session.
  const expiresAt = Math.min(Date.now() + TOKEN_TTL_MS, new Date(row.endsAt).getTime());
  const token = signToken(row.id, expiresAt);

  await db.insert(sessionTokens).values({
    sessionId: row.id,
    token,
    expiresAt: new Date(expiresAt),
  });

  return NextResponse.json({ token, expiresAt });
}
