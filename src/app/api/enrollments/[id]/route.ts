import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { enrollments } from '@/lib/db/schema';
import { requireApiRole } from '@/lib/api';

export const runtime = 'nodejs';

// Students may only unenroll themselves; admins can unenroll anyone.
export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const guard = await requireApiRole('student', 'admin');
  if (!guard.ok) return guard.response;

  const whereClause =
    guard.user.role === 'admin'
      ? eq(enrollments.id, ctx.params.id)
      : and(eq(enrollments.id, ctx.params.id), eq(enrollments.studentId, guard.user.id));

  const deleted = await db
    .delete(enrollments)
    .where(whereClause)
    .returning({ id: enrollments.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Enrollment not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
