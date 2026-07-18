'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Result =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; summary: string | null; stats: { totalSessions: number; students: number } };

export function InsightsPanel({ courseId, courseCode }: { courseId: string; courseCode: string }) {
  const [state, setState] = useState<Result>({ kind: 'idle' });

  async function generate() {
    setState({ kind: 'loading' });
    const res = await fetch(`/api/courses/${courseId}/insights`);
    const data = (await res.json().catch(() => ({}))) as {
      summary?: string | null;
      error?: string;
      stats?: { totalSessions: number; students: number };
    };
    if (!res.ok) {
      setState({ kind: 'error', message: data.error ?? 'Failed to generate insights.' });
      return;
    }
    setState({
      kind: 'ok',
      summary: data.summary ?? null,
      stats: data.stats ?? { totalSessions: 0, students: 0 },
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Weekly insights</h2>
          <p className="mt-1 text-sm text-text-muted">
            AI-generated narrative of the past 7 days of attendance for {courseCode}.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/courses/${courseId}/export`}
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-border/40"
          >
            Export CSV
          </a>
          <Button onClick={generate} disabled={state.kind === 'loading'}>
            {state.kind === 'loading' ? 'Generating…' : 'Generate insights'}
          </Button>
        </div>
      </div>

      {state.kind === 'error' && (
        <p className="mt-4 text-sm text-primary">{state.message}</p>
      )}
      {state.kind === 'ok' && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-text-muted">
            Based on {state.stats.totalSessions} session(s) and {state.stats.students} enrolled student(s).
          </p>
          {state.summary ? (
            <pre className="whitespace-pre-wrap rounded-md bg-bg p-4 font-sans text-sm text-text">
              {state.summary}
            </pre>
          ) : (
            <p className="text-sm text-text-muted">
              No data to summarise yet — run at least one attendance session.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
