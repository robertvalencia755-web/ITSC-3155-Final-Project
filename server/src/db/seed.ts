import 'dotenv/config';
import { randomBytes, scryptSync } from 'node:crypto';
import { sql } from 'kysely';
import { db } from './database';

// Sample data for local development. Professors and users are made up.

const departments = [
  'Computer Science',
  'Software and Information Systems',
  'Mathematics and Statistics',
];

const courses = [
  { department: 'Computer Science', code: 'ITSC 1212', name: 'Introduction to Computer Science I' },
  { department: 'Computer Science', code: 'ITSC 2214', name: 'Data Structures and Algorithms' },
  { department: 'Computer Science', code: 'ITSC 3146', name: 'Introduction to Operating Systems and Networking' },
  { department: 'Computer Science', code: 'ITSC 3155', name: 'Software Engineering' },
  { department: 'Computer Science', code: 'ITCS 3160', name: 'Database Design and Implementation' },
  { department: 'Software and Information Systems', code: 'ITIS 3135', name: 'Front-End Web Application Development' },
  { department: 'Software and Information Systems', code: 'ITIS 4166', name: 'Back-End Web Application Development' },
  { department: 'Mathematics and Statistics', code: 'MATH 2164', name: 'Matrices and Linear Algebra' },
  { department: 'Mathematics and Statistics', code: 'STAT 2122', name: 'Introduction to Probability and Statistics' },
];

// Each professor lists the course codes they teach (professor_courses rows).
const professors = [
  { name: 'Alice Moreno', department: 'Computer Science', teaches: ['ITSC 1212', 'ITSC 2214'] },
  { name: 'Ben Okafor', department: 'Computer Science', teaches: ['ITSC 2214', 'ITSC 3146'] },
  { name: 'Carla Nguyen', department: 'Computer Science', teaches: ['ITSC 3155', 'ITCS 3160'] },
  { name: 'Daniel Price', department: 'Software and Information Systems', teaches: ['ITIS 3135'] },
  { name: 'Elena Rossi', department: 'Software and Information Systems', teaches: ['ITIS 3135', 'ITIS 4166'] },
  { name: 'Farah Siddiqui', department: 'Mathematics and Statistics', teaches: ['MATH 2164'] },
  { name: 'George Hall', department: 'Mathematics and Statistics', teaches: ['MATH 2164', 'STAT 2122'] },
];

// Every seeded account uses this password so anyone can log in locally.
const SEED_PASSWORD = 'password123';

const users = [
  { username: 'maya_cs', email: 'maya@example.com' },
  { username: 'jordan_transfer', email: 'jordan@example.com' },
  { username: 'priya_reviews', email: 'priya@example.com' },
  { username: 'demo_user', email: 'demo@example.com' },
];

const reviews = [
  {
    user: 'priya_reviews', professor: 'Alice Moreno', course: 'ITSC 1212',
    date_written: '2025-12-15', semester: 'Fall 2025', grade: 'A',
    overall_rating: 5, difficulty: 2, usefulness: 5, textbook_used: false,
    workload: 'Light', time_commitment: 4, skills: ['Java', 'debugging', 'loops and arrays'],
    review_text: 'Great first course. Weekly labs are short and the projects build on each other.',
  },
  {
    user: 'maya_cs', professor: 'Alice Moreno', course: 'ITSC 2214',
    date_written: '2025-12-18', semester: 'Fall 2025', grade: 'B+',
    overall_rating: 4, difficulty: 4, usefulness: 5, textbook_used: true,
    workload: 'Heavy', time_commitment: 10, skills: ['Java', 'linked lists', 'trees', 'Big-O analysis'],
    review_text: 'Hard but worth it. Start the projects early, the test cases are strict.',
  },
  {
    user: 'priya_reviews', professor: 'Ben Okafor', course: 'ITSC 2214',
    date_written: '2025-05-10', semester: 'Spring 2025', grade: 'A-',
    overall_rating: 4, difficulty: 4, usefulness: 4, textbook_used: false,
    workload: 'Heavy', time_commitment: 9, skills: ['Java', 'recursion', 'hashing', 'graphs'],
    review_text: 'Lectures move fast. Office hours helped a lot with the graph project.',
  },
  {
    user: 'jordan_transfer', professor: 'Ben Okafor', course: 'ITSC 3146',
    date_written: '2025-12-20', semester: 'Fall 2025', grade: 'B',
    overall_rating: 3, difficulty: 4, usefulness: 4, textbook_used: true,
    workload: 'Moderate', time_commitment: 7, skills: ['C', 'Linux command line', 'processes and threads', 'sockets'],
    review_text: 'Assumes you are comfortable in a Linux terminal. Review C pointers before it starts.',
  },
  {
    user: 'priya_reviews', professor: 'Carla Nguyen', course: 'ITSC 3155',
    date_written: '2025-12-16', semester: 'Fall 2025', grade: 'A',
    overall_rating: 5, difficulty: 3, usefulness: 5, textbook_used: false,
    workload: 'Moderate', time_commitment: 6, skills: ['Git', 'TypeScript', 'REST APIs', 'testing', 'scrum'],
    review_text: 'Group project course. Your experience depends a lot on your team, so communicate early.',
  },
  {
    user: 'maya_cs', professor: 'Carla Nguyen', course: 'ITCS 3160',
    date_written: '2025-05-12', semester: 'Spring 2025', grade: 'A-',
    overall_rating: 4, difficulty: 3, usefulness: 5, textbook_used: true,
    workload: 'Moderate', time_commitment: 5, skills: ['SQL', 'ER diagrams', 'normalization'],
    review_text: 'Very practical. The SQL assignments are good resume material.',
  },
  {
    user: 'demo_user', professor: 'Daniel Price', course: 'ITIS 3135',
    date_written: '2025-12-11', semester: 'Fall 2025', grade: 'A',
    overall_rating: 4, difficulty: 2, usefulness: 4, textbook_used: false,
    workload: 'Light', time_commitment: 4, skills: ['HTML', 'CSS', 'JavaScript', 'accessibility'],
    review_text: 'Easygoing course. You build a personal site over the semester.',
  },
  {
    user: 'jordan_transfer', professor: 'Elena Rossi', course: 'ITIS 4166',
    date_written: '2025-05-08', semester: 'Spring 2025', grade: null,
    overall_rating: 4, difficulty: 3, usefulness: 5, textbook_used: false,
    workload: 'Moderate', time_commitment: 6, skills: ['Node.js', 'Express', 'Prisma', 'authentication'],
    review_text: 'Lots of small API assignments. Knowing JavaScript before you start makes it much easier.',
  },
  {
    user: 'maya_cs', professor: 'Farah Siddiqui', course: 'MATH 2164',
    date_written: '2025-12-19', semester: 'Fall 2025', grade: 'B',
    overall_rating: 3, difficulty: 4, usefulness: 3, textbook_used: true,
    workload: 'Moderate', time_commitment: 6, skills: ['Row reduction', 'vector spaces', 'eigenvalues'],
    review_text: 'Proof-heavy in the second half. Do the practice problems, the tests look like them.',
  },
  {
    user: 'demo_user', professor: 'George Hall', course: 'STAT 2122',
    date_written: '2025-05-14', semester: 'Spring 2025', grade: 'B+',
    overall_rating: 3, difficulty: 3, usefulness: 4, textbook_used: true,
    workload: 'Moderate', time_commitment: 5, skills: ['Probability', 'distributions', 'hypothesis testing'],
    review_text: 'Homework is long but graded generously. Useful background for data science.',
  },
];

// Stored as scrypt:<salt>:<hash>, using Node's built-in crypto module.
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed a production database.');
  }

  await db.transaction().execute(async (trx) => {
    // Clear existing rows so the script can be run more than once.
    await sql`
      TRUNCATE TABLE reviews, professor_courses, courses, professors, departments, users
      RESTART IDENTITY CASCADE
    `.execute(trx);

    const departmentRows = await trx
      .insertInto('departments')
      .values(departments.map((department_name) => ({ department_name })))
      .returning(['department_id', 'department_name'])
      .execute();
    const departmentIds = new Map(
      departmentRows.map((row) => [row.department_name, row.department_id])
    );

    const courseRows = await trx
      .insertInto('courses')
      .values(
        courses.map((course) => ({
          department_id: departmentIds.get(course.department)!,
          course_code: course.code,
          course_name: course.name,
        }))
      )
      .returning(['course_id', 'course_code'])
      .execute();
    const courseIds = new Map(
      courseRows.map((row) => [row.course_code, row.course_id])
    );

    const professorRows = await trx
      .insertInto('professors')
      .values(
        professors.map((professor) => ({
          department_id: departmentIds.get(professor.department)!,
          name: professor.name,
        }))
      )
      .returning(['professor_id', 'name'])
      .execute();
    const professorIds = new Map(
      professorRows.map((row) => [row.name, row.professor_id])
    );

    await trx
      .insertInto('professor_courses')
      .values(
        professors.flatMap((professor) =>
          professor.teaches.map((code) => ({
            professor_id: professorIds.get(professor.name)!,
            course_id: courseIds.get(code)!,
          }))
        )
      )
      .execute();

    const userRows = await trx
      .insertInto('users')
      .values(
        users.map((user) => ({
          username: user.username,
          email: user.email,
          password_hash: hashPassword(SEED_PASSWORD),
        }))
      )
      .returning(['user_id', 'username'])
      .execute();
    const userIds = new Map(
      userRows.map((row) => [row.username, row.user_id])
    );

    await trx
      .insertInto('reviews')
      .values(
        reviews.map(({ user, professor, course, ...fields }) => ({
          ...fields,
          user_id: userIds.get(user)!,
          professor_id: professorIds.get(professor)!,
          course_id: courseIds.get(course)!,
        }))
      )
      .execute();

    console.log(
      `Seeded ${departmentRows.length} departments, ${courseRows.length} courses, ` +
        `${professorRows.length} professors, ${userRows.length} users, ${reviews.length} reviews.`
    );
  });
}

main()
  .then(() => db.destroy())
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await db.destroy();
    process.exitCode = 1;
  });
