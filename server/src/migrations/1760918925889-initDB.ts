import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDB1760918925889 implements MigrationInterface {
    name = 'InitDB1760918925889'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`Users\` (\`idUser\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`emailVerified\` tinyint NOT NULL DEFAULT 0, \`avatarUrl\` varchar(255) NULL, \`phone\` varchar(255) NULL, \`birthday\` date NULL, \`gender\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`lastLogin\` datetime NULL, \`status\` enum ('locked', 'online', 'offline') NOT NULL DEFAULT 'offline', PRIMARY KEY (\`idUser\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`verified_code\` (\`idVerifiedCode\` int NOT NULL AUTO_INCREMENT, \`ExpiredAt\` datetime NOT NULL, \`CreatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`type\` enum ('email_verification', 'password_reset') NOT NULL, \`userIdUser\` int NULL, PRIMARY KEY (\`idVerifiedCode\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Groups\` (\`idGroup\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`statusGroup\` tinyint NOT NULL DEFAULT 1, \`createdBy\` int NULL, PRIMARY KEY (\`idGroup\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Message\` (\`idMessage\` int NOT NULL AUTO_INCREMENT, \`fileURL\` varchar(255) NULL, \`type\` enum ('text', 'image', 'file', 'audio', 'video') NOT NULL DEFAULT 'text', \`content\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`deletedAt\` datetime NULL, \`isEdited\` tinyint NOT NULL DEFAULT 0, \`editedAt\` datetime NULL, \`sentBy\` int NULL, \`sendToGroup\` int NULL, \`sendToUser\` int NULL, PRIMARY KEY (\`idMessage\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`MessageRead\` (\`id\` int NOT NULL AUTO_INCREMENT, \`readAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`messageId\` int NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Notification\` (\`idNotification\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('deleted', 'seen', 'pending') NOT NULL, \`content\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`type\` enum ('message', 'friendRequest', 'call') NOT NULL, \`type_id\` int NOT NULL, \`user_id\` int NULL, PRIMARY KEY (\`idNotification\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Group_User\` (\`idGroup_User\` int NOT NULL AUTO_INCREMENT, \`role\` enum ('admin', 'user', 'pending') NOT NULL DEFAULT 'user', \`idGroup\` int NULL, \`idUser\` int NULL, \`actionBy\` int NULL, UNIQUE INDEX \`REL_578f960a9fb33db9e8c5cd1ded\` (\`actionBy\`), PRIMARY KEY (\`idGroup_User\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`FriendShip\` (\`idFriendShip\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('pending', 'blocked', 'accepted') NOT NULL, \`requestAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`message\` varchar(255) NOT NULL, \`sender_id\` int NULL, \`friend_id\` int NULL, PRIMARY KEY (\`idFriendShip\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Call\` (\`idVideoInfor\` int NOT NULL AUTO_INCREMENT, \`startedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`endedAt\` datetime NULL, \`callStatus\` enum ('missed', 'ongoing', 'ended') NOT NULL, \`caller_id\` int NULL, \`receiver_id\` int NULL, PRIMARY KEY (\`idVideoInfor\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`verified_code\` ADD CONSTRAINT \`FK_c931d5da927cc3e98cb4e58f4d2\` FOREIGN KEY (\`userIdUser\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Groups\` ADD CONSTRAINT \`FK_99a38bd7adba412daa8be562f32\` FOREIGN KEY (\`createdBy\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Message\` ADD CONSTRAINT \`FK_badf4ea9ca7bd9c3bda2e7e5502\` FOREIGN KEY (\`sentBy\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Message\` ADD CONSTRAINT \`FK_60be24db1a32a7d189e662ef416\` FOREIGN KEY (\`sendToGroup\`) REFERENCES \`Groups\`(\`idGroup\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Message\` ADD CONSTRAINT \`FK_f11d069af1e282edbf752e59091\` FOREIGN KEY (\`sendToUser\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`MessageRead\` ADD CONSTRAINT \`FK_0426841a4b2f7e97b6021e768a3\` FOREIGN KEY (\`messageId\`) REFERENCES \`Message\`(\`idMessage\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`MessageRead\` ADD CONSTRAINT \`FK_536bf2a5058d91e37a338091ead\` FOREIGN KEY (\`userId\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Notification\` ADD CONSTRAINT \`FK_04bd9d7b08a1ea07d84fc22f284\` FOREIGN KEY (\`user_id\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Group_User\` ADD CONSTRAINT \`FK_0e440fe3e2a51dfef6e1ea50ac8\` FOREIGN KEY (\`idGroup\`) REFERENCES \`Groups\`(\`idGroup\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Group_User\` ADD CONSTRAINT \`FK_a2c6dbd9b815f9b82d3c69db84b\` FOREIGN KEY (\`idUser\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Group_User\` ADD CONSTRAINT \`FK_578f960a9fb33db9e8c5cd1dede\` FOREIGN KEY (\`actionBy\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`FriendShip\` ADD CONSTRAINT \`FK_bb2bfc72262ec0d7f093a009953\` FOREIGN KEY (\`sender_id\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`FriendShip\` ADD CONSTRAINT \`FK_275bd1a53f01f3ddb6eb20df0ab\` FOREIGN KEY (\`friend_id\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Call\` ADD CONSTRAINT \`FK_f12550693403b6b2ad2cf165eb0\` FOREIGN KEY (\`caller_id\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Call\` ADD CONSTRAINT \`FK_5d97b864d81a78d4a512d67b2b8\` FOREIGN KEY (\`receiver_id\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`Call\` DROP FOREIGN KEY \`FK_5d97b864d81a78d4a512d67b2b8\``);
        await queryRunner.query(`ALTER TABLE \`Call\` DROP FOREIGN KEY \`FK_f12550693403b6b2ad2cf165eb0\``);
        await queryRunner.query(`ALTER TABLE \`FriendShip\` DROP FOREIGN KEY \`FK_275bd1a53f01f3ddb6eb20df0ab\``);
        await queryRunner.query(`ALTER TABLE \`FriendShip\` DROP FOREIGN KEY \`FK_bb2bfc72262ec0d7f093a009953\``);
        await queryRunner.query(`ALTER TABLE \`Group_User\` DROP FOREIGN KEY \`FK_578f960a9fb33db9e8c5cd1dede\``);
        await queryRunner.query(`ALTER TABLE \`Group_User\` DROP FOREIGN KEY \`FK_a2c6dbd9b815f9b82d3c69db84b\``);
        await queryRunner.query(`ALTER TABLE \`Group_User\` DROP FOREIGN KEY \`FK_0e440fe3e2a51dfef6e1ea50ac8\``);
        await queryRunner.query(`ALTER TABLE \`Notification\` DROP FOREIGN KEY \`FK_04bd9d7b08a1ea07d84fc22f284\``);
        await queryRunner.query(`ALTER TABLE \`MessageRead\` DROP FOREIGN KEY \`FK_536bf2a5058d91e37a338091ead\``);
        await queryRunner.query(`ALTER TABLE \`MessageRead\` DROP FOREIGN KEY \`FK_0426841a4b2f7e97b6021e768a3\``);
        await queryRunner.query(`ALTER TABLE \`Message\` DROP FOREIGN KEY \`FK_f11d069af1e282edbf752e59091\``);
        await queryRunner.query(`ALTER TABLE \`Message\` DROP FOREIGN KEY \`FK_60be24db1a32a7d189e662ef416\``);
        await queryRunner.query(`ALTER TABLE \`Message\` DROP FOREIGN KEY \`FK_badf4ea9ca7bd9c3bda2e7e5502\``);
        await queryRunner.query(`ALTER TABLE \`Groups\` DROP FOREIGN KEY \`FK_99a38bd7adba412daa8be562f32\``);
        await queryRunner.query(`ALTER TABLE \`verified_code\` DROP FOREIGN KEY \`FK_c931d5da927cc3e98cb4e58f4d2\``);
        await queryRunner.query(`DROP TABLE \`Call\``);
        await queryRunner.query(`DROP TABLE \`FriendShip\``);
        await queryRunner.query(`DROP INDEX \`REL_578f960a9fb33db9e8c5cd1ded\` ON \`Group_User\``);
        await queryRunner.query(`DROP TABLE \`Group_User\``);
        await queryRunner.query(`DROP TABLE \`Notification\``);
        await queryRunner.query(`DROP TABLE \`MessageRead\``);
        await queryRunner.query(`DROP TABLE \`Message\``);
        await queryRunner.query(`DROP TABLE \`Groups\``);
        await queryRunner.query(`DROP TABLE \`verified_code\``);
        await queryRunner.query(`DROP TABLE \`Users\``);
    }

}
