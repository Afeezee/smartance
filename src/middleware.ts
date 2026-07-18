/**
 * Route guarding runs in the Edge runtime, which means we can only use the
 * edge-safe portion of the Auth.js config here. Role-specific gating (e.g.
 * "only admins may open /admin") happens inside each dashboard layout as a
 * defence-in-depth check — the middleware only enforces "must be signed in".
 */
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export default middleware((_req) => {
  // The `authorized` callback in authConfig does the work. Returning nothing
  // lets the response through unchanged.
});

export const config = {
  // Skip Next.js internals, static assets, and API routes (API routes do
  // their own auth checks inside the handler).
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};
