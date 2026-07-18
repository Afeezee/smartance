/**
 * Lecturer management — admin-only.
 *
 * Students self-register through /api/auth/register. Lecturers are
 * provisioned here so the "role" field is never client-controlled outside
 * an admin session.
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { readJson, requireApiRole } from '@/lib/api';

export const runtime = 'nodejs';

const createSchema = z.object({
  fullName: z.string().min(2).max(128),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export async function GET() {
  const guard = await requireApiRole('admin');
  if (!guard.ok) return guard.response;

  const lecturers = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'lecturer'))
    .orderBy(asc(users.fullName));

  return NextResponse.json({ lecturers });
}

export async function POST(req: Request) {
  const guard = await requireApiRole('admin');
  if (!guard.ok) return guard.response;

  const body = await readJson<unknown>(req);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: 'A user with that email already exists.' },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [inserted] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      role: 'lecturer',
      fullName: parsed.data.fullName,
    })
    .returning({ id: users.id, email: users.email, fullName: users.fullName });

  return NextResponse.json({ lecturer: inserted }, { status: 201 });
}
