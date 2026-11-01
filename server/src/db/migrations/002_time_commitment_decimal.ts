
import { Kysely, sql } from 'kysely';

// isValidTimeCommitment accepts decimals like 5.5 hours, but the column was an integer,
// so a valid review could fail on insert. real keeps the existing >= 0 check.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('reviews')
    .alterColumn('time_commitment', (col) => col.setDataType('real'))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('reviews')
    .alterColumn('time_commitment', (col) =>
      col.setDataType(sql`integer USING round(time_commitment)::integer`)
    )
    .execute();
}
