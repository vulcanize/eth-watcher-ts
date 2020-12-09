import {MigrationInterface, QueryRunner} from "typeorm";

export class StateVariable1606457557226 implements MigrationInterface {
    name = 'StateVariable1606457557226'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract"."state" ADD "variable" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract"."state" DROP COLUMN "variable"`);
    }

}
