import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET /api/departments
// For department filter dropdowns.
router.get('/', async (_req, res) => {
  try {
    const departments = await db
      .selectFrom('departments')
      .selectAll()
      .orderBy('department_name')
      .execute();

    res.json(departments);
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    res.status(500).json({
      error: 'Failed to fetch departments',
    });
  }
});

export default router;
