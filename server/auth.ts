import crypto from 'node:crypto';

// In-memory or database session token mapping
const SESSIONS = new Map<string, { userId: string; email: string; name: string; expiresAt: number }>();

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(key, 'hex'));
}

export function createSessionToken(user: { id: string; email: string; name: string }): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 30 days session
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  SESSIONS.set(token, {
    userId: user.id,
    email: user.email,
    name: user.name,
    expiresAt,
  });
  return token;
}

export function verifySessionToken(token: string) {
  if (!token) return null;
  const session = SESSIONS.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    return null;
  }
  return session;
}

export function deleteSessionToken(token: string) {
  SESSIONS.delete(token);
}
