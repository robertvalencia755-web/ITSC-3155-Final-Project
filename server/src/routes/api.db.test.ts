// Runs against the local database with the sample data loaded.
// Start it first: docker compose up -d, npm run db:migrate, npm run db:seed, then npm run test:db.
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { db } from '../db/database.js';

const createdReviewIds: number[] = [];

afterAll(async () => {
  if (createdReviewIds.length > 0) {
    await db.deleteFrom('reviews').where('review_id', 'in', createdReviewIds).execute();
  }
  await db.destroy();
});

async function courseIdFor(code: string): Promise<number> {
  const response = await request(app).get('/api/courses').query({ q: code });
  return response.body[0].course_id;
}

describe('GET /api/courses', () => {
  it('lists every seeded course with review averages', async () => {
    const response = await request(app).get('/api/courses');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(9);
    const swe = response.body.find((c: { course_code: string }) => c.course_code === 'ITSC 3155');
    expect(swe).toMatchObject({
      course_name: 'Software Engineering',
      department_name: 'Computer Science',
      review_count: 1,
      avg_rating: 5,
      avg_grade_points: 4,
    });
  });

  it('searches by course name, professor name, and review skill', async () => {
    const byName = await request(app).get('/api/courses').query({ q: 'linear algebra' });
    expect(byName.body.map((c: { course_code: string }) => c.course_code)).toEqual(['MATH 2164']);

    const byProfessor = await request(app).get('/api/courses').query({ q: 'okafor' });
    expect(byProfessor.body.map((c: { course_code: string }) => c.course_code)).toEqual([
      'ITSC 2214',
      'ITSC 3146',
    ]);

    const bySkill = await request(app).get('/api/courses').query({ q: 'sockets' });
    expect(bySkill.body.map((c: { course_code: string }) => c.course_code)).toEqual(['ITSC 3146']);
  });
});

describe('GET /api/courses/:id', () => {
  it('returns the course with each professor who teaches it', async () => {
    const id = await courseIdFor('ITSC 2214');
    const response = await request(app).get(`/api/courses/${id}`);

    expect(response.status).toBe(200);
    expect(response.body.review_count).toBe(2);
    expect(response.body.professors.map((p: { name: string }) => p.name)).toEqual([
      'Alice Moreno',
      'Ben Okafor',
    ]);
  });

  it('returns 404 for a course that does not exist and 400 for a bad ID', async () => {
    expect((await request(app).get('/api/courses/99999')).status).toBe(404);
    expect((await request(app).get('/api/courses/abc')).status).toBe(400);
  });
});

describe('GET /api/courses/:id/reviews', () => {
  it('returns reviews with the author and professor names', async () => {
    const id = await courseIdFor('ITSC 2214');
    const response = await request(app).get(`/api/courses/${id}/reviews`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({ username: 'maya_cs', professor_name: 'Alice Moreno' });
    expect(response.body[0].skills).toEqual(['Java', 'linked lists', 'trees', 'Big-O analysis']);
  });
});

describe('professors, departments and users', () => {
  it('lists professors and returns one with their courses', async () => {
    const list = await request(app).get('/api/professors').query({ q: 'rossi' });
    expect(list.body).toHaveLength(1);

    const detail = await request(app).get(`/api/professors/${list.body[0].professor_id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.courses.map((c: { course_code: string }) => c.course_code)).toEqual([
      'ITIS 3135',
      'ITIS 4166',
    ]);
    // Rossi teaches ITIS 3135 but every seeded review of it is for another professor.
    expect(detail.body.courses[0]).toMatchObject({ review_count: 0, avg_rating: null });
  });

  it('lists departments', async () => {
    const response = await request(app).get('/api/departments');
    expect(response.body).toHaveLength(3);
  });

  it('returns a user without email or password hash', async () => {
    const user = await db.selectFrom('users').select('user_id').where('username', '=', 'maya_cs').executeTakeFirstOrThrow();
    const response = await request(app).get(`/api/users/${user.user_id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ username: 'maya_cs', review_count: 3 });
    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('password_hash');

    const reviews = await request(app).get(`/api/users/${user.user_id}/reviews`);
    expect(reviews.body).toHaveLength(3);
  });
});

describe('POST /api/reviews', () => {
  async function validBody() {
    const user = await db.selectFrom('users').select('user_id').where('username', '=', 'demo_user').executeTakeFirstOrThrow();
    const professor = await db.selectFrom('professors').select('professor_id').where('name', '=', 'Carla Nguyen').executeTakeFirstOrThrow();
    return {
      user_id: user.user_id,
      professor_id: professor.professor_id,
      course_id: await courseIdFor('ITSC 3155'),
      overall_rating: 4,
      difficulty: 3,
      usefulness: 5,
      grade: 'A',
      semester: 'fall 2026',
      textbook_used: false,
      skills: ['Git'],
      time_commitment: 5.5,
      review_text: 'Test review from api.db.test.ts',
    };
  }

  it('creates a review, keeping a decimal time commitment', async () => {
    const response = await request(app).post('/api/reviews').send(await validBody());

    expect(response.status).toBe(201);
    createdReviewIds.push(response.body.review_id);
    expect(response.body).toMatchObject({ semester: 'Fall 2026', time_commitment: 5.5 });
    expect(response.body.date_written).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rejects a review that fails validation', async () => {
    const response = await request(app).post('/api/reviews').send({ ...(await validBody()), overall_rating: 9 });
    expect(response.status).toBe(400);
  });

  it('rejects a professor who does not teach the course', async () => {
    const body = await validBody();
    const response = await request(app)
      .post('/api/reviews')
      .send({ ...body, course_id: await courseIdFor('MATH 2164') });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('That professor does not teach that course');
  });

  it('returns JSON for a malformed body', async () => {
    const response = await request(app)
      .post('/api/reviews')
      .set('Content-Type', 'application/json')
      .send('{"overall_rating": ');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Bad request' });
  });
});
