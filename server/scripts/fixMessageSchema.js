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

    console.log('Altering Message table: adding updatedAt, isEdited, editedAt; modifying content to TEXT');

    // Conditionally add updatedAt
    const [hasUpdated] = await conn.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Message' AND COLUMN_NAME = 'updatedAt'", [process.env.DB_NAME]);
    if (!hasUpdated.length) {
      await conn.query("ALTER TABLE `Message` ADD COLUMN `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
      console.log('added updatedAt');
    } else console.log('updatedAt already exists');

    // Conditionally add isEdited
    const [hasIsEdited] = await conn.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Message' AND COLUMN_NAME = 'isEdited'", [process.env.DB_NAME]);
    if (!hasIsEdited.length) {
      await conn.query("ALTER TABLE `Message` ADD COLUMN `isEdited` tinyint NOT NULL DEFAULT 0");
      console.log('added isEdited');
    } else console.log('isEdited already exists');

    // Conditionally add editedAt
    const [hasEditedAt] = await conn.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Message' AND COLUMN_NAME = 'editedAt'", [process.env.DB_NAME]);
    if (!hasEditedAt.length) {
      await conn.query("ALTER TABLE `Message` ADD COLUMN `editedAt` datetime NULL");
      console.log('added editedAt');
    } else console.log('editedAt already exists');

    // Modify content to TEXT if it's not already TEXT
    const [contentCol] = await conn.query("SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Message' AND COLUMN_NAME = 'content'", [process.env.DB_NAME]);
    if (contentCol.length && !/text/i.test(contentCol[0].COLUMN_TYPE)) {
      await conn.query("ALTER TABLE `Message` MODIFY COLUMN `content` TEXT NOT NULL");
      console.log('modified content to TEXT');
    } else if (!contentCol.length) {
      console.log('content column not found');
    } else {
      console.log('content is already TEXT');
    }

    console.log('Alterations applied. Current columns:');
    const [rows] = await conn.query("SHOW COLUMNS FROM `Message`");
    console.table(rows);

    await conn.end();
  } catch (err) {
    console.error('Error applying schema fixes:', err.message);
    process.exit(1);
  }
})();
