
import { describe, it, expect } from 'vitest';

import {
  isValidRating,
  validateReviewRatings,
  isValidGrade,
  isValidID,
  isValidSemester,
  isValidSkills,
  isValidTextbookUsed,
  isValidTimeCommitment,
  isValidReviewText,
  validateReview
} from './reviewValidation.js';

// Valid review used as the baseline for testing
const validReview = {
  overall_rating: 5,
  difficulty: 3,
  usefulness: 4,
  grade: 'A',
  course_id: 1,
  semester: 'Fall 2026',
  skills: ['TypeScript', 'PostgreSQL'],
  textbook_used: true,
  time_commitment: 5.5,
  review_text: 'Great course with useful material.'
};

// Rating validation
describe('isValidRating', () => {
  it('accepts integer ratings between 1 and 5', () => {
    for (let rating = 1; rating <= 5; rating++) {
      expect(isValidRating(rating)).toBe(true);
    }
  });

  it('rejects ratings outside the 1-5 range', () => {
    for (const rating of [0, -1, 6, 10]) {
      expect(isValidRating(rating)).toBe(false);
    }
  });

  it('rejects decimal ratings', () => {
    expect(isValidRating(1.5)).toBe(false);
    expect(isValidRating(4.5)).toBe(false);
  });

  it('rejects invalid data types', () => {
    for (const rating of ['5', null, undefined, NaN, Infinity]) {
      expect(isValidRating(rating)).toBe(false);
    }
  });
});

describe('validateReviewRatings', () => {
  it('accepts valid ratings', () => {
    expect(validateReviewRatings({
      overall_rating: 5,
      difficulty: 3,
      usefulness: 4
    })).toBe(true);
  });

  it('rejects invalid overall ratings', () => {
    expect(validateReviewRatings({
      overall_rating: 6,
      difficulty: 3,
      usefulness: 4
    })).toBe(false);
  });

  it('rejects invalid difficulty ratings', () => {
    expect(validateReviewRatings({
      overall_rating: 5,
      difficulty: 0,
      usefulness: 4
    })).toBe(false);
  });

  it('rejects invalid usefulness ratings', () => {
    expect(validateReviewRatings({
      overall_rating: 5,
      difficulty: 3,
      usefulness: 2.5
    })).toBe(false);
  });
});

// Grade validation
describe('isValidGrade', () => {
  it('accepts valid letter grades', () => {
    for (const grade of ['A', 'B', 'C', 'D', 'F']) {
      expect(isValidGrade(grade)).toBe(true);
    }
  });

  it('accepts null', () => {
    expect(isValidGrade(null)).toBe(true);
  });

  it('rejects invalid grades', () => {
    for (const grade of ['E', 'A+', 'a', '', 95, undefined]) {
      expect(isValidGrade(grade)).toBe(false);
    }
  });
});

// ID validation
describe('isValidID', () => {
  it('accepts positive integer IDs', () => {
    for (const id of [1, 2, 100, 999]) {
      expect(isValidID(id)).toBe(true);
    }
  });

  it('rejects zero and negative IDs', () => {
    expect(isValidID(0)).toBe(false);
    expect(isValidID(-1)).toBe(false);
  });

  it('rejects decimal IDs', () => {
    expect(isValidID(1.5)).toBe(false);
  });

  it('rejects invalid types and unsafe integers', () => {
    for (const id of [
      '1',
      null,
      undefined,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1
    ]) {
      expect(isValidID(id)).toBe(false);
    }
  });
});

// Semester validation
describe('isValidSemester', () => {
  it('accepts valid semesters', () => {
    for (const semester of [
      'Spring 2026',
      'Fall 2026',
      'Summer 2026'
    ]) {
      expect(isValidSemester(semester)).toBe(true);
    }
  });

  it('ignores capitalization', () => {
    expect(isValidSemester('SPRING 2026')).toBe(true);
    expect(isValidSemester('fall 2026')).toBe(true);
    expect(isValidSemester('SuMmEr 2026')).toBe(true);
  });

  it('rejects invalid seasons', () => {
    expect(isValidSemester('Winter 2026')).toBe(false);
  });

  it('rejects invalid year formats', () => {
    for (const semester of [
      'Fall 26',
      'Fall 202',
      'Fall 20266',
      'Fall 0206',
      'Fall2026',
      'Fall 2026 ',
      ''
    ]) {
      expect(isValidSemester(semester)).toBe(false);
    }
  });

  it('rejects non-string values', () => {
    for (const semester of [2026, null, undefined, true]) {
      expect(isValidSemester(semester)).toBe(false);
    }
  });
});

// Skills validation
describe('isValidSkills', () => {
  it('accepts arrays of nonempty strings', () => {
    expect(isValidSkills(['Java', 'Python'])).toBe(true);
    expect(isValidSkills(['TypeScript'])).toBe(true);
  });

  it('accepts an empty array', () => {
    expect(isValidSkills([])).toBe(true);
  });

  it('accepts null', () => {
    expect(isValidSkills(null)).toBe(true);
  });

  it('rejects empty or whitespace-only skill names', () => {
    expect(isValidSkills(['Java', ''])).toBe(false);
    expect(isValidSkills(['Python', '   '])).toBe(false);
  });

  it('rejects non-string skill entries', () => {
    expect(isValidSkills(['Java', 123])).toBe(false);
    expect(isValidSkills([null])).toBe(false);
  });

  it('rejects non-array values', () => {
    for (const skills of ['Java', 123, undefined, true]) {
      expect(isValidSkills(skills)).toBe(false);
    }
  });
});

// Textbook validation
describe('isValidTextbookUsed', () => {
  it('accepts boolean values', () => {
    expect(isValidTextbookUsed(true)).toBe(true);
    expect(isValidTextbookUsed(false)).toBe(true);
  });

  it('rejects non-boolean values', () => {
    for (const value of [
      'true',
      'false',
      1,
      0,
      null,
      undefined
    ]) {
      expect(isValidTextbookUsed(value)).toBe(false);
    }
  });
});

// Time commitment validation
describe('isValidTimeCommitment', () => {
  it('accepts positive whole numbers', () => {
    expect(isValidTimeCommitment(1)).toBe(true);
    expect(isValidTimeCommitment(5)).toBe(true);
    expect(isValidTimeCommitment(10)).toBe(true);
  });

  it('accepts decimal values', () => {
    expect(isValidTimeCommitment(1.5)).toBe(true);
    expect(isValidTimeCommitment(2.25)).toBe(true);
    expect(isValidTimeCommitment(4.75)).toBe(true);
  });

  it('accepts zero', () => {
    expect(isValidTimeCommitment(0)).toBe(true);
  });

  it('accepts null', () => {
    expect(isValidTimeCommitment(null)).toBe(true);
  });

  it('rejects negative numbers', () => {
    expect(isValidTimeCommitment(-1)).toBe(false);
    expect(isValidTimeCommitment(-2.5)).toBe(false);
  });

  it('rejects non-finite numbers', () => {
    expect(isValidTimeCommitment(Infinity)).toBe(false);
    expect(isValidTimeCommitment(-Infinity)).toBe(false);
    expect(isValidTimeCommitment(NaN)).toBe(false);
  });

  it('rejects invalid data types', () => {
    for (const value of ['5', undefined, true, false]) {
      expect(isValidTimeCommitment(value)).toBe(false);
    }
  });
});

// Review text validation
describe('isValidReviewText', () => {
  it('accepts nonempty review text', () => {
    expect(isValidReviewText('Great course!')).toBe(true);
    expect(isValidReviewText('Very informative.')).toBe(true);
  });

  it('accepts null', () => {
    expect(isValidReviewText(null)).toBe(true);
  });

  it('rejects empty or whitespace-only strings', () => {
    expect(isValidReviewText('')).toBe(false);
    expect(isValidReviewText('   ')).toBe(false);
  });

  it('rejects non-string values', () => {
    for (const value of [123, undefined, true]) {
      expect(isValidReviewText(value)).toBe(false);
    }
  });
});

// Complete review validation
describe('validateReview', () => {
  it('accepts a complete valid review', () => {
    expect(validateReview(validReview)).toBe(true);
  });

  it('accepts a review with decimal time commitment', () => {
    expect(validateReview({
      ...validReview,
      time_commitment: 2.75
    })).toBe(true);
  });

  it('accepts null optional fields', () => {
    expect(validateReview({
      ...validReview,
      grade: null,
      skills: null,
      time_commitment: null,
      review_text: null
    })).toBe(true);
  });

  it('rejects an invalid overall rating', () => {
    expect(validateReview({
      ...validReview,
      overall_rating: 10
    })).toBe(false);
  });

  it('rejects an invalid difficulty rating', () => {
    expect(validateReview({
      ...validReview,
      difficulty: 0
    })).toBe(false);
  });

  it('rejects an invalid usefulness rating', () => {
    expect(validateReview({
      ...validReview,
      usefulness: 2.5
    })).toBe(false);
  });

  it('rejects an invalid grade', () => {
    expect(validateReview({
      ...validReview,
      grade: 'E'
    })).toBe(false);
  });

  it('rejects an invalid course ID', () => {
    expect(validateReview({
      ...validReview,
      course_id: -1
    })).toBe(false);
  });

  it('rejects an invalid semester', () => {
    expect(validateReview({
      ...validReview,
      semester: 'Winter 2026'
    })).toBe(false);
  });

  it('rejects invalid skills', () => {
    expect(validateReview({
      ...validReview,
      skills: ['Python', 123]
    })).toBe(false);
  });

  it('rejects an invalid textbook value', () => {
    expect(validateReview({
      ...validReview,
      textbook_used: 'yes'
    })).toBe(false);
  });

  it('rejects a negative time commitment', () => {
    expect(validateReview({
      ...validReview,
      time_commitment: -5
    })).toBe(false);
  });

  it('rejects an infinite time commitment', () => {
    expect(validateReview({
      ...validReview,
      time_commitment: Infinity
    })).toBe(false);
  });

  it('rejects empty review text', () => {
    expect(validateReview({
      ...validReview,
      review_text: '   '
    })).toBe(false);
  });

  it('rejects missing required fields', () => {
    expect(validateReview({
      ...validReview,
      semester: undefined
    })).toBe(false);

    expect(validateReview({
      ...validReview,
      usefulness: undefined
    })).toBe(false);

    expect(validateReview({
      ...validReview,
      course_id: undefined
    })).toBe(false);
  });
});
