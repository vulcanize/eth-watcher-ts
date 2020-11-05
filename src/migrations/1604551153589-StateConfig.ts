import {MigrationInterface, QueryRunner} from "typeorm";

export class StateConfig1604551153589 implements MigrationInterface {
    name = 'StateConfig1604551153589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contract"."state" (
            "state_id" SERIAL NOT NULL,
            "slot" integer NOT NULL,
            "type" character varying NOT NULL,
            CONSTRAINT "states_pk" PRIMARY KEY ("state_id")
        )`);
        await queryRunner.query(`ALTER TABLE "contract"."contracts" ADD "states" integer array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract"."contracts" DROP COLUMN "states"`);
        await queryRunner.query(`DROP TABLE "contract"."state"`);
    }

}
