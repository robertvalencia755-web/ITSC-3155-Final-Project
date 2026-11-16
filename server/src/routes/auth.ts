import { Router } from 'express';
import { sql } from 'kysely';
import { db } from '../db/database.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { endSession, requireAuth, startSession } from '../auth/session.js';
import { normalizeEmail, PASSWORD_MAX, validateSignup } from '../Validation/authValidation.js';

const router = Router();

// Checked against when the account is unknown, so a wrong email or username takes as long as a
// wrong password and response time does not reveal which accounts exist.
const DUMMY_HASH = hashPassword('not-a-real-password');

// Postgres error code for a unique constraint violation.
const UNIQUE_VIOLATION = '23505';

// POST /api/auth/signup  { email, username, password }
// Creates the account and signs it in.
router.post('/signup', async (req, res, next) => {
  const result = validateSignup(req.body);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  const { email, username, password } = result.value;

  try {
    const taken = await db
      .selectFrom('users')
      .select(['email', 'username'])
      .where((eb) =>
        eb.or([
          eb('email', '=', email),
          eb(sql`lower(username)`, '=', username.toLowerCase()),
        ])
      )
      .executeTakeFirst();
    if (taken) {
      res.status(409).json({
        error: taken.email === email
          ? 'An account with that email already exists'
          : 'That username is taken',
      });
      return;
    }

    const user = await db
      .insertInto('users')
      .values({ email, username, password_hash: await hashPassword(password) })
      .returning(['user_id', 'username', 'email', 'created_at'])
      .executeTakeFirstOrThrow();

    await startSession(res, user.user_id);
    res.status(201).json(user);
  } catch (error) {
    // Two sign-ups for the same name at the same moment: the second hits the unique constraint.
    if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
      res.status(409).json({ error: 'That email or username is already in use' });
      return;
    }
    next(error);
  }
});

// POST /api/auth/login  { login, password }
// login is an email or a username. A body with "email" instead of "login" also works.
router.post('/login', async (req, res, next) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const login = body.login ?? body.email;
  const password = body.password;
  if (
    typeof login !== 'string' ||
    login.trim() === '' ||
    typeof password !== 'string' ||
    password === '' ||
    password.length > PASSWORD_MAX
  ) {
    res.status(400).json({ error: 'Enter your email or username and your password' });
    return;
  }

  try {
    const value = login.trim();
    const user = await db
      .selectFrom('users')
      .select(['user_id', 'username', 'email', 'created_at', 'password_hash'])
      .where(
        value.includes('@')
          ? (eb) => eb('email', '=', normalizeEmail(value))
          : (eb) => eb(sql`lower(username)`, '=', value.toLowerCase())
      )
      .executeTakeFirst();

    const matches = await verifyPassword(password, user?.password_hash ?? (await DUMMY_HASH));
    if (!user || !matches) {
      // Same message either way, so the form does not confirm which accounts exist.
      res.status(401).json({ error: 'Incorrect email, username or password' });
      return;
    }

    await startSession(res, user.user_id);
    const { password_hash: _hash, ...publicUser } = user;
    res.json(publicUser);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    await endSession(req, res);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
// The signed-in user, or 401. Pages call this to decide what to show.
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
