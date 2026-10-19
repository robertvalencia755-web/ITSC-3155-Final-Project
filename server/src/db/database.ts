import 'dotenv/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from './types.js';

const dbURL = process.env.DATABASE_URL;

if (!dbURL) {
  throw new Error(
    'DATABASE_URL is missing.'
  );
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({pool: new Pool({connectionString: dbURL,}),}),
});
