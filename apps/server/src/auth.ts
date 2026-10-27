import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from './config.js';
import { db, kvGet, kvSet } from './db.js';

/** Single admin account; password stored as scrypt hash in kv('admin_password'). */
interface StoredHash {
  salt: string;
  hash: string;
  N: number;
}

const SESSION_COOKIE = 'pzsm_session';
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

function hashPassword(pw: string, salt = randomBytes(16).toString('hex'), N = 16384): StoredHash {
  const hash = scryptSync(pw, salt, 64, { N, r: 8, p: 1 }).toString('hex');
  return { salt, hash, N };
}

export function isPasswordSet(): boolean {
  return kvGet<StoredHash | null>('admin_password', null) !== null;
}

export function setPassword(pw: string): void {
  if (pw.length < 8) throw new Error('Password must be at least 8 characters');
  kvSet('admin_password', hashPassword(pw));
  db.prepare('DELETE FROM sessions').run();
}

export function verifyPassword(pw: string): boolean {
  const stored = kvGet<StoredHash | null>('admin_password', null);
  if (!stored) return false;
  const h = hashPassword(pw, stored.salt, stored.N);
  return timingSafeEqual(Buffer.from(h.hash, 'hex'), Buffer.from(stored.hash, 'hex'));
}

/** Apply PZSM_ADMIN_PASSWORD on first boot (or when no password exists yet). */
export function bootstrapPassword(): void {
  if (!isPasswordSet() && config.initialAdminPassword) setPassword(config.initialAdminPassword);
}

export function createSession(): string {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  db.prepare('INSERT INTO sessions (token, created_at, expires_at) VALUES (?, ?, ?)').run(token, now, now + SESSION_TTL_MS);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  return token;
}

export function destroySession(token: string | undefined): void {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function validSession(token: string | undefined): boolean {
  if (!token) return false;
  const r = db.prepare('SELECT expires_at FROM sessions WHERE token = ?').get(token) as { expires_at: number } | undefined;
  return !!r && r.expires_at > Date.now();
}

export function sessionCookie(reply: FastifyReply, token: string | null): void {
  if (token === null) {
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return;
  }
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: config.secureCookies,
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function requestToken(req: FastifyRequest): string | undefined {
  return req.cookies?.[SESSION_COOKIE];
}

/** Simple in-memory login rate limiter: 10 attempts / 10 minutes per IP. */
const attempts = new Map<string, number[]>();
export function loginAllowed(ip: string): boolean {
  const now = Date.now();
  const list = (attempts.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  attempts.set(ip, list);
  return list.length < 10;
}
export function recordLoginFailure(ip: string): void {
  const list = attempts.get(ip) ?? [];
  list.push(Date.now());
  attempts.set(ip, list);
}
