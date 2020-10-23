import {MigrationInterface, QueryRunner} from "typeorm";

export class HeaderNodeId1603268418026 implements MigrationInterface {
    name = 'HeaderNodeId1603268418026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data"."header" ALTER COLUMN "node_id" TYPE character varying(128)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data"."header" ALTER COLUMN "node_id" TYPE integer`);
    }

}
