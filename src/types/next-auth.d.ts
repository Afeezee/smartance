/**
 * Extend Auth.js's Session/JWT/User types so `session.user.role` and
 * `session.user.id` are typed everywhere they're used.
 */
import type { DefaultSession } from 'next-auth';
import type { Role } from '@/lib/db/schema';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}
