'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, EmptyState } from '@/components/ui/Card';

type Course = {
  id: string;
  code: string;
  title: string;
  lecturerId: string;
  lecturerName: string | null;
};
type Lecturer = { id: string; fullName: string; email: string };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CoursesManager() {
  const courses = useSWR<{ courses: Course[] }>('/api/courses', fetcher);
  const lecturers = useSWR<{ lecturers: Lecturer[] }>('/api/lecturers', fetcher);

  const [form, setForm] = useState({ code: '', title: '', lecturerId: '' });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setPending(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? 'Failed to create course.');
      return;
    }
    setForm({ code: '', title: '', lecturerId: '' });
    courses.mutate();
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this course? Enrollments and sessions will be removed.')) return;
    const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    if (res.ok) courses.mutate();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted">
          Existing courses
        </h2>
        {courses.isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : !courses.data?.courses.length ? (
          <EmptyState title="No courses yet." hint="Create one on the right." />
        ) : (
          <ul className="space-y-2">
            {courses.data.courses.map((c) => (
              <li key={c.id}>
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      <span className="text-primary">{c.code}</span> — {c.title}
                    </p>
                    <p className="text-sm text-text-muted">
                      Lecturer: {c.lecturerName ?? '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Delete
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Add a course</h2>
        <form onSubmit={onCreate} className="mt-4 space-y-4">
          <Input
            label="Course code"
            placeholder="CSC401"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Lecturer</span>
            <select
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              value={form.lecturerId}
              onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}
              required
            >
              <option value="">Select a lecturer…</option>
              {lecturers.data?.lecturers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.fullName} ({l.email})
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-primary">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Creating…' : 'Create course'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
