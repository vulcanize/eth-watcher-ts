import {MigrationInterface, QueryRunner} from "typeorm";

export class Header1603266174323 implements MigrationInterface {
    name = 'Header1603266174323'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "data"."header" ("id" integer NOT NULL, "block_number" bigint NOT NULL, "block_hash" character varying(66) NOT NULL, "parent_hash" character varying(66) NOT NULL, "cid" text NOT NULL, "mh_key" text NOT NULL, "td" numeric NOT NULL, "node_id" integer NOT NULL, "reward" numeric NOT NULL, "state_root" character varying(66) NOT NULL, "tx_root" character varying(66) NOT NULL, "receipt_root" character varying(66) NOT NULL, "uncle_root" character varying(66) NOT NULL, "bloom" bytea NOT NULL, "timestamp" numeric NOT NULL, "times_validated" integer NOT NULL DEFAULT 1, CONSTRAINT "header_pkey" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "header_block_number_block_hash_key" ON "data"."header" ("block_hash", "block_number") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "data"."header_block_number_block_hash_key"`);
        await queryRunner.query(`DROP TABLE "data"."header"`);
    }

}
