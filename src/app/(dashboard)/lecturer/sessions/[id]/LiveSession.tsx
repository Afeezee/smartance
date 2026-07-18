'use client';

import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import { Card, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Feed = {
  attendance: {
    id: string;
    markedAt: string;
    flagged: boolean;
    studentName: string;
    matricNo: string | null;
  }[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Token rotation cadence — a bit shorter than the token TTL (12s) so the QR
// always shows a token that's comfortably in-date.
const ROTATE_MS = 9_000;
// Feed polling cadence — snappy enough that check-ins feel real-time.
const POLL_MS = 3_000;

export function LiveSession({
  sessionId,
  initiallyActive,
}: {
  sessionId: string;
  initiallyActive: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initiallyActive);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [tokenErr, setTokenErr] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  const feed = useSWR<Feed>(
    active ? `/api/sessions/${sessionId}/attendance` : null,
    fetcher,
    { refreshInterval: POLL_MS },
  );

  const rotate = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/token`);
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setTokenErr(d.error ?? 'Failed to fetch token.');
        if (res.status === 409) setActive(false); // session ended
        return;
      }
      const { token } = (await res.json()) as { token: string };
      const base =
        typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${base}/attend?token=${encodeURIComponent(token)}`;
      const data = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 480,
        color: { dark: '#1f1f23', light: '#ffffff' },
      });
      setQrDataUrl(data);
      setTokenErr(null);
    } catch (e) {
      setTokenErr('Network error while rotating token.');
    }
  }, [sessionId]);

  useEffect(() => {
    if (!active) return;
    rotate();
    const t = setInterval(rotate, ROTATE_MS);
    return () => clearInterval(t);
  }, [active, rotate]);

  async function endSession() {
    if (!confirm('End this session? Students will no longer be able to check in.'))
      return;
    setEnding(true);
    const res = await fetch(`/api/sessions/${sessionId}/end`, { method: 'POST' });
    setEnding(false);
    if (res.ok) {
      setActive(false);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {active ? 'Live QR code' : 'Session ended'}
          </h2>
          {active && (
            <Button variant="ghost" onClick={endSession} disabled={ending}>
              {ending ? 'Ending…' : 'End session'}
            </Button>
          )}
        </div>

        {active ? (
          <div className="mt-4 flex flex-col items-center gap-3">
            {qrDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt="Rotating attendance QR code"
                className="h-72 w-72 rounded-md border border-border bg-white p-2 sm:h-96 sm:w-96"
              />
            ) : (
              <div className="flex h-72 w-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-text-muted sm:h-96 sm:w-96">
                Generating QR…
              </div>
            )}
            <p className="text-xs text-text-muted">
              Refreshes every {ROTATE_MS / 1000}s · TTL 12s
            </p>
            {tokenErr && <p className="text-sm text-primary">{tokenErr}</p>}
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">
            This session is no longer accepting check-ins. The feed below is
            preserved for the record.
          </p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Check-ins</h2>
          <span className="text-sm text-text-muted">
            {feed.data?.attendance.length ?? 0} present
          </span>
        </div>

        {!feed.data ? (
          <p className="mt-4 text-sm text-text-muted">Loading…</p>
        ) : feed.data.attendance.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No check-ins yet."
              hint="Ask students to open their camera and scan the QR."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {feed.data.attendance.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{a.studentName}</p>
                  <p className="text-xs text-text-muted">
                    {a.matricNo ?? '—'} · {new Date(a.markedAt).toLocaleTimeString()}
                  </p>
                </div>
                {a.flagged && (
                  <span
                    className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-text"
                    title="Flagged by anti-spoofing checks"
                  >
                    flagged
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
