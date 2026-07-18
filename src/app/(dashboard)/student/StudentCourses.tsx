'use client';

import useSWR from 'swr';
import { Card, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Course = {
  id: string;
  code: string;
  title: string;
  lecturerName: string | null;
};
type Enrollment = {
  enrollmentId: string;
  courseId: string;
  code: string;
  title: string;
};
type History = {
  attendance: {
    id: string;
    markedAt: string;
    flagged: boolean;
    code: string;
    title: string;
  }[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function StudentCourses() {
  const enrollments = useSWR<{ enrollments: Enrollment[] }>('/api/enrollments', fetcher);
  const courses = useSWR<{ courses: Course[] }>('/api/courses', fetcher);
  const history = useSWR<History>('/api/student/attendance', fetcher);

  const enrolledIds = new Set(enrollments.data?.enrollments.map((e) => e.courseId) ?? []);
  const available = courses.data?.courses.filter((c) => !enrolledIds.has(c.id)) ?? [];

  async function enroll(courseId: string) {
    await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    });
    enrollments.mutate();
  }

  async function unenroll(enrollmentId: string) {
    if (!confirm('Leave this course? Your attendance history stays intact.')) return;
    await fetch(`/api/enrollments/${enrollmentId}`, { method: 'DELETE' });
    enrollments.mutate();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted">
          Enrolled
        </h2>
        {enrollments.isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : !enrollments.data?.enrollments.length ? (
          <EmptyState title="You are not enrolled in any courses yet." />
        ) : (
          <ul className="space-y-2">
            {enrollments.data.enrollments.map((e) => (
              <li key={e.enrollmentId}>
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      <span className="text-primary">{e.code}</span> — {e.title}
                    </p>
                  </div>
                  <button
                    onClick={() => unenroll(e.enrollmentId)}
                    className="text-sm font-medium text-text-muted hover:text-primary"
                  >
                    Leave
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="lg:col-span-2">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted">
          Recent attendance
        </h2>
        {!history.data ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : history.data.attendance.length === 0 ? (
          <EmptyState title="No attendance recorded yet." />
        ) : (
          <ul className="space-y-2">
            {history.data.attendance.slice(0, 10).map((a) => (
              <li key={a.id}>
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      <span className="text-primary">{a.code}</span> — {a.title}
                    </p>
                    <p className="text-sm text-text-muted">
                      {new Date(a.markedAt).toLocaleString()}
                    </p>
                  </div>
                  {a.flagged && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-text">
                      flagged
                    </span>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted">
          Browse other courses
        </h2>
        {courses.isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : available.length === 0 ? (
          <EmptyState title="No other courses available." />
        ) : (
          <ul className="space-y-2">
            {available.map((c) => (
              <li key={c.id}>
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      <span className="text-primary">{c.code}</span> — {c.title}
                    </p>
                    {c.lecturerName && (
                      <p className="text-sm text-text-muted">Lecturer: {c.lecturerName}</p>
                    )}
                  </div>
                  <Button onClick={() => enroll(c.id)} variant="secondary">
                    Enroll
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
