/**
 * Role-check helpers used by dashboard pages as defence-in-depth on top of
 * the middleware. Each page calls the matching helper so a lecturer poking
 * at /admin gets bounced even if the middleware ever regressed.
 */
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import type { Role } from './db/schema';

export async function requireRole(role: Role) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== role) {
    // Send them to their own dashboard rather than a 403 — keeps the demo
    // flow smooth for the panel.
    const home = { admin: '/admin', lecturer: '/lecturer', student: '/student' }[
      session.user.role
    ];
    redirect(home);
  }
  return session;
}
