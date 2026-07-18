/**
 * One-shot script to bootstrap an admin account from environment variables.
 * Idempotent: if a user with ADMIN_EMAIL already exists, we upsert their
 * role to 'admin' and reset the password.
 *
 * Run with:  npm run seed:admin
 * Env vars:  ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME (loaded from .env.local)
 *
 * Note on the dynamic imports: `import` statements are hoisted above any
 * top-level code, so `dotenv` MUST be loaded before we `import` anything
 * that reads process.env at module-load time (the DB client does).
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME ?? 'Smartance Admin';

  if (!email || !password) {
    console.error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local (see .env.example).',
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const { default: bcrypt } = await import('bcryptjs');
  const { eq } = await import('drizzle-orm');
  const { db } = await import('../src/lib/db');
  const { users } = await import('../src/lib/db/schema');

  const passwordHash = await bcrypt.hash(password, 12);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ role: 'admin', passwordHash, fullName })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing user ${email} → admin.`);
  } else {
    await db.insert(users).values({ email, passwordHash, role: 'admin', fullName });
    console.log(`Created admin ${email}.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
