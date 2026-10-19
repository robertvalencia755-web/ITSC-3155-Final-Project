import 'dotenv/config';
import { sql } from 'kysely';
import { db } from './database';

// Sample data for local development. Professor names are made up.

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

async function main() {
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

    console.log(
      `Seeded ${departmentRows.length} departments, ${courseRows.length} courses, ` +
        `${professorRows.length} professors.`
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
