import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddCallToMessage1735382400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add callId column
        await queryRunner.addColumn(
            "Message",
            new TableColumn({
                name: "callId",
                type: "int",
                isNullable: true,
            })
        );

        // Add foreign key constraint
        await queryRunner.createForeignKey(
            "Message",
            new TableForeignKey({
                columnNames: ["callId"],
                referencedColumnNames: ["idCall"],
                referencedTableName: "Call",
                onDelete: "SET NULL",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key
        const table = await queryRunner.getTable("Message");
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("callId") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("Message", foreignKey);
        }

        // Drop column
        await queryRunner.dropColumn("Message", "callId");
    }
}
