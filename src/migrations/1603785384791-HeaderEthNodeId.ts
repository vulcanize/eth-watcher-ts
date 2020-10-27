import {MigrationInterface, QueryRunner} from "typeorm";

export class HeaderEthNodeId1603785384791 implements MigrationInterface {
    name = 'HeaderEthNodeId1603785384791'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data"."header" ADD "eth_node_id" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data"."header" DROP COLUMN "eth_node_id"`);
    }

}
