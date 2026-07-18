/**
 * One-shot script to bootstrap an admin account from environment variables.
 * Idempotent: if a user with ADMIN_EMAIL already exists, we upsert their
 * role to 'admin' and optionally reset the password.
 *
 * Run with:  npx tsx scripts/seed-admin.ts
 * Env vars:  ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME ?? 'Smartance Admin';

  if (!email || !password) {
    console.error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set (see .env.example → seed section).',
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ role: 'admin', passwordHash, fullName })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing user ${email} to admin.`);
  } else {
    await db.insert(users).values({ email, passwordHash, role: 'admin', fullName });
    console.log(`Created admin ${email}.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
