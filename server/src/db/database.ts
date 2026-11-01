import 'dotenv/config';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './types.js';

// Return DATE columns (OID 1082) as 'YYYY-MM-DD' strings. By default pg makes a JS Date at
// local midnight, which JSON turns into UTC and can show as the previous day.
pg.types.setTypeParser(1082, (value) => value);

const dbURL = process.env.DATABASE_URL;

if (!dbURL) {
  throw new Error(
    'DATABASE_URL is missing. Copy server/.env.example to server/.env.'
  );
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({pool: new pg.Pool({connectionString: dbURL,}),}),
});
