import Link from 'next/link';
import { requireRole } from '@/lib/access';
import { StudentCourses } from './StudentCourses';

export default async function StudentHome() {
  const session = await requireRole('student');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hello, {session.user.name}</h1>
        <p className="mt-1 text-text-muted">
          Enroll in your courses below. When your lecturer starts a session, scan the QR
          on the screen with your phone camera to mark attendance.
        </p>
      </div>

      <StudentCourses />

      <p className="text-xs text-text-muted">
        Tip: The scan page opens directly from a QR code. There is nothing to install.
        {' · '}
        <Link href="/" className="underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
