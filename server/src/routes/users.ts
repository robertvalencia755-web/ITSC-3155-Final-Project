import { Router } from 'express';
import { sql } from 'kysely';
import { db } from '../db/database.js';
import { parseId } from './helpers.js';

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
