import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class UpdateCallModel1735342400000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Kiểm tra xem table Call đã tồn tại
    const hasTable = await queryRunner.hasTable("Call");

    if (!hasTable) {
      // Nếu table chưa tồn tại, tạo table mới
      await queryRunner.createTable(
        new (require("typeorm").Table)({
          name: "Call",
          columns: [
            {
              name: "idCall",
              type: "int",
              isPrimary: true,
              isGenerated: true,
              generationStrategy: "increment",
            },
            {
              name: "caller_id",
              type: "int",
              isNullable: false,
            },
            {
              name: "receiver_id",
              type: "int",
              isNullable: false,
            },
            {
              name: "callType",
              type: "enum",
              enum: ["audio", "video"],
              default: "'audio'",
            },
            {
              name: "startedAt",
              type: "datetime",
              default: "CURRENT_TIMESTAMP",
            },
            {
              name: "answeredAt",
              type: "datetime",
              isNullable: true,
            },
            {
              name: "endedAt",
              type: "datetime",
              isNullable: true,
            },
            {
              name: "callStatus",
              type: "enum",
              enum: ["missed", "ongoing", "ended"],
              default: "'missed'",
            },
            {
              name: "duration",
              type: "int",
              isNullable: true,
            },
            {
              name: "updatedAt",
              type: "datetime",
              default: "CURRENT_TIMESTAMP",
              onUpdate: "CURRENT_TIMESTAMP",
            },
          ],
          foreignKeys: [
            {
              columnNames: ["caller_id"],
              referencedTableName: "User",
              referencedColumnNames: ["idUser"],
              onDelete: "CASCADE",
            },
            {
              columnNames: ["receiver_id"],
              referencedTableName: "User",
              referencedColumnNames: ["idUser"],
              onDelete: "CASCADE",
            },
          ],
          indices: [
            {
              columnNames: ["caller_id"],
            },
            {
              columnNames: ["receiver_id"],
            },
            {
              columnNames: ["startedAt"],
            },
          ],
        })
      );
    } else {
      // Nếu table đã tồn tại, cập nhật columns
      const table = await queryRunner.getTable("Call");

      // Kiểm tra và thêm các column mới nếu chưa tồn tại
      if (!table?.findColumnByName("callType")) {
        await queryRunner.addColumn(
          "Call",
          new TableColumn({
            name: "callType",
            type: "enum",
            enum: ["audio", "video"],
            default: "'audio'",
            isNullable: false,
          })
        );
      }

      if (!table?.findColumnByName("answeredAt")) {
        await queryRunner.addColumn(
          "Call",
          new TableColumn({
            name: "answeredAt",
            type: "datetime",
            isNullable: true,
          })
        );
      }

      if (!table?.findColumnByName("duration")) {
        await queryRunner.addColumn(
          "Call",
          new TableColumn({
            name: "duration",
            type: "int",
            isNullable: true,
          })
        );
      }

      if (!table?.findColumnByName("updatedAt")) {
        await queryRunner.addColumn(
          "Call",
          new TableColumn({
            name: "updatedAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          })
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("Call");
    
    if (table) {
      if (table.findColumnByName("updatedAt")) {
        await queryRunner.dropColumn("Call", "updatedAt");
      }
      if (table.findColumnByName("duration")) {
        await queryRunner.dropColumn("Call", "duration");
      }
      if (table.findColumnByName("answeredAt")) {
        await queryRunner.dropColumn("Call", "answeredAt");
      }
      if (table.findColumnByName("callType")) {
        await queryRunner.dropColumn("Call", "callType");
      }
    }
  }
}
