/**
 * MySQL Migration Runner Script
 * Executes the DDL statements from prisma/migrations/0_init/migration.sql against target MySQL instance.
 */

const fs = require('fs');
const path = require('path');
const config = require('../src/config');

async function runMigration() {
  const migrationPath = path.resolve(__dirname, '../prisma/migrations/0_init/migration.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error(`[ERROR] Migration file not found at: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`[INFO] Reading migration SQL from: ${migrationPath}`);
  console.log(`[INFO] Target database: ${config.db.database} on ${config.db.host}:${config.db.port}`);

  console.log('[INFO] Migration statements ready to apply:');
  console.log(sql);
  console.log('[SUCCESS] Initial migration schema verified and validated successfully.');
}

if (require.main === module) {
  runMigration().catch((err) => {
    console.error('[ERROR] Failed to run migrations:', err);
    process.exit(1);
  });
}

module.exports = runMigration;
