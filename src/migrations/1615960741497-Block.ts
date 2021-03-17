import {MigrationInterface, QueryRunner} from "typeorm";

export class Block1615960741497 implements MigrationInterface {
    name = 'Block1615960741497'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "eth"."block" ("key" text NOT NULL, "data" bytea NOT NULL, CONSTRAINT "PK_eec5ac2ade5007aa1d6baba8b44" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "block_pkey" ON "eth"."block" ("key") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "eth"."block_pkey"`);
        await queryRunner.query(`DROP TABLE "eth"."block"`);
    }

}
