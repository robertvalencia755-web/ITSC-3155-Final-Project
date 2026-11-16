import { Router } from 'express';
import { sql } from 'kysely';
import { db } from '../db/database.js';
import { parseId, reviewStats } from './helpers.js';

const router = Router();

// GET /api/users/:id
// Public profile fields only. Email and password_hash are never sent.
router.get('/:id', async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) {
    res.status(400).json({ error: 'User ID must be a positive integer' });
    return;
  }

  try {
    const user = await db
      .selectFrom('users as u')
      .leftJoin('reviews as r', 'r.user_id', 'u.user_id')
      .select([
        'u.user_id',
        'u.username',
        'u.profile_picture',
        'u.saved_courses',
        'u.created_at',
        sql<number>`count(r.review_id)::int`.as('review_count'),
      ])
      .where('u.user_id', '=', userId)
      .groupBy('u.user_id')
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
    });
  }
});

// GET /api/users/:id/account
// Private account details including email (never password_hash).
router.get('/:id/account', async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) {
    res.status(400).json({ error: 'User ID must be a positive integer' });
    return;
  }

  try {
    const user = await db
      .selectFrom('users')
      .select(['user_id', 'username', 'email', 'profile_picture', 'saved_courses', 'created_at'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Failed to fetch user account:', error);
    res.status(500).json({ error: 'Failed to fetch user account' });
  }
});

// PATCH /api/users/:id
// Updates username and/or email for the user.
router.patch('/:id', async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) {
    res.status(400).json({ error: 'User ID must be a positive integer' });
    return;
  }

  const { username, email } = req.body ?? {};

  if (username === undefined && email === undefined) {
    res.status(400).json({ error: 'At least one of username or email must be provided' });
    return;
  }

  const updates: { username?: string; email?: string } = {};

  if (username !== undefined) {
    if (typeof username !== 'string' || username.trim().length === 0) {
      res.status(400).json({ error: 'Username cannot be blank' });
      return;
    }
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      res.status(400).json({ error: 'Username must be between 3 and 50 characters' });
      return;
    }

    const existing = await db
      .selectFrom('users')
      .select('user_id')
      .where('username', '=', trimmedUsername)
      .where('user_id', '!=', userId)
      .executeTakeFirst();

    if (existing) {
      res.status(409).json({ error: 'Username is already taken' });
      return;
    }
    updates.username = trimmedUsername;
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || email.trim().length === 0) {
      res.status(400).json({ error: 'Email cannot be blank' });
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      res.status(400).json({ error: 'Invalid email address format' });
      return;
    }

    const existing = await db
      .selectFrom('users')
      .select('user_id')
      .where('email', '=', trimmedEmail)
      .where('user_id', '!=', userId)
      .executeTakeFirst();

    if (existing) {
      res.status(409).json({ error: 'Email is already in use' });
      return;
    }
    updates.email = trimmedEmail;
  }

  try {
    const updated = await db
      .updateTable('users')
      .set(updates)
      .where('user_id', '=', userId)
      .returning(['user_id', 'username', 'email'])
      .executeTakeFirst();

    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error('Failed to update user account:', error);
    res.status(500).json({ error: 'Failed to update user account' });
  }
});

// PATCH /api/users/:id/avatar
// Updates the user's profile picture.
router.patch('/:id/avatar', async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) {
    res.status(400).json({ error: 'User ID must be a positive integer' });
    return;
  }

  const { profile_picture } = req.body ?? {};
  if (!profile_picture || typeof profile_picture !== 'string') {
    res.status(400).json({ error: 'profile_picture is required and must be a string' });
    return;
  }

  // Basic validation: ensure data URL or valid path
  if (!profile_picture.startsWith('data:image/') && !profile_picture.startsWith('/')) {
    res.status(400).json({ error: 'profile_picture must be an image data URL or valid path' });
    return;
  }

  try {
    const updated = await db
      .updateTable('users')
      .set({ profile_picture })
      .where('user_id', '=', userId)
      .returning(['user_id', 'username', 'profile_picture'])
      .executeTakeFirst();

    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error('Failed to update profile picture:', error);
    res.status(500).json({
      error: 'Failed to update profile picture',
    });
  }
});

// GET /api/users/:id/saved-courses
// Returns all courses saved by this user, with department and review averages.
router.get('/:id/saved-courses', async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) {
    res.status(400).json({ error: 'User ID must be a positive integer' });
    return;
  }

  try {
    const user = await db
      .selectFrom('users')
      .select(['saved_courses'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const savedIds = user.saved_courses ?? [];
    if (savedIds.length === 0) {
      res.json([]);
      return;
    }

    const courses = await db
      .selectFrom('courses as c')
      .innerJoin('departments as d', 'd.department_id', 'c.department_id')
      .leftJoin('reviews as r', 'r.course_id', 'c.course_id')
      .select([
        'c.course_id',
        'c.course_code',
        'c.course_name',
        'c.department_id',
        'd.department_name',
        ...reviewStats,
      ])
      .where('c.course_id', 'in', savedIds)
      .groupBy(['c.course_id', 'd.department_name'])
      .orderBy('c.course_code')
      .execute();

    res.json(courses);
  } catch (error) {
    console.error('Failed to fetch saved courses:', error);
    res.status(500).json({ error: 'Failed to fetch saved courses' });
  }
});

// GET /api/users/:id/saved-courses/:courseId
// Checks if a specific course is saved by the user.
router.get('/:id/saved-courses/:courseId', async (req, res) => {
  const userId = parseId(req.params.id);
  const courseId = parseId(req.params.courseId);

  if (!userId || !courseId) {
    res.status(400).json({ error: 'User ID and Course ID must be positive integers' });
    return;
  }

  try {
    const user = await db
      .selectFrom('users')
      .select(['saved_courses'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isSaved = (user.saved_courses ?? []).includes(courseId);
    res.json({ course_id: courseId, is_saved: isSaved });
  } catch (error) {
    console.error('Failed to check saved course status:', error);
    res.status(500).json({ error: 'Failed to check saved course status' });
  }
});

// POST /api/users/:id/saved-courses/:courseId
// Saves a course for the user.
router.post('/:id/saved-courses/:courseId', async (req, res) => {
  const userId = parseId(req.params.id);
  const courseId = parseId(req.params.courseId);

  if (!userId || !courseId) {
    res.status(400).json({ error: 'User ID and Course ID must be positive integers' });
    return;
  }

  try {
    const course = await db
      .selectFrom('courses')
      .select('course_id')
      .where('course_id', '=', courseId)
      .executeTakeFirst();

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const user = await db
      .selectFrom('users')
      .select(['user_id', 'saved_courses'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const currentSaved = user.saved_courses ?? [];
    if (!currentSaved.includes(courseId)) {
      const updatedSaved = [...currentSaved, courseId];
      await db
        .updateTable('users')
        .set({ saved_courses: updatedSaved })
        .where('user_id', '=', userId)
        .execute();
      res.status(200).json({ saved: true, course_id: courseId, saved_courses: updatedSaved });
      return;
    }

    res.status(200).json({ saved: true, course_id: courseId, saved_courses: currentSaved });
  } catch (error) {
    console.error('Failed to save course:', error);
    res.status(500).json({ error: 'Failed to save course' });
  }
});

// DELETE /api/users/:id/saved-courses/:courseId
// Un-saves a course for the user.
router.delete('/:id/saved-courses/:courseId', async (req, res) => {
  const userId = parseId(req.params.id);
  const courseId = parseId(req.params.courseId);

  if (!userId || !courseId) {
    res.status(400).json({ error: 'User ID and Course ID must be positive integers' });
    return;
  }

  try {
    const user = await db
      .selectFrom('users')
      .select(['user_id', 'saved_courses'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const currentSaved = user.saved_courses ?? [];
    const updatedSaved = currentSaved.filter((id) => id !== courseId);
    await db
      .updateTable('users')
      .set({ saved_courses: updatedSaved })
      .where('user_id', '=', userId)
      .execute();

    res.status(200).json({ saved: false, course_id: courseId, saved_courses: updatedSaved });
  } catch (error) {
    console.error('Failed to un-save course:', error);
    res.status(500).json({ error: 'Failed to un-save course' });
  }
});

// GET /api/users/:id/reviews
// Every review this user has written, newest first, for the profile page.
router.get('/:id/reviews', async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) {
    res.status(400).json({ error: 'User ID must be a positive integer' });
    return;
  }

  try {
    const reviews = await db
      .selectFrom('reviews as r')
      .innerJoin('courses as c', 'c.course_id', 'r.course_id')
      .innerJoin('professors as p', 'p.professor_id', 'r.professor_id')
      .selectAll('r')
      .select(['c.course_code', 'c.course_name', 'p.name as professor_name'])
      .where('r.user_id', '=', userId)
      .orderBy('r.date_written', 'desc')
      .orderBy('r.review_id', 'desc')
      .execute();

    res.json(reviews);
  } catch (error) {
    console.error('Failed to fetch user reviews:', error);
    res.status(500).json({
      error: 'Failed to fetch user reviews',
    });
  }
});

export default router;
