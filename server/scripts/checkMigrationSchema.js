const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function extractTableNamesFromMigration(content) {
  const tableNames = new Set();
  // migration files contain SQL inside template strings where backticks may be escaped (\`) 
  // match both `table` and \`table\` forms
  const createRegex = /CREATE TABLE\s+\\?`([^`]+)`/g;
  let m;
  while ((m = createRegex.exec(content)) !== null) {
    tableNames.add(m[1]);
  }
  // normalize names: remove any escaping backslashes and lower-case for comparison with INFORMATION_SCHEMA
  return Array.from(tableNames).map(n => n.replace(/\\/g, '').trim()).map(n => n.toLowerCase());
}

(async () => {
  try {
    const migrationsDir = path.resolve(__dirname, '../src/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts'));
    const expectedTables = new Set();
    for (const f of files) {
      const content = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
      extractTableNamesFromMigration(content).forEach(t => expectedTables.add(t));
    }

    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

  console.log('Migrations files scanned:', files);
  console.log('Expected tables from migrations (normalized):', JSON.stringify(Array.from(expectedTables)));

    const report = [];
    for (const table of expectedTables) {
      const [tables] = await conn.query("SHOW TABLES LIKE ?", [table]);
      if (!tables.length) {
        report.push({ table, exists: false });
        continue;
      }
      const [cols] = await conn.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
        [process.env.DB_NAME, table]
      );
      report.push({ table, exists: true, columns: cols });
    }

    console.log('\n=== Schema report ===');
    for (const r of report) {
      console.log(`\nTable: ${r.table}`);
      console.log(`  Exists: ${r.exists}`);
      if (r.exists) {
        console.log(`  Columns (${r.columns.length}):`);
        r.columns.forEach(c => console.log(`    - ${c.COLUMN_NAME} | ${c.COLUMN_TYPE} | nullable=${c.IS_NULLABLE} | default=${c.COLUMN_DEFAULT}`));
      }
    }

    await conn.end();
  } catch (err) {
    console.error('Error during schema check:', err.message);
    process.exit(1);
  }
})();
