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
