import { createHash, randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { sql } from 'kysely';
import { db } from '../db/database.js';

export const SESSION_COOKIE = 'courselens_session';
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

// What the rest of the server knows about the signed-in user. Never includes password_hash.
export interface SessionUser {
  user_id: number;
  username: string;
  email: string;
  created_at: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// "a=1; courselens_session=abc" -> { a: '1', courselens_session: 'abc' }
export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) {
    return cookies;
  }
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) {
      continue;
    }
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
}

function sessionToken(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE];
}

// Creates a session row and sets the cookie. The raw token only ever lives in the cookie.
export async function startSession(res: Response, userId: number): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MS);

  // Clear out expired rows while we are here, so the table does not grow forever.
  await db.deleteFrom('sessions').where('expires_at', '<', sql<Date>`now()`).execute();
  await db
    .insertInto('sessions')
    .values({ token_hash: hashToken(token), user_id: userId, expires_at: expiresAt })
    .execute();

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true, // page JavaScript cannot read it, so an injected script cannot steal it
    sameSite: 'lax', // not sent on POSTs from other sites
    secure: process.env.NODE_ENV === 'production', // HTTPS only once deployed
    path: '/',
    maxAge: SESSION_MS,
  });
}

export async function endSession(req: Request, res: Response): Promise<void> {
  const token = sessionToken(req);
  if (token) {
    await db.deleteFrom('sessions').where('token_hash', '=', hashToken(token)).execute();
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

// Runs on every request. Sets req.user when the cookie points at a live session.
export async function loadUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = sessionToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const user = await db
      .selectFrom('sessions as s')
      .innerJoin('users as u', 'u.user_id', 's.user_id')
      .select(['u.user_id', 'u.username', 'u.email', 'u.created_at'])
      .where('s.token_hash', '=', hashToken(token))
      .where('s.expires_at', '>', sql<Date>`now()`)
      .executeTakeFirst();
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// Put in front of any route that needs a signed-in user.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'You need to log in first' });
    return;
  }
  next();
}
