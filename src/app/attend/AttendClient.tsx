'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { computeFingerprint } from '@/lib/fingerprint';

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; markedAt: string; flagged: boolean }
  | { kind: 'error'; message: string };

export function AttendClient({
  token,
  studentName,
}: {
  token: string;
  studentName: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    if (!token) {
      setStatus({
        kind: 'error',
        message:
          'No attendance token in the URL. Scan the QR code from your lecturer’s screen.',
      });
      return;
    }
    submit();
    // We intentionally run once on mount — students scanning a QR should
    // check in immediately, not click a button first.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setStatus({ kind: 'submitting' });

    // Try for a GPS reading, but don't block on it — the server flags rather
    // than rejects if the session was geofenced and we have no coords.
    let latitude: number | undefined;
    let longitude: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!('geolocation' in navigator)) return reject(new Error('no-geo'));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 30_000,
        });
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch {
      // Silent — server will flag if the session requires geolocation.
    }

    const fingerprint = await computeFingerprint();

    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, latitude, longitude, fingerprint }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      markedAt?: string;
      flagged?: boolean;
    };

    if (!res.ok) {
      setStatus({ kind: 'error', message: data.error ?? 'Could not mark attendance.' });
      return;
    }
    setStatus({
      kind: 'success',
      markedAt: data.markedAt ?? new Date().toISOString(),
      flagged: !!data.flagged,
    });
  }

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <p className="text-sm text-text-muted">Marking attendance for</p>
        <p className="text-lg font-semibold">{studentName}</p>

        <div className="mt-4">
          {status.kind === 'idle' && (
            <p className="text-sm text-text-muted">Preparing…</p>
          )}
          {status.kind === 'submitting' && (
            <p className="text-sm text-text-muted">Verifying with the server…</p>
          )}
          {status.kind === 'success' && (
            <div>
              <p className="text-lg font-semibold text-primary">✓ You&apos;re marked present</p>
              <p className="mt-1 text-sm text-text-muted">
                At {new Date(status.markedAt).toLocaleTimeString()}
              </p>
              {status.flagged && (
                <p className="mt-3 rounded-md bg-accent/20 p-3 text-xs text-text">
                  Your attendance was recorded but flagged for lecturer review.
                  Common reasons: not physically at the classroom, or the same
                  device used for another student today.
                </p>
              )}
            </div>
          )}
          {status.kind === 'error' && (
            <div>
              <p className="text-sm font-medium text-primary">{status.message}</p>
              <Button className="mt-4" onClick={submit}>
                Try again
              </Button>
            </div>
          )}
        </div>
      </Card>

      <p className="text-xs text-text-muted">
        <Link href="/student" className="underline">
          Back to my dashboard
        </Link>
      </p>
    </div>
  );
}
