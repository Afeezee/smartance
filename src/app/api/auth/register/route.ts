/**
 * Student self-registration endpoint.
 *
 * Lecturer and admin accounts are provisioned by an existing admin
 * (implemented in a later phase). Anyone hitting this endpoint gets
 * the `student` role.
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export const runtime = 'nodejs';

const bodySchema = z.object({
  fullName: z.string().min(2).max(128),
  email: z.string().email().max(255),
  matricNo: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { fullName, matricNo, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  // Cheap pre-check for a friendlier error than a raw unique-constraint failure.
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: 'An account with that email already exists.' },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.insert(users).values({
      email,
      passwordHash,
      role: 'student',
      matricNo,
      fullName,
    });
  } catch (err) {
    // Most likely a matric_no unique-index violation — surface as 409.
    const message =
      err instanceof Error && /duplicate key/.test(err.message)
        ? 'That matric number is already registered.'
        : 'Could not create account.';
    return NextResponse.json({ error: message }, { status: 409 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
