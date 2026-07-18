import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/access';
import { db } from '@/lib/db';
import { attendanceSessions, courses } from '@/lib/db/schema';
import { BackLink } from '@/components/ui/BackLink';
import { LiveSession } from './LiveSession';

export default async function LecturerSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireRole('lecturer');

  const [row] = await db
    .select({
      id: attendanceSessions.id,
      courseId: courses.id,
      courseCode: courses.code,
      courseTitle: courses.title,
      startedAt: attendanceSessions.startedAt,
      endsAt: attendanceSessions.endsAt,
      status: attendanceSessions.status,
      hasGeofence: attendanceSessions.geofenceLat,
    })
    .from(attendanceSessions)
    .innerJoin(courses, eq(courses.id, attendanceSessions.courseId))
    .where(
      and(
        eq(attendanceSessions.id, params.id),
        eq(courses.lecturerId, session.user.id),
      ),
    )
    .limit(1);

  if (!row) notFound();

  return (
    <div className="space-y-6">
      <div>
        <BackLink href={`/lecturer/courses/${row.courseId}`} label="Back to course" />
        <h1 className="mt-2 text-2xl font-semibold">
          <span className="text-primary">{row.courseCode}</span> — {row.courseTitle}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Started {new Date(row.startedAt).toLocaleString()} · ends{' '}
          {new Date(row.endsAt).toLocaleTimeString()} ·{' '}
          {row.hasGeofence !== null ? 'geofenced' : 'no geofence'} · {row.status}
        </p>
      </div>

      <LiveSession
        sessionId={row.id}
        initiallyActive={
          row.status === 'active' && new Date(row.endsAt).getTime() > Date.now()
        }
      />
    </div>
  );
}
