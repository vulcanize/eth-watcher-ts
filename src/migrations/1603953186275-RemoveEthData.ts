import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveEthData1603953186275 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "data"."transaction"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "data"."header"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
