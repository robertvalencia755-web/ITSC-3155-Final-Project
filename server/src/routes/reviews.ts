import { Router } from 'express';
import { db } from '../db/database.js';
import { isValidID, validateReview } from '../Validation/reviewValidation.js';
import { requireAuth } from '../auth/session.js';

const router = Router();

// "fall 2026" -> "Fall 2026". The validator already accepts any capitalization.
function normalizeSemester(semester: string): string {
  const [season, year] = semester.split(' ');
  return `${season[0].toUpperCase()}${season.slice(1).toLowerCase()} ${year}`;
}

// POST /api/reviews
// Requires a signed-in user. The author is always the session's user; a user_id in the
// body is ignored, so nobody can post a review under someone else's account.
router.post('/', requireAuth, async (req, res) => {
  const body = req.body ?? {};
  const review = {
    user_id: req.user!.user_id,
    professor_id: body.professor_id,
    course_id: body.course_id,
    overall_rating: body.overall_rating,
    difficulty: body.difficulty,
    usefulness: body.usefulness,
    grade: body.grade ?? null,
    semester: body.semester,
    textbook_used: body.textbook_used,
    workload: body.workload ?? null,
    skills: body.skills ?? null,
    time_commitment: body.time_commitment ?? null,
    review_text: body.review_text ?? null,
  };

  if (
    !validateReview(review) ||
    !isValidID(review.professor_id) ||
    (review.workload !== null && typeof review.workload !== 'string')
  ) {
    res.status(400).json({ error: 'Invalid review' });
    return;
  }

  try {
    const section = await db
      .selectFrom('professor_courses')
      .selectAll()
      .where('professor_id', '=', review.professor_id)
      .where('course_id', '=', review.course_id as number)
      .executeTakeFirst();
    if (!section) {
      res.status(400).json({ error: 'That professor does not teach that course' });
      return;
    }

    const created = await db
      .insertInto('reviews')
      .values({
        ...review,
        course_id: review.course_id as number,
        overall_rating: review.overall_rating as number,
        difficulty: review.difficulty as number,
        usefulness: review.usefulness as number,
        grade: review.grade as string | null,
        semester: normalizeSemester(review.semester as string),
        textbook_used: review.textbook_used as boolean,
        workload: review.workload as string | null,
        skills: review.skills as string[] | null,
        time_commitment: review.time_commitment as number | null,
        review_text: review.review_text as string | null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create review:', error);
    res.status(500).json({
      error: 'Failed to create review',
    });
  }
});

export default router;
