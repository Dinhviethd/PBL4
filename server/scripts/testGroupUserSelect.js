const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
(async () => {
  try {
    const c = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    const userId = process.argv[2] ? Number(process.argv[2]) : 1;
    const [r] = await c.query('SELECT gu.`idGroup_User` FROM `group_user` gu WHERE gu.idUser = ? LIMIT 5', [userId]);
    console.log(r);
    await c.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
