
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('user_id', 'serial', (col) => col.primaryKey())
    .addColumn('username', 'varchar(50)', (col) =>
      col.notNull().unique()
    )
    .addColumn('email', 'varchar(255)', (col) =>
      col.notNull().unique()
    )
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createTable('departments')
    .addColumn('department_id', 'serial', (col) => col.primaryKey())
    .addColumn('department_name', 'varchar(100)', (col) =>
      col.notNull().unique()
    )
    .execute();

  await db.schema
    .createTable('professors')
    .addColumn('professor_id', 'serial', (col) => col.primaryKey())
    .addColumn('department_id', 'integer', (col) =>
      col.notNull().references('departments.department_id')
        .onDelete('restrict')
    )
    .addColumn('name', 'varchar(150)', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('courses')
    .addColumn('course_id', 'serial', (col) => col.primaryKey())
    .addColumn('department_id', 'integer', (col) =>
      col.notNull().references('departments.department_id')
        .onDelete('restrict')
    )
    .addColumn('course_code', 'varchar(30)', (col) => col.notNull())
    .addColumn('course_name', 'varchar(200)', (col) => col.notNull())
    .addUniqueConstraint('courses_department_code_unique', [
      'department_id',
      'course_code',
    ])
    .execute();

  await db.schema
    .createTable('professor_courses')
    .addColumn('professor_id', 'integer', (col) =>
      col.notNull().references('professors.professor_id')
        .onDelete('cascade')
    )
    .addColumn('course_id', 'integer', (col) =>
      col.notNull().references('courses.course_id')
        .onDelete('cascade')
    )
    .addPrimaryKeyConstraint('professor_courses_pk', [
      'professor_id',
      'course_id',
    ])
    .execute();

  await db.schema
    .createTable('reviews')
    .addColumn('review_id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.notNull().references('users.user_id').onDelete('cascade')
    )
    .addColumn('professor_id', 'integer', (col) => col.notNull())
    .addColumn('course_id', 'integer', (col) => col.notNull())
    .addColumn('date_written', 'date', (col) =>
      col.notNull().defaultTo(sql`CURRENT_DATE`)
    )
    .addColumn('overall_rating', 'integer', (col) =>
      col.notNull()
    )
    .addColumn('grade', 'varchar(10)')
    .addColumn('difficulty', 'integer', (col) => col.notNull())
    .addColumn('textbook_used', 'boolean', (col) => col.notNull())
    .addColumn('semester', 'varchar(30)', (col) => col.notNull())
    .addColumn('workload', 'varchar(100)')
    .addColumn('skills', 'text')
    .addColumn('time_commitment', 'integer')
    .addColumn('usefulness', 'integer', (col) => col.notNull())
    .addColumn('review_text', 'text', (col) => col.notNull())
    .addForeignKeyConstraint(
      'reviews_professor_course_fk',
      ['professor_id', 'course_id'],
      'professor_courses',
      ['professor_id', 'course_id'],
      (constraint) => constraint.onDelete('cascade')
    )
    .addCheckConstraint(
      'reviews_overall_rating_check',
      sql`overall_rating BETWEEN 1 AND 5`
    )
    .addCheckConstraint(
      'reviews_difficulty_check',
      sql`difficulty BETWEEN 1 AND 5`
    )
    .addCheckConstraint(
      'reviews_usefulness_check',
      sql`usefulness BETWEEN 1 AND 5`
    )
    .addCheckConstraint(
      'reviews_time_commitment_check',
      sql`time_commitment IS NULL OR time_commitment >= 0`
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('reviews').execute();
  await db.schema.dropTable('professor_courses').execute();
  await db.schema.dropTable('courses').execute();
  await db.schema.dropTable('professors').execute();
  await db.schema.dropTable('departments').execute();
  await db.schema.dropTable('users').execute();
}
