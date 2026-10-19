
// Checks if rating is a valid integer between 1 and 5
export function isValidRating(rating: unknown): rating is number {
  return (
    typeof rating === 'number' &&
    Number.isInteger(rating) &&
    rating >= 1 &&
    rating <= 5
  );
}


export function validateReviewRatings(review: {
  overall_rating: unknown;
  difficulty: unknown;
  usefulness: unknown;
}): boolean {
  return (
    isValidRating(review.overall_rating) &&
    isValidRating(review.difficulty) &&
    isValidRating(review.usefulness)
  );
}

// Checks if grade is a valid letter grade or null
export function isValidGrade(grade: unknown): grade is string | null {
  const validGrades = ['A', 'B', 'C', 'D', 'F', null];
  return validGrades.includes(grade as string | null);
}

// Checks if the course_id exists and is a positive integer
export function isValidID(id: unknown): id is number {
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
}


// Checks if semester is a season followed by a four-digit year
export function isValidSemester(semester: unknown): semester is string {
  return (
    typeof semester === 'string' &&
    /^(Spring|Fall|Summer) [1-9][0-9]{3}$/i.test(semester)
  );
}

// Checks that every skill in the skills array is a non-empty string, or that skills is null
export function isValidSkills(skills: unknown): skills is string[] | null {
  return (
    skills === null ||
    (
      Array.isArray(skills) &&
      skills.every(
        skill =>
          typeof skill === 'string' &&
          skill.trim().length > 0
      )
    )
  );
}

//Checks that textbook_used is a boolean
export function isValidTextbookUsed(textbook_used: unknown): textbook_used is boolean {
  return typeof textbook_used === 'boolean';
}

export function isValidTimeCommitment(
  time_commitment: unknown
): time_commitment is number | null {
  return (
    time_commitment === null ||
    (
      typeof time_commitment === 'number' &&
      Number.isFinite(time_commitment) &&
      time_commitment >= 0
    )
  );
}

export function isValidReviewText(review_text: unknown): review_text is string | null {
  return review_text === null || (typeof review_text === 'string' && review_text.trim().length > 0);
}

export function validateReview(review: {
  overall_rating: unknown;
  difficulty: unknown;
  usefulness: unknown;
  grade: unknown;
  course_id: unknown;
  semester: unknown;
  skills: unknown;
  textbook_used: unknown;
  time_commitment: unknown;
  review_text: unknown;
}): boolean {
  return (
    validateReviewRatings(review) &&
    isValidGrade(review.grade) &&
    isValidID(review.course_id) &&
    isValidSemester(review.semester) &&
    isValidSkills(review.skills) &&
    isValidTextbookUsed(review.textbook_used) &&
    isValidTimeCommitment(review.time_commitment) &&
    isValidReviewText(review.review_text)
  );
}