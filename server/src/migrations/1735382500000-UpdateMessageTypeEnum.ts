import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class UpdateMessageTypeEnum1735382500000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop old enum and recreate with 'call' option
        await queryRunner.query(
            `ALTER TABLE Message MODIFY COLUMN type ENUM('text', 'image', 'file', 'audio', 'video', 'call') DEFAULT 'text'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to old enum without 'call'
        await queryRunner.query(
            `ALTER TABLE Message MODIFY COLUMN type ENUM('text', 'image', 'file', 'audio', 'video') DEFAULT 'text'`
        );
    }
}
