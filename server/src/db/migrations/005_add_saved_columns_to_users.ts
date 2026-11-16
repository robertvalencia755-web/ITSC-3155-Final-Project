import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('saved_courses', sql`integer[]`, (col) =>
      col.notNull().defaultTo(sql`'{}'::integer[]`)
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropColumn('saved_courses')
    .execute();
}
