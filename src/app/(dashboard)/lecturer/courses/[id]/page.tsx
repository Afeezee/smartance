import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/access';
import { db } from '@/lib/db';
import { attendanceSessions, courses, enrollments } from '@/lib/db/schema';
import { Card, EmptyState } from '@/components/ui/Card';
import { BackLink } from '@/components/ui/BackLink';
import { CourseActions } from './CourseActions';
import { InsightsPanel } from './InsightsPanel';

export default async function LecturerCoursePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireRole('lecturer');

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, params.id), eq(courses.lecturerId, session.user.id)))
    .limit(1);
  if (!course) notFound();

  const [enrolledCount] = await db
    .select({ count: enrollments.id })
    .from(enrollments)
    .where(eq(enrollments.courseId, course.id));

  const recentSessions = await db
    .select()
    .from(attendanceSessions)
    .where(eq(attendanceSessions.courseId, course.id))
    .orderBy(desc(attendanceSessions.startedAt))
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/lecturer" label="All courses" />
        <h1 className="mt-2 text-2xl font-semibold">
          <span className="text-primary">{course.code}</span> — {course.title}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {enrolledCount ? '1 or more' : '0'} students enrolled
        </p>
      </div>

      <CourseActions courseId={course.id} />

      <InsightsPanel courseId={course.id} courseCode={course.code} />

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted">
          Recent sessions
        </h2>
        {recentSessions.length === 0 ? (
          <EmptyState
            title="No sessions yet."
            hint="Start one above to display a rotating QR code in your classroom."
          />
        ) : (
          <ul className="space-y-2">
            {recentSessions.map((s) => (
              <li key={s.id}>
                <Link href={`/lecturer/sessions/${s.id}`}>
                  <Card className="flex items-center justify-between transition hover:border-primary">
                    <div>
                      <p className="font-medium">
                        {new Date(s.startedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-text-muted">
                        Ends {new Date(s.endsAt).toLocaleTimeString()} · {s.status}
                      </p>
                    </div>
                    <span className="text-sm text-primary">Open →</span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
