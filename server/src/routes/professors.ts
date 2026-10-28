import { Router } from 'express';
import { db } from '../db/database.js';
import { parseId, reviewStats, searchPattern } from './helpers.js';

const router = Router();

// GET /api/professors
// Optional filters: ?q= matches the professor's name, ?department_id= narrows to one department.
router.get('/', async (req, res) => {
  const pattern = searchPattern(req.query.q);
  const departmentId = parseId(req.query.department_id);

  try {
    let query = db
      .selectFrom('professors as p')
      .innerJoin('departments as d', 'd.department_id', 'p.department_id')
      .leftJoin('reviews as r', 'r.professor_id', 'p.professor_id')
      .select([
        'p.professor_id',
        'p.name',
        'p.department_id',
        'd.department_name',
        ...reviewStats,
      ])
      .groupBy(['p.professor_id', 'd.department_name'])
      .orderBy('p.name');

    if (pattern) {
      query = query.where('p.name', 'ilike', pattern);
    }
    if (departmentId) {
      query = query.where('p.department_id', '=', departmentId);
    }

    res.json(await query.execute());
  } catch (error) {
    console.error('Failed to fetch professors:', error);
    res.status(500).json({
      error: 'Failed to fetch professors',
    });
  }
});

// GET /api/professors/:id
// One professor with review averages and the courses they teach
// (each with averages from this professor's reviews only).
router.get('/:id', async (req, res) => {
  const professorId = parseId(req.params.id);
  if (!professorId) {
    res.status(400).json({ error: 'Professor ID must be a positive integer' });
    return;
  }

  try {
    const professor = await db
      .selectFrom('professors as p')
      .innerJoin('departments as d', 'd.department_id', 'p.department_id')
      .leftJoin('reviews as r', 'r.professor_id', 'p.professor_id')
      .select([
        'p.professor_id',
        'p.name',
        'p.department_id',
        'd.department_name',
        ...reviewStats,
      ])
      .where('p.professor_id', '=', professorId)
      .groupBy(['p.professor_id', 'd.department_name'])
      .executeTakeFirst();

    if (!professor) {
      res.status(404).json({ error: 'Professor not found' });
      return;
    }

    const courses = await db
      .selectFrom('professor_courses as pc')
      .innerJoin('courses as c', 'c.course_id', 'pc.course_id')
      .leftJoin('reviews as r', (join) =>
        join
          .onRef('r.professor_id', '=', 'pc.professor_id')
          .onRef('r.course_id', '=', 'pc.course_id')
      )
      .select(['c.course_id', 'c.course_code', 'c.course_name', ...reviewStats])
      .where('pc.professor_id', '=', professorId)
      .groupBy('c.course_id')
      .orderBy('c.course_code')
      .execute();

    res.json({ ...professor, courses });
  } catch (error) {
    console.error('Failed to fetch professor:', error);
    res.status(500).json({
      error: 'Failed to fetch professor',
    });
  }
});

// GET /api/professors/:id/reviews
// Newest first, across every course this professor teaches.
router.get('/:id/reviews', async (req, res) => {
  const professorId = parseId(req.params.id);
  if (!professorId) {
    res.status(400).json({ error: 'Professor ID must be a positive integer' });
    return;
  }

  try {
    const reviews = await db
      .selectFrom('reviews as r')
      .innerJoin('users as u', 'u.user_id', 'r.user_id')
      .innerJoin('courses as c', 'c.course_id', 'r.course_id')
      .selectAll('r')
      .select(['u.username', 'c.course_code', 'c.course_name'])
      .where('r.professor_id', '=', professorId)
      .orderBy('r.date_written', 'desc')
      .orderBy('r.review_id', 'desc')
      .execute();

    res.json(reviews);
  } catch (error) {
    console.error('Failed to fetch professor reviews:', error);
    res.status(500).json({
      error: 'Failed to fetch professor reviews',
    });
  }
});

export default router;
