import {MigrationInterface, QueryRunner} from "typeorm";

export class BackfillProgress1613123703285 implements MigrationInterface {
    name = 'BackfillProgress1613123703285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "data"."backfill_progress" ("backfill_progress_id" SERIAL NOT NULL, "contract_id" integer NOT NULL, "current" integer NOT NULL, "total" integer NOT NULL, CONSTRAINT "PK_c34f3d31fb4b1e50ca5db5aaf43" PRIMARY KEY ("backfill_progress_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "backfill_progress_pk" ON "data"."backfill_progress" ("backfill_progress_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "data"."backfill_progress_pk"`);
        await queryRunner.query(`DROP TABLE "data"."backfill_progress"`);
    }

}
