import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateNotificationTypeEnum1760467200000 implements MigrationInterface {
    name = 'UpdateNotificationTypeEnum1760467200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Cập nhật enum type trong bảng Notification để thêm 'passwordChange'
        await queryRunner.query(`
            ALTER TABLE \`Notification\` 
            MODIFY COLUMN \`type\` enum('message','friendRequest','call','passwordChange') NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback - xóa 'passwordChange' khỏi enum
        await queryRunner.query(`
            ALTER TABLE \`Notification\` 
            MODIFY COLUMN \`type\` enum('message','friendRequest','call') NULL
        `);
    }
}