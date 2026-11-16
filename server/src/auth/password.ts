import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const KEY_LENGTH = 64;

// Stored as "scrypt:<salt>:<hash>" in users.password_hash.
// scrypt is deliberately slow, so a leaked hash is expensive to brute force.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${hash.toString('hex')}`;
}

// True when the password matches the stored hash. Any malformed hash is a mismatch.
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hashHex] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hashHex) {
    return false;
  }

  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length !== KEY_LENGTH) {
    return false;
  }

  const actual = await scryptAsync(password, salt, KEY_LENGTH);
  // timingSafeEqual takes the same time whether the first byte or the last one differs.
  return timingSafeEqual(actual, expected);
}
