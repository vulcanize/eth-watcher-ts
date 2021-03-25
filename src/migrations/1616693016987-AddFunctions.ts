import {MigrationInterface, QueryRunner} from "typeorm";

export class AddFunctions1616693016987 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public."ethHeaderCidByBlockNumber"(n bigint) RETURNS SETOF eth.header_cids
            LANGUAGE sql STABLE
            AS $_$
                SELECT * FROM eth.header_cids WHERE block_number=$1 ORDER BY id
            $_$;
            
            CREATE OR REPLACE FUNCTION public."ethTransactionCidByHash"(hash text) RETURNS SETOF eth.transaction_cids
            LANGUAGE sql STABLE
            AS $_$
                SELECT * FROM eth.transaction_cids WHERE tx_hash =$1 ORDER BY id DESC
            $_$;
            
            CREATE OR REPLACE FUNCTION public."allHeaderCidsV2"(max_block bigint DEFAULT NULL::bigint, take integer DEFAULT 10)
            RETURNS SETOF eth.header_cids
            LANGUAGE sql STABLE
            AS $function$
                SELECT * FROM eth.header_cids
                WHERE (block_number < $1 or $1 is null)
                ORDER BY block_number desc
                LIMIT $2
            $function$
            ;
            
            CREATE OR REPLACE FUNCTION public."transactionCidsByBlockNumber"(blockNumber bigint default null) RETURNS SETOF eth.transaction_cids
            LANGUAGE sql STABLE
            AS $_$
                SELECT t FROM eth.transaction_cids as t
                LEFT JOIN eth.header_cids as h
                    ON t.header_id = h.id
                WHERE h.block_number = $1
                ORDER BY block_number desc
            $_$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS public."ethHeaderCidByBlockNumber";
            DROP FUNCTION IF EXISTS public."ethTransactionCidByHash";
            DROP FUNCTION IF EXISTS public."allHeaderCidsV2";
            DROP FUNCTION IF EXISTS public."transactionCidsByBlockNumber";
        `);
    }

}
