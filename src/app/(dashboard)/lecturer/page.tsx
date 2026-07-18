import Link from 'next/link';
import { asc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/access';
import { db } from '@/lib/db';
import { courses } from '@/lib/db/schema';
import { Card, EmptyState } from '@/components/ui/Card';

export default async function LecturerHome() {
  const session = await requireRole('lecturer');

  const myCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.lecturerId, session.user.id))
    .orderBy(asc(courses.code));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My courses</h1>
        <p className="mt-1 text-text-muted">
          Open a course to start an attendance session or view past sessions.
        </p>
      </div>

      {myCourses.length === 0 ? (
        <EmptyState
          title="No courses assigned to you yet."
          hint="Ask an admin to assign one — courses drive everything else."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {myCourses.map((c) => (
            <li key={c.id}>
              <Link href={`/lecturer/courses/${c.id}`}>
                <Card className="transition hover:border-primary">
                  <p className="font-medium">
                    <span className="text-primary">{c.code}</span> — {c.title}
                  </p>
                  <p className="mt-2 text-sm text-text-muted">Open →</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
