import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCodeColumnToVerifiedCode1735740000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE verified_code ADD COLUMN code varchar(255) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE verified_code DROP COLUMN code`);
  }
}
