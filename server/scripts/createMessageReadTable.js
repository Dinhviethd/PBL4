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

    console.log('Creating table message_read if not exists...');

    const createSQL = `CREATE TABLE IF NOT EXISTS \`message_read\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`readAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`messageId\` int NULL,
      \`userId\` int NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB`;

    await conn.query(createSQL);

    // add foreign keys if target tables exist
    try {
      await conn.query(`ALTER TABLE \`message_read\` ADD CONSTRAINT FK_msg_read_message FOREIGN KEY (messageId) REFERENCES \`message\`(idMessage)`);
      console.log('Added FK message_read.messageId -> message.idMessage');
    } catch (e) {
      console.log('Could not add FK to message (maybe already exists or target missing):', e.message);
    }

    try {
      await conn.query(`ALTER TABLE \`message_read\` ADD CONSTRAINT FK_msg_read_user FOREIGN KEY (userId) REFERENCES \`users\`(idUser)`);
      console.log('Added FK message_read.userId -> users.idUser');
    } catch (e) {
      console.log('Could not add FK to users (maybe already exists or target missing):', e.message);
    }

    const [rows] = await conn.query('SHOW COLUMNS FROM `message_read`');
    console.log('message_read columns:');
    console.table(rows);

    await conn.end();
    console.log('Done.');
  } catch (err) {
    console.error('Error creating message_read table:', err.message);
    process.exit(1);
  }
})();
