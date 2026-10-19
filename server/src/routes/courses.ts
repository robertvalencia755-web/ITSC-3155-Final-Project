import { Router } from 'express';
import { db } from '../db/database';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const courses = await db
      .selectFrom('courses')
      .selectAll()
      .execute();

    res.json(courses);
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({
      error: 'Failed to fetch courses',
    });
  }
});

export default router;