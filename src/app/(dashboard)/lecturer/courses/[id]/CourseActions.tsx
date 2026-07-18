'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export function CourseActions({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [durationMin, setDurationMin] = useState(30);
  const [useGeofence, setUseGeofence] = useState(false);
  const [radius, setRadius] = useState(75);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession() {
    setError(null);
    setPending(true);

    // Grab the lecturer's current coordinates if they enabled geofencing so
    // students later have a reference point to be within.
    let lat: number | undefined;
    let lng: number | undefined;
    if (useGeofence) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        setPending(false);
        setError(
          'Could not read your location. Enable location access or turn off geofencing.',
        );
        return;
      }
    }

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        durationMinutes: durationMin,
        ...(useGeofence
          ? { geofenceLat: lat, geofenceLng: lng, radiusM: radius }
          : {}),
      }),
    });
    setPending(false);

    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? 'Failed to start session.');
      return;
    }
    const { session } = (await res.json()) as { session: { id: string } };
    router.push(`/lecturer/sessions/${session.id}`);
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Start an attendance session</h2>
      <p className="mt-1 text-sm text-text-muted">
        A new QR code appears every ~10 seconds. Students scan it during class.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Duration (minutes)</span>
          <Input
            type="number"
            min={5}
            max={240}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Geofence</span>
          <div className="flex h-10 items-center gap-2">
            <input
              type="checkbox"
              checked={useGeofence}
              onChange={(e) => setUseGeofence(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            <span className="text-sm text-text-muted">Use my current location</span>
          </div>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Radius (m)</span>
          <Input
            type="number"
            min={20}
            max={500}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            disabled={!useGeofence}
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-primary">{error}</p>}

      <div className="mt-4">
        <Button onClick={startSession} disabled={pending}>
          {pending ? 'Starting…' : 'Start session'}
        </Button>
      </div>

      <p className="mt-3 text-xs text-text-muted">
        Note: geofencing is a deterrent, not a guarantee — GPS can be spoofed on
        rooted or jailbroken devices.
      </p>
    </Card>
  );
}
