import { requireRole } from '@/lib/access';
import { BackLink } from '@/components/ui/BackLink';
import { LecturersManager } from './LecturersManager';

export default async function LecturersPage() {
  await requireRole('admin');
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin" label="Admin dashboard" />
        <h1 className="mt-2 text-2xl font-semibold">Lecturers</h1>
        <p className="mt-1 text-text-muted">
          Provision a lecturer account so they can start attendance sessions.
        </p>
      </div>
      <LecturersManager />
    </div>
  );
}
