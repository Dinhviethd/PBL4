import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class RecreateCallTableNoFK1735342700000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Xóa table Call nếu tồn tại
    const table = await queryRunner.getTable("Call");
    
    if (table) {
      // Xóa các foreign keys nếu có
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("Call", fk);
      }
      
      // Xóa bảng
      await queryRunner.dropTable("Call");
      console.log("✅ Dropped Call table");
    }

    // Tạo lại bảng mà không có foreign key (sẽ add sau)
    await queryRunner.createTable(
      new Table({
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

    console.log("✅ Created new Call table with idCall column");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("Call");
    
    if (table) {
      // Xóa foreign keys
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("Call", fk);
      }
      
      // Xóa bảng
      await queryRunner.dropTable("Call");
    }
  }
}
