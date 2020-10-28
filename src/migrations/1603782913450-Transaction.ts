import {MigrationInterface, QueryRunner} from "typeorm";

export class Transaction1603782913450 implements MigrationInterface {
    name = 'Transaction1603782913450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "data"."transaction" (
                "id" SERIAL NOT NULL,
                "header_id" integer NOT NULL,
                "tx_hash" character varying(66) NOT NULL,
                "index" integer NOT NULL,
                "cid" text NOT NULL,
                "mh_key" text NOT NULL,
                "dst" character varying(66) NOT NULL,
                "src" character varying(66) NOT NULL,
                "deployment" boolean NOT NULL,
                "tx_data" bytea,
                "node_id" character varying(128) NOT NULL,
                CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
            )`);
        await queryRunner.query(`CREATE UNIQUE INDEX "transaction_header_id_tx_hash_key" ON "data"."transaction" ("header_id", "tx_hash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "data"."transaction"`);
    }

}
