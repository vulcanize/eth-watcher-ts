import {MigrationInterface, QueryRunner} from "typeorm";

export class AddFieldsToReceipt1623406376710 implements MigrationInterface {
    name = 'AddFieldsToReceipt1623406376710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "eth"."receipt_cids" ADD COLUMN "post_state" VARCHAR(66)`);
        await queryRunner.query(`ALTER TABLE "eth"."receipt_cids" ADD COLUMN "post_status" INTEGER;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "eth"."receipt_cids" DROP COLUMN "post_status"`);
        await queryRunner.query(`ALTER TABLE "eth"."receipt_cids" DROP COLUMN "post_state"`);
    }
}
