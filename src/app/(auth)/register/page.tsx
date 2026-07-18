'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    matricNo: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setPending(false);
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Registration failed.');
      return;
    }

    // Sign the student in immediately after registering.
    const signInRes = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setPending(false);

    if (!signInRes || signInRes.error) {
      setError('Account created, but sign-in failed. Please sign in manually.');
      return;
    }
    router.push('/student');
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <h1 className="mb-1 text-2xl font-semibold">Create a student account</h1>
      <p className="mb-6 text-sm text-text-muted">
        Lecturers are added by a department admin — students self-register.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Full name" value={form.fullName} onChange={set('fullName')} required />
        <Input
          label="Matric number"
          value={form.matricNo}
          onChange={set('matricNo')}
          placeholder="e.g. H/24/CS/0023"
          required
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          minLength={8}
          required
        />
        {error && <p className="text-sm text-primary">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-muted">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
