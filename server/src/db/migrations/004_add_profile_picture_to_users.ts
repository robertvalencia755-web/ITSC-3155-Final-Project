import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('profile_picture', 'text', (col) =>
      col.notNull().defaultTo('/assets/images/DefaultProfile.jpeg')
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropColumn('profile_picture')
    .execute();
}
