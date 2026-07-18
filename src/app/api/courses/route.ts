/**
 * Courses collection endpoint.
 *
 * GET semantics depend on role:
 *   admin    → all courses
 *   lecturer → only their own
 *   student  → all courses (used by the browse/enroll page)
 *
 * POST is admin-only — creating a course requires selecting a lecturer,
 * so it isn't a self-service action for the lecturer themselves.
 */
import { NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { courses, users } from '@/lib/db/schema';
import { readJson, requireApiRole } from '@/lib/api';

export const runtime = 'nodejs';

const createSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(16)
    .transform((s) => s.toUpperCase().replace(/\s+/g, '')),
  title: z.string().min(3).max(200),
  lecturerId: z.string().uuid(),
});

export async function GET() {
  const guard = await requireApiRole('admin', 'lecturer', 'student');
  if (!guard.ok) return guard.response;

  const base = db
    .select({
      id: courses.id,
      code: courses.code,
      title: courses.title,
      lecturerId: courses.lecturerId,
      lecturerName: users.fullName,
    })
    .from(courses)
    .leftJoin(users, eq(users.id, courses.lecturerId))
    .orderBy(asc(courses.code));

  const rows =
    guard.user.role === 'lecturer'
      ? await base.where(eq(courses.lecturerId, guard.user.id))
      : await base;

  return NextResponse.json({ courses: rows });
}

export async function POST(req: Request) {
  const guard = await requireApiRole('admin');
  if (!guard.ok) return guard.response;

  const parsed = createSchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }

  // Defensive: ensure the selected lecturer really is a lecturer.
  const [lecturer] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(and(eq(users.id, parsed.data.lecturerId), eq(users.role, 'lecturer')))
    .limit(1);
  if (!lecturer) {
    return NextResponse.json(
      { error: 'Selected lecturer does not exist.' },
      { status: 400 },
    );
  }

  try {
    const [inserted] = await db
      .insert(courses)
      .values({
        code: parsed.data.code,
        title: parsed.data.title,
        lecturerId: parsed.data.lecturerId,
      })
      .returning();
    return NextResponse.json({ course: inserted }, { status: 201 });
  } catch (err) {
    const msg =
      err instanceof Error && /duplicate key/.test(err.message)
        ? 'A course with that code already exists.'
        : 'Could not create course.';
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
