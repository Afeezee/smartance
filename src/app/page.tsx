import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();
  const roleHome =
    session?.user?.role &&
    ({ admin: '/admin', lecturer: '/lecturer', student: '/student' } as const)[
      session.user.role
    ];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-between px-6 py-10">
      <header>
        <Logo size={48} />
      </header>

      <section className="my-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Attendance that can&apos;t be scanned by a friend.
        </h1>
        <p className="mt-4 max-w-xl text-text-muted">
          Smartance replaces the printed roll call with rotating, signed QR
          codes tied to the classroom&apos;s location and the student&apos;s
          own device.
        </p>

        <div className="mt-8 flex gap-3">
          {roleHome ? (
            <Link
              href={roleHome}
              className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-5 text-sm font-medium text-text hover:bg-border/40"
              >
                Register as student
              </Link>
            </>
          )}
        </div>
      </section>

      <footer className="text-xs text-text-muted">
        Department of Computer Engineering · Oduduwa University Ipetumodu
      </footer>
    </main>
  );
}
