const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Checking if `actionBy` column exists on `group_user`...');
    const [cols] = await conn.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'group_user' AND COLUMN_NAME = 'actionBy'", [process.env.DB_NAME]);
    if (cols.length) {
      console.log('Column `actionBy` already exists.');
    } else {
      console.log('Adding column `actionBy` to `group_user`...');
      await conn.query("ALTER TABLE `group_user` ADD COLUMN `actionBy` int NULL");
      console.log('Column added.');
    }

    console.log('Checking for FK constraint on `group_user.actionBy`...');
    const [fks] = await conn.query("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'group_user' AND COLUMN_NAME = 'actionBy' AND REFERENCED_TABLE_NAME IS NOT NULL", [process.env.DB_NAME]);
    if (fks.length) {
      console.log('Foreign key for `actionBy` already exists:', fks.map(f=>f.CONSTRAINT_NAME).join(', '));
    } else {
      console.log('Adding foreign key `FK_group_user_actionBy_users` -> users.idUser ...');
      try {
        await conn.query("ALTER TABLE `group_user` ADD CONSTRAINT `FK_group_user_actionBy_users` FOREIGN KEY (`actionBy`) REFERENCES `users`(`idUser`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        console.log('Foreign key added.');
      } catch (e) {
        console.log('Could not add foreign key (maybe users table missing or constraint exists):', e.message);
      }
    }

    const [result] = await conn.query('SHOW COLUMNS FROM `group_user`');
    console.log('Current `group_user` columns:');
    console.table(result);

    await conn.end();
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
