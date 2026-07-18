/**
 * Edge-safe portion of the Auth.js configuration.
 *
 * The middleware (edge runtime) cannot import bcrypt or the DB client, so we
 * split the config: this file contains callbacks + page routes and is safe
 * to import anywhere. The actual `Credentials` provider (which needs bcrypt
 * and the DB) lives in `src/auth.ts` and is only pulled in from Node contexts.
 */
import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@/lib/db/schema';

const roleHomes: Record<Role, string> = {
  admin: '/admin',
  lecturer: '/lecturer',
  student: '/student',
};

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Called by the middleware for every matched request.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isProtected =
        path.startsWith('/admin') ||
        path.startsWith('/lecturer') ||
        path.startsWith('/student');

      const isAuthPage = path === '/login' || path === '/register';

      // Bounce logged-in users away from login/register into their dashboard.
      if (isAuthPage && isLoggedIn) {
        const role = (auth!.user as { role?: Role }).role;
        const home = role ? roleHomes[role] : '/';
        return Response.redirect(new URL(home, nextUrl));
      }

      if (isProtected && !isLoggedIn) return false; // triggers redirect to /login
      return true;
    },
    // Persist role + id onto the JWT so the session carries them without an
    // extra DB round-trip on every request.
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  providers: [], // Real providers are registered in src/auth.ts (Node runtime).
} satisfies NextAuthConfig;
