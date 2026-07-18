import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <Logo />
      <h1 className="mt-6 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-text-muted">
        The page you tried to open doesn&apos;t exist, or you don&apos;t have access to
        it.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
      >
        Go home
      </Link>
    </main>
  );
}
