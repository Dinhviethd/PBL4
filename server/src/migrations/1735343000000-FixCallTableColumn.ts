import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class FixCallTableColumn1735343000000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("Call");

    if (hasTable) {
      const table = await queryRunner.getTable("Call");
      
      // Nếu vẫn là idVideoInfo, rename sang idCall
      if (table?.findColumnByName("idVideoInfo")) {
        try {
          await queryRunner.renameColumn("Call", "idVideoInfo", "idCall");
          console.log("✅ Renamed idVideoInfo -> idCall");
        } catch (err) {
          console.log("ℹ️ Column already renamed or doesn't exist");
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback không cần thiết
  }
}
