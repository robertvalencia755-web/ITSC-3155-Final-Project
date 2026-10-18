import 'dotenv/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { db } from './database';

async function main() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    console.log(`${result.status}: ${result.migrationName}`);
  });

  if (error) {
    throw error;
  }
}

main()
  .then(() => db.destroy())
  .catch(async (error) => {
    console.error('Migration failed:', error);
    await db.destroy();
    process.exitCode = 1;
  });
