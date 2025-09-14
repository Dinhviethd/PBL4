import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1694745600000 implements MigrationInterface {
    name = 'CreateTables1694745600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Users table
        await queryRunner.query(`
            CREATE TABLE \`Users\` (
                \`idUser\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`password\` varchar(255) NOT NULL,
                \`emailVerified\` boolean NOT NULL DEFAULT false,
                \`avatarUrl\` varchar(255),
                \`phone\` varchar(255),
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`lastLogin\` datetime,
                \`status\` enum('locked', 'online', 'offline') NOT NULL DEFAULT 'offline',
                PRIMARY KEY (\`idUser\`)
            ) ENGINE=InnoDB
        `);

        // Create VerifiedCode table
        await queryRunner.query(`
            CREATE TABLE \`verified_code\` (
                \`idVerifiedCode\` int NOT NULL AUTO_INCREMENT,
                \`ExpiredAt\` datetime NOT NULL,
                \`CreatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`type\` enum('email_verification', 'password_reset') NOT NULL,
                \`userId\` int,
                PRIMARY KEY (\`idVerifiedCode\`),
                FOREIGN KEY (\`userId\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Create Groups table
        await queryRunner.query(`
            CREATE TABLE \`Groups\` (
                \`idGroup\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`statusGroup\` boolean NOT NULL DEFAULT true,
                \`createdBy\` int,
                PRIMARY KEY (\`idGroup\`),
                FOREIGN KEY (\`createdBy\`) REFERENCES \`Users\`(\`idUser\`)
            ) ENGINE=InnoDB
        `);

        // Create Message table
        await queryRunner.query(`
            CREATE TABLE \`Message\` (
                \`idMessage\` int NOT NULL AUTO_INCREMENT,
                \`fileURL\` varchar(255),
                \`sentBy\` int,
                \`type\` enum('audio', 'video', 'message') NOT NULL,
                \`content\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`sendToGroup\` int,
                \`sendToUser\` int,
                \`isDeleted\` boolean NOT NULL DEFAULT false,
                \`deletedAt\` datetime,
                PRIMARY KEY (\`idMessage\`),
                FOREIGN KEY (\`sentBy\`) REFERENCES \`Users\`(\`idUser\`),
                FOREIGN KEY (\`sendToGroup\`) REFERENCES \`Groups\`(\`idGroup\`),
                FOREIGN KEY (\`sendToUser\`) REFERENCES \`Users\`(\`idUser\`)
            ) ENGINE=InnoDB
        `);

        // Create Group_User table
        await queryRunner.query(`
            CREATE TABLE \`Group_User\` (
                \`idGroup_User\` int NOT NULL AUTO_INCREMENT,
                \`idGroup\` int,
                \`idUser\` int,
                \`role\` enum('admin', 'user') NOT NULL DEFAULT 'user',
                PRIMARY KEY (\`idGroup_User\`),
                FOREIGN KEY (\`idGroup\`) REFERENCES \`Groups\`(\`idGroup\`),
                FOREIGN KEY (\`idUser\`) REFERENCES \`Users\`(\`idUser\`)
            ) ENGINE=InnoDB
        `);

        // Create Call table
        await queryRunner.query(`
            CREATE TABLE \`Call\` (
                \`idVideoInfor\` int NOT NULL AUTO_INCREMENT,
                \`caller_id\` int NOT NULL,
                \`receiver_id\` int NOT NULL,
                \`startedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`endedAt\` datetime,
                \`callStatus\` enum('missed', 'ongoing', 'ended'),
                PRIMARY KEY (\`idVideoInfor\`),
                FOREIGN KEY (\`caller_id\`) REFERENCES \`Users\`(\`idUser\`),
                FOREIGN KEY (\`receiver_id\`) REFERENCES \`Users\`(\`idUser\`)
            ) ENGINE=InnoDB
        `);

        // Create FriendShip table
        await queryRunner.query(`
            CREATE TABLE \`FriendShip\` (
                \`idFriendShip\` int NOT NULL AUTO_INCREMENT,
                \`sender_id\` int NOT NULL,
                \`friend_id\` int NOT NULL,
                \`status\` enum('pending', 'blocked', 'accepted'),
                \`requestAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`idFriendShip\`),
                FOREIGN KEY (\`sender_id\`) REFERENCES \`Users\`(\`idUser\`),
                FOREIGN KEY (\`friend_id\`) REFERENCES \`Users\`(\`idUser\`)
            ) ENGINE=InnoDB
        `);

        // Create Notification table
        await queryRunner.query(`
            CREATE TABLE \`Notification\` (
                \`idNotification\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` int NOT NULL,
                \`status\` enum('deleted', 'seen', 'pending'),
                \`content\` varchar(255),
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`type\` enum('message', 'friendRequest', 'call'),
                \`type_id\` int NOT NULL,
                PRIMARY KEY (\`idNotification\`),
                FOREIGN KEY (\`user_id\`) REFERENCES \`Users\`(\`idUser\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order (because of foreign key constraints)
        await queryRunner.query(`DROP TABLE \`Notification\``);
        await queryRunner.query(`DROP TABLE \`FriendShip\``);
        await queryRunner.query(`DROP TABLE \`Call\``);
        await queryRunner.query(`DROP TABLE \`Group_User\``);
        await queryRunner.query(`DROP TABLE \`Message\``);
        await queryRunner.query(`DROP TABLE \`Groups\``);
        await queryRunner.query(`DROP TABLE \`verified_code\``);
        await queryRunner.query(`DROP TABLE \`Users\``);
    }
}