'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, EmptyState } from '@/components/ui/Card';

type Lecturer = { id: string; email: string; fullName: string; createdAt: string };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LecturersManager() {
  const { data, mutate, isLoading } = useSWR<{ lecturers: Lecturer[] }>(
    '/api/lecturers',
    fetcher,
  );

  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch('/api/lecturers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setPending(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? 'Failed to create lecturer.');
      return;
    }
    setForm({ fullName: '', email: '', password: '' });
    mutate();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted">
          Existing lecturers
        </h2>
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : !data?.lecturers.length ? (
          <EmptyState title="No lecturers yet." hint="Create one on the right." />
        ) : (
          <ul className="space-y-2">
            {data.lecturers.map((l) => (
              <li key={l.id}>
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{l.fullName}</p>
                    <p className="text-sm text-text-muted">{l.email}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Add a lecturer</h2>
        <form onSubmit={onCreate} className="mt-4 space-y-4">
          <Input
            label="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Temporary password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
          {error && <p className="text-sm text-primary">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Creating…' : 'Create lecturer'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
