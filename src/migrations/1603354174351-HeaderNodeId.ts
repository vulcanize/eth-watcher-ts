import {MigrationInterface, QueryRunner} from "typeorm";

export class HeaderNodeId1603354174351 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix for postgraphile
        await queryRunner.query(`COMMENT ON TABLE "data"."header" IS E'Data Header';`);
        await queryRunner.query(`COMMENT ON COLUMN "data"."header"."node_id" IS E'Header Node Id';`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
