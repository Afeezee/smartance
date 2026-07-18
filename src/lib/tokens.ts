/**
 * HMAC-signed rotating QR tokens.
 *
 * Every ~10s the lecturer's live-session page fetches a new token from
 * /api/sessions/[id]/token. The token payload embeds the session id and an
 * expiry timestamp so validation is stateless: on scan, the server checks
 * the HMAC and the expiry, then looks up whether the student is enrolled
 * and hasn't already been marked. No lookup against session_tokens is
 * required for validity — the token itself is the proof.
 *
 * We still persist tokens to session_tokens for audit — a lecturer can
 * later see exactly which rotations were issued in a session.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.QR_TOKEN_SECRET;
if (!SECRET) {
  throw new Error(
    'QR_TOKEN_SECRET is not set. Add it to .env.local (see .env.example).',
  );
}

// URL-safe base64 helpers so tokens can live in a query string without extra encoding.
function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf;
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): Buffer {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

type TokenPayload = {
  s: string; // session id
  e: number; // expiry (unix ms)
  n: string; // nonce (random) — keeps repeated rotations distinct even within the same ms
};

export function signToken(sessionId: string, expiresAtMs: number): string {
  const payload: TokenPayload = {
    s: sessionId,
    e: expiresAtMs,
    n: Math.random().toString(36).slice(2, 10),
  };
  const body = b64url(JSON.stringify(payload));
  const mac = b64url(createHmac('sha256', SECRET!).update(body).digest());
  return `${body}.${mac}`;
}

export type VerifyResult =
  | { ok: true; sessionId: string; expiresAt: number }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' };

export function verifyToken(token: string): VerifyResult {
  const dot = token.indexOf('.');
  if (dot === -1) return { ok: false, reason: 'malformed' };

  const body = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = b64url(createHmac('sha256', SECRET!).update(body).digest());

  // Constant-time compare so we don't leak signature bytes via timing.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_signature' };
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(body).toString('utf8')) as TokenPayload;
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  if (typeof payload.e !== 'number' || payload.e < Date.now()) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, sessionId: payload.s, expiresAt: payload.e };
}
