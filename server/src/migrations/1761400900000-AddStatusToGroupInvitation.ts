import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToGroupInvitationTable1761400900000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Group_Invitation" ADD "status" varchar NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Group_Invitation" DROP COLUMN "status"`);
    }
}
