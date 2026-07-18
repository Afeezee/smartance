/**
 * Small helpers shared by API route handlers so each route stays focused on
 * its own logic rather than repeating boilerplate.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Role } from './db/schema';

export type SessionUser = { id: string; role: Role; email: string; name?: string | null };

export async function requireApiRole(...roles: Role[]): Promise<
  { ok: true; user: SessionUser } | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }),
    };
  }
  if (roles.length > 0 && !roles.includes(session.user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden.' }, { status: 403 }),
    };
  }
  return {
    ok: true,
    user: {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email ?? '',
      name: session.user.name,
    },
  };
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
