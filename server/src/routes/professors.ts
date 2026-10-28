import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const professors = await db
      .selectFrom('professors')
      .selectAll()
      .execute();

    res.json(professors);
  } catch (error) {
    console.error('Failed to fetch professors:', error);
    res.status(500).json({
      error: 'Failed to fetch professors',
    });
  }
});

export default router;