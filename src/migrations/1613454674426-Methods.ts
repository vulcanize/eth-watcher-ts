import {MigrationInterface, QueryRunner} from "typeorm";

export class Methods1613454674426 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "data"."method_progress" ("method_progress_id" SERIAL NOT NULL, "contract_id" integer NOT NULL, "method_id" integer NOT NULL, "block_number" integer NOT NULL, CONSTRAINT "PK_2aa3b8c7e7777f775bd0ac851a8" PRIMARY KEY ("method_progress_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "method_progress_pk" ON "data"."method_progress" ("method_progress_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "data"."method_progress_pk"`);
        await queryRunner.query(`DROP TABLE "data"."method_progress"`);
    }

}
