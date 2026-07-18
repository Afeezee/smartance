import { requireRole } from '@/lib/access';
import { LecturersManager } from './LecturersManager';

export default async function LecturersPage() {
  await requireRole('admin');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lecturers</h1>
        <p className="mt-1 text-text-muted">
          Provision a lecturer account so they can start attendance sessions.
        </p>
      </div>
      <LecturersManager />
    </div>
  );
}
