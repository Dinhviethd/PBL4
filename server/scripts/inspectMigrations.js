const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to DB, checking migrations table and verified_code...');

    const [migrationsRows] = await conn.query("SELECT * FROM migrations ORDER BY id DESC LIMIT 20");
    console.log('=== migrations (top 20) ===');
    console.log(migrationsRows);

    const [tables] = await conn.query("SHOW TABLES LIKE 'verified_code'");
    console.log("\n=== verified_code table exists? ===");
    console.log(tables.length ? 'yes' : 'no', tables);

    await conn.end();
  } catch (err) {
    console.error('Error connecting/querying DB:', err.message);
    process.exit(1);
  }
})();
