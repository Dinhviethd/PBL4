import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCodeToVerifiedCode1760203092504 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`verified_code\` ADD \`code\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`verified_code\` DROP COLUMN \`code\``);
    }

}
