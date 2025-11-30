import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNeedAdminApproveToGroupInvitation1761400800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Group_Invitation ADD COLUMN needAdminApprove BOOLEAN DEFAULT FALSE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Group_Invitation DROP COLUMN needAdminApprove`);
  }
}
