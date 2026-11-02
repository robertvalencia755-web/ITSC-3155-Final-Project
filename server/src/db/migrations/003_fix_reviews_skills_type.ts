
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  const result = await sql<{ udt_name: string }>`
    SELECT udt_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'reviews'
      AND column_name = 'skills'
  `.execute(db);

  const columnType = result.rows[0]?.udt_name;

  if (!columnType) {
    throw new Error('Could not find reviews.skills column');
  }

  // Convert the old text column into a PostgreSQL text array.
  // Fresh databases already have text[], so no conversion is needed.
  if (columnType === 'text') {
    await sql`
      ALTER TABLE reviews
      ALTER COLUMN skills TYPE text[]
      USING skills::text[]
    `.execute(db);
  }
}

export async function down(_db: Kysely<unknown>): Promise<void> {
  // Intentionally irreversible.
  // Reverting to text would reintroduce the course search bug.
}
