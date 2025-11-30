import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVerifiedCodeTable1735740100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS VerifiedCode (
        idVerifiedCode INT AUTO_INCREMENT PRIMARY KEY,
        ExpiredAt DATETIME NULL,
        type VARCHAR(50) NULL,
        code VARCHAR(255) NULL,
        userId INT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_VerifiedCode_User FOREIGN KEY (userId) REFERENCES User(idUser) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS VerifiedCode`);
  }
}
