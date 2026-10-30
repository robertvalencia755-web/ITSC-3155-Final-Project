import { sql } from 'kysely';
import { isValidID } from '../Validation/reviewValidation.js';

// Turns a route or query param into a positive integer ID, or null if it is not one.
export function parseId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null;
  }
  const id = Number(value);
  return isValidID(id) ? id : null;
}

// Turns ?q=... into an ILIKE pattern, or null when there is no search term.
// % and _ are escaped so a search for "100%" matches the text literally.
export function searchPattern(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  return `%${value.trim().replace(/[\\%_]/g, '\\$&')}%`;
}

// Aggregate columns over reviews joined in as "r". Averages are null when there
// are no reviews. avg_grade_points maps A=4, B=3, C=2, D=1, F=0 and skips null grades.
export const reviewStats = [
  sql<number>`count(r.review_id)::int`.as('review_count'),
  sql<number | null>`round(avg(r.overall_rating), 2)::float8`.as('avg_rating'),
  sql<number | null>`round(avg(r.difficulty), 2)::float8`.as('avg_difficulty'),
  sql<number | null>`round(avg(r.usefulness), 2)::float8`.as('avg_usefulness'),
  sql<number | null>`round(avg(r.time_commitment)::numeric, 2)::float8`.as('avg_time_commitment'),
  sql<number | null>`round(avg(
    CASE r.grade WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 WHEN 'D' THEN 1 WHEN 'F' THEN 0 END
  ), 2)::float8`.as('avg_grade_points'),
] as const;
