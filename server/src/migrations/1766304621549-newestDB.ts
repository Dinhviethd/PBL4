import { MigrationInterface, QueryRunner } from "typeorm";

export class NewestDB1766304621549 implements MigrationInterface {
    name = 'NewestDB1766304621549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`verified_code\` (\`idverifiedcode\` int NOT NULL AUTO_INCREMENT, \`expiredat\` datetime NOT NULL, \`createdat\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`type\` enum ('email_verification', 'password_reset') NOT NULL, \`code\` varchar(255) NULL, \`userIdUser\` int NULL, PRIMARY KEY (\`idverifiedcode\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`groups\` (\`idgroup\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`createdat\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`statusgroup\` tinyint NOT NULL DEFAULT 1, \`createdby\` int NULL, PRIMARY KEY (\`idgroup\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`group_user\` (\`idgroup_user\` int NOT NULL AUTO_INCREMENT, \`role\` enum ('admin', 'user') NOT NULL DEFAULT 'user', \`idgroup\` int NULL, \`iduser\` int NULL, \`actionby\` int NULL, PRIMARY KEY (\`idgroup_user\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`iduser\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`emailverified\` tinyint NOT NULL DEFAULT 0, \`avatarurl\` varchar(255) NULL, \`phone\` varchar(255) NULL, \`birthday\` date NULL, \`gender\` varchar(255) NULL, \`createdat\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`lastlogin\` datetime NULL, \`status\` enum ('locked', 'online', 'offline') NOT NULL DEFAULT 'offline', PRIMARY KEY (\`iduser\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notification\` (\`idnotification\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('deleted', 'seen', 'pending') NOT NULL, \`content\` varchar(255) NOT NULL, \`createdat\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`type\` enum ('message', 'friendRequest', 'call', 'passwordChange', 'groupInvite', 'groupInviteAdmin', 'groupMemberJoined', 'friendAccept') NOT NULL, \`type_id\` int NOT NULL, \`user_id\` int NULL, PRIMARY KEY (\`idnotification\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`call\` (\`idcall\` int NOT NULL AUTO_INCREMENT, \`caller_id\` int NOT NULL, \`receiver_id\` int NOT NULL, \`calltype\` enum ('audio', 'video') NOT NULL DEFAULT 'audio', \`startedat\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`answeredat\` datetime NULL, \`endedat\` datetime NULL, \`callstatus\` enum ('missed', 'ongoing', 'ended') NOT NULL DEFAULT 'missed', \`duration\` int NULL, \`updatedat\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`idcall\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`message\` (\`idmessage\` int NOT NULL AUTO_INCREMENT, \`fileurl\` varchar(255) NULL, \`type\` enum ('text', 'image', 'file', 'audio', 'video', 'call') NOT NULL DEFAULT 'text', \`content\` text NOT NULL, \`createdat\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedat\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`isdeleted\` tinyint NOT NULL DEFAULT 0, \`deletedat\` datetime NULL, \`isedited\` tinyint NOT NULL DEFAULT 0, \`editedat\` datetime NULL, \`callid\` int NULL, \`sentby\` int NULL, \`sendtogroup\` int NULL, \`sendtouser\` int NULL, PRIMARY KEY (\`idmessage\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`message_read\` (\`id\` int NOT NULL AUTO_INCREMENT, \`readat\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`messageid\` int NULL, \`userid\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`group_invitation\` (\`idinvitation\` int NOT NULL AUTO_INCREMENT, \`message\` text NULL, \`createdat\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`needadminapprove\` tinyint NOT NULL DEFAULT 0, \`status\` enum ('pending', 'accepted') NOT NULL DEFAULT 'pending', \`idgroup\` int NULL, \`inviter\` int NULL, \`invitee\` int NULL, PRIMARY KEY (\`idinvitation\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`friendship\` (\`idfriendship\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('pending', 'blocked', 'accepted') NOT NULL, \`requestat\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`message\` varchar(255) NOT NULL, \`sender_id\` int NULL, \`friend_id\` int NULL, PRIMARY KEY (\`idfriendship\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`verified_code\` ADD CONSTRAINT \`FK_c931d5da927cc3e98cb4e58f4d2\` FOREIGN KEY (\`userIdUser\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`groups\` ADD CONSTRAINT \`FK_b65ce0d6f33684c7ee768b987a7\` FOREIGN KEY (\`createdby\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_user\` ADD CONSTRAINT \`FK_c2d6a2d56f832c26aca63e4d42e\` FOREIGN KEY (\`idgroup\`) REFERENCES \`groups\`(\`idgroup\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_user\` ADD CONSTRAINT \`FK_7452f105fb721369a7b2a60b8ba\` FOREIGN KEY (\`iduser\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_user\` ADD CONSTRAINT \`FK_10f04a8977196876affed68f5b3\` FOREIGN KEY (\`actionby\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_928b7aa1754e08e1ed7052cb9d8\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`call\` ADD CONSTRAINT \`FK_6ea8705505f1201c7ab0e7279a9\` FOREIGN KEY (\`caller_id\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`call\` ADD CONSTRAINT \`FK_258b2c91e5086b98b2be26a01c2\` FOREIGN KEY (\`receiver_id\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_5d4118f246bfcd9a0fc523ef931\` FOREIGN KEY (\`sentby\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_f36a30ad68d1529e274465b23e2\` FOREIGN KEY (\`sendtogroup\`) REFERENCES \`groups\`(\`idgroup\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_3f55cad48c9333c7caca6af24d1\` FOREIGN KEY (\`sendtouser\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_6f1b7cb9c3d24e0bffcbc3edff6\` FOREIGN KEY (\`callid\`) REFERENCES \`call\`(\`idcall\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message_read\` ADD CONSTRAINT \`FK_dcd43f85c32693c4ff7994043c2\` FOREIGN KEY (\`messageid\`) REFERENCES \`message\`(\`idmessage\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message_read\` ADD CONSTRAINT \`FK_d2c168ee4081c6d78002e318aa6\` FOREIGN KEY (\`userid\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_invitation\` ADD CONSTRAINT \`FK_177e2b7a4c9653e467fe2a1e23c\` FOREIGN KEY (\`idgroup\`) REFERENCES \`groups\`(\`idgroup\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_invitation\` ADD CONSTRAINT \`FK_d36b141d9499d2b773dd4345f21\` FOREIGN KEY (\`inviter\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_invitation\` ADD CONSTRAINT \`FK_47059d7987beab18103bd24102b\` FOREIGN KEY (\`invitee\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`friendship\` ADD CONSTRAINT \`FK_86463167c10dc37dbf9d39728bd\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`friendship\` ADD CONSTRAINT \`FK_8cadaad5534dd8b4827f05968ef\` FOREIGN KEY (\`friend_id\`) REFERENCES \`users\`(\`iduser\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`friendship\` DROP FOREIGN KEY \`FK_8cadaad5534dd8b4827f05968ef\``);
        await queryRunner.query(`ALTER TABLE \`friendship\` DROP FOREIGN KEY \`FK_86463167c10dc37dbf9d39728bd\``);
        await queryRunner.query(`ALTER TABLE \`group_invitation\` DROP FOREIGN KEY \`FK_47059d7987beab18103bd24102b\``);
        await queryRunner.query(`ALTER TABLE \`group_invitation\` DROP FOREIGN KEY \`FK_d36b141d9499d2b773dd4345f21\``);
        await queryRunner.query(`ALTER TABLE \`group_invitation\` DROP FOREIGN KEY \`FK_177e2b7a4c9653e467fe2a1e23c\``);
        await queryRunner.query(`ALTER TABLE \`message_read\` DROP FOREIGN KEY \`FK_d2c168ee4081c6d78002e318aa6\``);
        await queryRunner.query(`ALTER TABLE \`message_read\` DROP FOREIGN KEY \`FK_dcd43f85c32693c4ff7994043c2\``);
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_6f1b7cb9c3d24e0bffcbc3edff6\``);
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_3f55cad48c9333c7caca6af24d1\``);
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_f36a30ad68d1529e274465b23e2\``);
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_5d4118f246bfcd9a0fc523ef931\``);
        await queryRunner.query(`ALTER TABLE \`call\` DROP FOREIGN KEY \`FK_258b2c91e5086b98b2be26a01c2\``);
        await queryRunner.query(`ALTER TABLE \`call\` DROP FOREIGN KEY \`FK_6ea8705505f1201c7ab0e7279a9\``);
        await queryRunner.query(`ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_928b7aa1754e08e1ed7052cb9d8\``);
        await queryRunner.query(`ALTER TABLE \`group_user\` DROP FOREIGN KEY \`FK_10f04a8977196876affed68f5b3\``);
        await queryRunner.query(`ALTER TABLE \`group_user\` DROP FOREIGN KEY \`FK_7452f105fb721369a7b2a60b8ba\``);
        await queryRunner.query(`ALTER TABLE \`group_user\` DROP FOREIGN KEY \`FK_c2d6a2d56f832c26aca63e4d42e\``);
        await queryRunner.query(`ALTER TABLE \`groups\` DROP FOREIGN KEY \`FK_b65ce0d6f33684c7ee768b987a7\``);
        await queryRunner.query(`ALTER TABLE \`verified_code\` DROP FOREIGN KEY \`FK_c931d5da927cc3e98cb4e58f4d2\``);
        await queryRunner.query(`DROP TABLE \`friendship\``);
        await queryRunner.query(`DROP TABLE \`group_invitation\``);
        await queryRunner.query(`DROP TABLE \`message_read\``);
        await queryRunner.query(`DROP TABLE \`message\``);
        await queryRunner.query(`DROP TABLE \`call\``);
        await queryRunner.query(`DROP TABLE \`notification\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`group_user\``);
        await queryRunner.query(`DROP TABLE \`groups\``);
        await queryRunner.query(`DROP TABLE \`verified_code\``);
    }

}
