import { Suspense } from 'react';
import { Logo } from '@/components/Logo';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <h1 className="mb-1 text-2xl font-semibold">Sign in</h1>
      <p className="mb-6 text-sm text-text-muted">
        Use the email and password registered with your matric number.
      </p>

      {/* useSearchParams() inside LoginForm requires a Suspense boundary. */}
      <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
