import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses } from '@/lib/db/schema';
import { requireApiRole } from '@/lib/api';

export const runtime = 'nodejs';

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const guard = await requireApiRole('admin');
  if (!guard.ok) return guard.response;

  const deleted = await db
    .delete(courses)
    .where(eq(courses.id, ctx.params.id))
    .returning({ id: courses.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
