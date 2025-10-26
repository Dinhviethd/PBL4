const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const migrationsToRegister = [
  { timestamp: 1761360421950, name: 'Migrations1761360421950' },
  { timestamp: 1761400712482, name: 'FixDB1761400712482' }
];

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    for (const m of migrationsToRegister) {
      const [rows] = await conn.query('SELECT * FROM migrations WHERE timestamp = ? OR name = ?', [m.timestamp, m.name]);
      if (rows.length) {
        console.log(`Migration already recorded: ${m.name}`);
        continue;
      }
      await conn.query('INSERT INTO migrations (timestamp, name) VALUES (?, ?)', [m.timestamp, m.name]);
      console.log(`Inserted migration record: ${m.name}`);
    }

    await conn.end();
    console.log('Done.');
  } catch (err) {
    console.error('Error registering migrations:', err.message);
    process.exit(1);
  }
})();
