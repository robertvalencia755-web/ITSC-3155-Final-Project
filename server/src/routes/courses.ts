import { Router } from 'express';
import { sql } from 'kysely';
import { db } from '../db/database.js';
import { parseId, reviewStats, searchPattern } from './helpers.js';

const router = Router();

// GET /api/courses
// Optional filters: ?q= matches course code, course name, a professor who teaches it,
// or a skill listed in one of its reviews. ?department_id= and ?professor_id= narrow further.
router.get('/', async (req, res) => {
  const pattern = searchPattern(req.query.q);
  const departmentId = parseId(req.query.department_id);
  const professorId = parseId(req.query.professor_id);

  try {
    let query = db
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
      .groupBy(['c.course_id', 'd.department_name'])
      .orderBy('c.course_code');

    if (pattern) {
      query = query.where((eb) =>
        eb.or([
          eb('c.course_code', 'ilike', pattern),
          eb('c.course_name', 'ilike', pattern),
          eb.exists(
            eb
              .selectFrom('professor_courses as pc')
              .innerJoin('professors as p', 'p.professor_id', 'pc.professor_id')
              .select(sql`1`.as('one'))
              .whereRef('pc.course_id', '=', 'c.course_id')
              .where('p.name', 'ilike', pattern)
          ),
          sql<boolean>`exists (
            select 1 from reviews r2, unnest(r2.skills) as skill
            where r2.course_id = c.course_id and skill ilike ${pattern}
          )`,
        ])
      );
    }
    if (departmentId) {
      query = query.where('c.department_id', '=', departmentId);
    }
    if (professorId) {
      query = query.where((eb) =>
        eb.exists(
          eb
            .selectFrom('professor_courses as pc')
            .select(sql`1`.as('one'))
            .whereRef('pc.course_id', '=', 'c.course_id')
            .where('pc.professor_id', '=', professorId)
        )
      );
    }

    res.json(await query.execute());
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({
      error: 'Failed to fetch courses',
    });
  }
});

// GET /api/courses/:id
// One course with its department, review averages, and the professors who teach it
// (each with averages from reviews of this course only).
router.get('/:id', async (req, res) => {
  const courseId = parseId(req.params.id);
  if (!courseId) {
    res.status(400).json({ error: 'Course ID must be a positive integer' });
    return;
  }

  try {
    const course = await db
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
      .where('c.course_id', '=', courseId)
      .groupBy(['c.course_id', 'd.department_name'])
      .executeTakeFirst();

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const professors = await db
      .selectFrom('professor_courses as pc')
      .innerJoin('professors as p', 'p.professor_id', 'pc.professor_id')
      .leftJoin('reviews as r', (join) =>
        join
          .onRef('r.professor_id', '=', 'pc.professor_id')
          .onRef('r.course_id', '=', 'pc.course_id')
      )
      .select(['p.professor_id', 'p.name', ...reviewStats])
      .where('pc.course_id', '=', courseId)
      .groupBy('p.professor_id')
      .orderBy('p.name')
      .execute();

    res.json({ ...course, professors });
  } catch (error) {
    console.error('Failed to fetch course:', error);
    res.status(500).json({
      error: 'Failed to fetch course',
    });
  }
});

// GET /api/courses/:id/reviews
// Newest first. Optional ?professor_id= to show one professor's section.
router.get('/:id/reviews', async (req, res) => {
  const courseId = parseId(req.params.id);
  if (!courseId) {
    res.status(400).json({ error: 'Course ID must be a positive integer' });
    return;
  }
  const professorId = parseId(req.query.professor_id);

  try {
    let query = db
      .selectFrom('reviews as r')
      .innerJoin('users as u', 'u.user_id', 'r.user_id')
      .innerJoin('professors as p', 'p.professor_id', 'r.professor_id')
      .selectAll('r')
      .select(['u.username', 'p.name as professor_name'])
      .where('r.course_id', '=', courseId)
      .orderBy('r.date_written', 'desc')
      .orderBy('r.review_id', 'desc');

    if (professorId) {
      query = query.where('r.professor_id', '=', professorId);
    }

    res.json(await query.execute());
  } catch (error) {
    console.error('Failed to fetch course reviews:', error);
    res.status(500).json({
      error: 'Failed to fetch course reviews',
    });
  }
});

export default router;
