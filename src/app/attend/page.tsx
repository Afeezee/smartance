import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Logo } from '@/components/Logo';
import { AttendClient } from './AttendClient';

export default async function AttendPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const session = await auth();
  const token = searchParams.token ?? '';

  if (!session?.user) {
    // Bounce through login so the token isn't lost.
    const callback = `/attend?token=${encodeURIComponent(token)}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }

  if (session.user.role !== 'student') {
    const callback = `/attend?token=${encodeURIComponent(token)}`;
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold">Not a student account</h1>
        <p className="mt-2 text-sm text-text-muted">
          Only student accounts can mark attendance. Sign out and use your student
          login, then scan the QR again.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href={`/login?callbackUrl=${encodeURIComponent(callback)}`}
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Switch account
          </a>
          <a
            href={session.user.role === 'admin' ? '/admin' : '/lecturer'}
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-border/40"
          >
            Back to dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
      <Logo />
      <Suspense fallback={<p className="mt-6 text-sm text-text-muted">Preparing…</p>}>
        <AttendClient token={token} studentName={session.user.name ?? 'Student'} />
      </Suspense>
    </main>
  );
}
