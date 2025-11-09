import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameVideoInfoToCall1735342500000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Kiểm tra xem table Call có tồn tại không
    const hasTable = await queryRunner.hasTable("Call");

    if (hasTable) {
      const table = await queryRunner.getTable("Call");
      
      // Kiểm tra xem column idVideoInfo có tồn tại không
      if (table?.findColumnByName("idVideoInfo")) {
        // Rename idVideoInfo -> idCall
        await queryRunner.renameColumn("Call", "idVideoInfo", "idCall");
        console.log("✅ Renamed column idVideoInfo -> idCall");
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("Call");

    if (hasTable) {
      const table = await queryRunner.getTable("Call");
      
      if (table?.findColumnByName("idCall")) {
        // Rename back idCall -> idVideoInfo
        await queryRunner.renameColumn("Call", "idCall", "idVideoInfo");
      }
    }
  }
}
