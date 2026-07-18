import { requireRole } from '@/lib/access';
import { BackLink } from '@/components/ui/BackLink';
import { CoursesManager } from './CoursesManager';

export default async function AdminCoursesPage() {
  await requireRole('admin');
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin" label="Admin dashboard" />
        <h1 className="mt-2 text-2xl font-semibold">Courses</h1>
        <p className="mt-1 text-text-muted">
          Create a course and assign a lecturer who will run its sessions.
        </p>
      </div>
      <CoursesManager />
    </div>
  );
}
