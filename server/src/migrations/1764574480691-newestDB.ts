import { MigrationInterface, QueryRunner } from "typeorm";

export class NewestDB1764574480691 implements MigrationInterface {
    name = 'NewestDB1764574480691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`Groups\` (\`idGroup\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`statusGroup\` tinyint NOT NULL DEFAULT 1, \`createdBy\` int NULL, PRIMARY KEY (\`idGroup\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`group_user\` (\`idGroup_User\` int NOT NULL AUTO_INCREMENT, \`role\` enum ('admin', 'user') NOT NULL DEFAULT 'user', \`idGroup\` int NULL, \`idUser\` int NULL, \`actionBy\` int NULL, PRIMARY KEY (\`idGroup_User\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Users\` (\`idUser\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`emailVerified\` tinyint NOT NULL DEFAULT 0, \`avatarUrl\` varchar(255) NULL, \`phone\` varchar(255) NULL, \`birthday\` date NULL, \`gender\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`lastLogin\` datetime NULL, \`status\` enum ('locked', 'online', 'offline') NOT NULL DEFAULT 'offline', PRIMARY KEY (\`idUser\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`verified_code\` (\`idVerifiedCode\` int NOT NULL AUTO_INCREMENT, \`ExpiredAt\` datetime NOT NULL, \`CreatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`type\` enum ('email_verification', 'password_reset') NOT NULL, \`code\` varchar(255) NULL, \`userIdUser\` int NULL, PRIMARY KEY (\`idVerifiedCode\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Notification\` (\`idNotification\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('deleted', 'seen', 'pending') NOT NULL, \`content\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`type\` enum ('message', 'friendRequest', 'call', 'passwordChange', 'groupInvite', 'groupInviteAdmin', 'groupMemberJoined', 'friendAccept') NOT NULL, \`type_id\` int NOT NULL, \`user_id\` int NULL, PRIMARY KEY (\`idNotification\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Call\` (\`idCall\` int NOT NULL AUTO_INCREMENT, \`caller_id\` int NOT NULL, \`receiver_id\` int NOT NULL, \`callType\` enum ('audio', 'video') NOT NULL DEFAULT 'audio', \`startedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`answeredAt\` datetime NULL, \`endedAt\` datetime NULL, \`callStatus\` enum ('missed', 'ongoing', 'ended') NOT NULL DEFAULT 'missed', \`duration\` int NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`idCall\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Message\` (\`idMessage\` int NOT NULL AUTO_INCREMENT, \`fileURL\` varchar(255) NULL, \`type\` enum ('text', 'image', 'file', 'audio', 'video', 'call') NOT NULL DEFAULT 'text', \`content\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`deletedAt\` datetime NULL, \`isEdited\` tinyint NOT NULL DEFAULT 0, \`editedAt\` datetime NULL, \`callId\` int NULL, \`sentBy\` int NULL, \`sendToGroup\` int NULL, \`sendToUser\` int NULL, PRIMARY KEY (\`idMessage\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`message_read\` (\`id\` int NOT NULL AUTO_INCREMENT, \`readAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`messageId\` int NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Group_Invitation\` (\`idInvitation\` int NOT NULL AUTO_INCREMENT, \`message\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`needAdminApprove\` tinyint NOT NULL DEFAULT 0, \`status\` enum ('pending', 'accepted') NOT NULL DEFAULT 'pending', \`idGroup\` int NULL, \`inviter\` int NULL, \`invitee\` int NULL, PRIMARY KEY (\`idInvitation\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`FriendShip\` (\`idFriendShip\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('pending', 'blocked', 'accepted') NOT NULL, \`requestAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`message\` varchar(255) NOT NULL, \`sender_id\` int NULL, \`friend_id\` int NULL, PRIMARY KEY (\`idFriendShip\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`Groups\` ADD CONSTRAINT \`FK_99a38bd7adba412daa8be562f32\` FOREIGN KEY (\`createdBy\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_user\` ADD CONSTRAINT \`FK_ad0565f81f63bf970957f6e170c\` FOREIGN KEY (\`idGroup\`) REFERENCES \`Groups\`(\`idGroup\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_user\` ADD CONSTRAINT \`FK_63bedd5653f71544d67683c911f\` FOREIGN KEY (\`idUser\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_user\` ADD CONSTRAINT \`FK_8576d3bae305cd674dadbf9ec68\` FOREIGN KEY (\`actionBy\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`verified_code\` ADD CONSTRAINT \`FK_c931d5da927cc3e98cb4e58f4d2\` FOREIGN KEY (\`userIdUser\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Notification\` ADD CONSTRAINT \`FK_04bd9d7b08a1ea07d84fc22f284\` FOREIGN KEY (\`user_id\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Call\` ADD CONSTRAINT \`FK_f12550693403b6b2ad2cf165eb0\` FOREIGN KEY (\`caller_id\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Call\` ADD CONSTRAINT \`FK_5d97b864d81a78d4a512d67b2b8\` FOREIGN KEY (\`receiver_id\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Message\` ADD CONSTRAINT \`FK_badf4ea9ca7bd9c3bda2e7e5502\` FOREIGN KEY (\`sentBy\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Message\` ADD CONSTRAINT \`FK_60be24db1a32a7d189e662ef416\` FOREIGN KEY (\`sendToGroup\`) REFERENCES \`Groups\`(\`idGroup\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Message\` ADD CONSTRAINT \`FK_f11d069af1e282edbf752e59091\` FOREIGN KEY (\`sendToUser\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Message\` ADD CONSTRAINT \`FK_d5c8cf85d41420a7d39b1fb579d\` FOREIGN KEY (\`callId\`) REFERENCES \`Call\`(\`idCall\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message_read\` ADD CONSTRAINT \`FK_9799fb005881ecbe7f374fb8404\` FOREIGN KEY (\`messageId\`) REFERENCES \`Message\`(\`idMessage\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message_read\` ADD CONSTRAINT \`FK_35cf48794dcc13e887887bbaffb\` FOREIGN KEY (\`userId\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Group_Invitation\` ADD CONSTRAINT \`FK_5d78f2d28594662bcdab972786a\` FOREIGN KEY (\`idGroup\`) REFERENCES \`Groups\`(\`idGroup\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Group_Invitation\` ADD CONSTRAINT \`FK_5a744d7d8684e2608ff081e6b90\` FOREIGN KEY (\`inviter\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Group_Invitation\` ADD CONSTRAINT \`FK_46fda3cb4ed33b74c9d20629707\` FOREIGN KEY (\`invitee\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`FriendShip\` ADD CONSTRAINT \`FK_bb2bfc72262ec0d7f093a009953\` FOREIGN KEY (\`sender_id\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`FriendShip\` ADD CONSTRAINT \`FK_275bd1a53f01f3ddb6eb20df0ab\` FOREIGN KEY (\`friend_id\`) REFERENCES \`Users\`(\`idUser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`FriendShip\` DROP FOREIGN KEY \`FK_275bd1a53f01f3ddb6eb20df0ab\``);
        await queryRunner.query(`ALTER TABLE \`FriendShip\` DROP FOREIGN KEY \`FK_bb2bfc72262ec0d7f093a009953\``);
        await queryRunner.query(`ALTER TABLE \`Group_Invitation\` DROP FOREIGN KEY \`FK_46fda3cb4ed33b74c9d20629707\``);
        await queryRunner.query(`ALTER TABLE \`Group_Invitation\` DROP FOREIGN KEY \`FK_5a744d7d8684e2608ff081e6b90\``);
        await queryRunner.query(`ALTER TABLE \`Group_Invitation\` DROP FOREIGN KEY \`FK_5d78f2d28594662bcdab972786a\``);
        await queryRunner.query(`ALTER TABLE \`message_read\` DROP FOREIGN KEY \`FK_35cf48794dcc13e887887bbaffb\``);
        await queryRunner.query(`ALTER TABLE \`message_read\` DROP FOREIGN KEY \`FK_9799fb005881ecbe7f374fb8404\``);
        await queryRunner.query(`ALTER TABLE \`Message\` DROP FOREIGN KEY \`FK_d5c8cf85d41420a7d39b1fb579d\``);
        await queryRunner.query(`ALTER TABLE \`Message\` DROP FOREIGN KEY \`FK_f11d069af1e282edbf752e59091\``);
        await queryRunner.query(`ALTER TABLE \`Message\` DROP FOREIGN KEY \`FK_60be24db1a32a7d189e662ef416\``);
        await queryRunner.query(`ALTER TABLE \`Message\` DROP FOREIGN KEY \`FK_badf4ea9ca7bd9c3bda2e7e5502\``);
        await queryRunner.query(`ALTER TABLE \`Call\` DROP FOREIGN KEY \`FK_5d97b864d81a78d4a512d67b2b8\``);
        await queryRunner.query(`ALTER TABLE \`Call\` DROP FOREIGN KEY \`FK_f12550693403b6b2ad2cf165eb0\``);
        await queryRunner.query(`ALTER TABLE \`Notification\` DROP FOREIGN KEY \`FK_04bd9d7b08a1ea07d84fc22f284\``);
        await queryRunner.query(`ALTER TABLE \`verified_code\` DROP FOREIGN KEY \`FK_c931d5da927cc3e98cb4e58f4d2\``);
        await queryRunner.query(`ALTER TABLE \`group_user\` DROP FOREIGN KEY \`FK_8576d3bae305cd674dadbf9ec68\``);
        await queryRunner.query(`ALTER TABLE \`group_user\` DROP FOREIGN KEY \`FK_63bedd5653f71544d67683c911f\``);
        await queryRunner.query(`ALTER TABLE \`group_user\` DROP FOREIGN KEY \`FK_ad0565f81f63bf970957f6e170c\``);
        await queryRunner.query(`ALTER TABLE \`Groups\` DROP FOREIGN KEY \`FK_99a38bd7adba412daa8be562f32\``);
        await queryRunner.query(`DROP TABLE \`FriendShip\``);
        await queryRunner.query(`DROP TABLE \`Group_Invitation\``);
        await queryRunner.query(`DROP TABLE \`message_read\``);
        await queryRunner.query(`DROP TABLE \`Message\``);
        await queryRunner.query(`DROP TABLE \`Call\``);
        await queryRunner.query(`DROP TABLE \`Notification\``);
        await queryRunner.query(`DROP TABLE \`verified_code\``);
        await queryRunner.query(`DROP TABLE \`Users\``);
        await queryRunner.query(`DROP TABLE \`group_user\``);
        await queryRunner.query(`DROP TABLE \`Groups\``);
    }

}
