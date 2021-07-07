import {MigrationInterface, QueryRunner} from "typeorm";

export class ReceiptGasUsed1623406376711 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE eth.receipt_cids ADD COLUMN gas_used BIGINT DEFAULT 0 NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "eth"."receipt_cids" DROP COLUMN "gas_used"`);
    }
}
