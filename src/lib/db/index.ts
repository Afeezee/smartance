/**
 * Neon serverless Postgres client wired to Drizzle.
 *
 * Using the HTTP driver (`neon-http`) rather than the websocket variant:
 * simpler in serverless contexts, no connection-pool tuning needed, and it
 * works identically in the Node runtime used by NextAuth's credentials
 * provider and in the Next.js route handlers.
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.',
  );
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export { schema };
