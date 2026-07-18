/**
 * Very simple browser fingerprint used as a proxy signal — not a security
 * boundary. It hashes together a few stable-ish properties of the browser
 * so we can spot the case where one phone marks attendance for multiple
 * different students in a short window (a classic proxy attack).
 *
 * The hash is done client-side because we want the caller (student device)
 * to be the source of truth for their own device attributes, and because
 * a Node crypto import in a client component would balloon the bundle.
 */
export async function computeFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';
  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? '',
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? '',
  ].join('|');

  const bytes = new TextEncoder().encode(parts);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
