import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export const SESSION_COOKIE = 'bolsaria_session';
export const SESSION_DAYS = 14;

// Palavras-passe: scrypt com sal aleatório. Formato guardado: scrypt$<sal hex>$<hash hex>.
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Tokens: o cliente recebe o valor aleatório; a base de dados guarda apenas o hash SHA-256.
export const createToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export function parseCookies(header = '') {
  const cookies = {};
  header.split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index < 0) return;
    const key = part.slice(0, index).trim();
    if (key) cookies[key] = decodeURIComponent(part.slice(index + 1).trim());
  });
  return cookies;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

// Limite simples de tentativas em memória (por chave), contra força bruta no login e na recuperação.
export function createRateLimiter({ max, windowMs }) {
  const hits = new Map();
  return {
    check(key) {
      const nowMs = Date.now();
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= nowMs) {
        hits.set(key, { count: 1, resetAt: nowMs + windowMs });
        return true;
      }
      entry.count += 1;
      return entry.count <= max;
    },
    reset(key) { hits.delete(key); },
  };
}
