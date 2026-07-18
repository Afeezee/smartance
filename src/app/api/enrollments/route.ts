/**
 * Enrollments — students enroll themselves into a course.
 *
 * We intentionally do not let a student pass a `studentId` here — the
 * enrollment is always for the currently logged-in student. That's what
 * closes off the "enroll anyone in anything" attack.
 */
import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { courses, enrollments } from '@/lib/db/schema';
import { readJson, requireApiRole } from '@/lib/api';

export const runtime = 'nodejs';

const createSchema = z.object({
  courseId: z.string().uuid(),
});

export async function GET() {
  const guard = await requireApiRole('student');
  if (!guard.ok) return guard.response;

  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      courseId: courses.id,
      code: courses.code,
      title: courses.title,
      enrolledAt: enrollments.createdAt,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(eq(enrollments.studentId, guard.user.id))
    .orderBy(desc(enrollments.createdAt));

  return NextResponse.json({ enrollments: rows });
}

export async function POST(req: Request) {
  const guard = await requireApiRole('student');
  if (!guard.ok) return guard.response;

  const parsed = createSchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }

  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.id, parsed.data.courseId))
    .limit(1);
  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  const [existing] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.courseId, parsed.data.courseId),
        eq(enrollments.studentId, guard.user.id),
      ),
    )
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: 'You are already enrolled in this course.' },
      { status: 409 },
    );
  }

  const [inserted] = await db
    .insert(enrollments)
    .values({ courseId: parsed.data.courseId, studentId: guard.user.id })
    .returning();
  return NextResponse.json({ enrollment: inserted }, { status: 201 });
}
