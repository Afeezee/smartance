import Link from 'next/link';
import { requireRole } from '@/lib/access';
import { Card } from '@/components/ui/Card';

export default async function AdminHome() {
  const session = await requireRole('admin');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="mt-1 text-text-muted">
          Welcome, {session.user.name}. Provision lecturers and courses here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Lecturers</h2>
          <p className="mt-1 text-sm text-text-muted">
            Create lecturer accounts and reset their passwords.
          </p>
          <Link
            href="/admin/lecturers"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Manage lecturers →
          </Link>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Courses</h2>
          <p className="mt-1 text-sm text-text-muted">
            Create courses and assign them to a lecturer.
          </p>
          <Link
            href="/admin/courses"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Manage courses →
          </Link>
        </Card>
      </div>
    </div>
  );
}
